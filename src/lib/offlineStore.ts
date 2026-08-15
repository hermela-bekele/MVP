/**
 * Browser offline persistence for PRIME portal data.
 * IndexedDB holds the last successful bootstrap snapshot + a mutation outbox.
 * AI generation, uploads, and realtime stay network-only.
 */

import type { BootstrapPayload } from '@/lib/api';

const DB_NAME = 'prime-offline';
const DB_VERSION = 1;
const SNAPSHOT_STORE = 'snapshots';
const OUTBOX_STORE = 'outbox';
const META_KEY = 'prime-offline-meta';

export type DataSource = 'api' | 'offline-cache' | 'mock';

export type OfflineSnapshot = {
  version: 1;
  savedAt: string;
  userKey: string;
  payload: BootstrapPayload;
};

export type OutboxOpType =
  | 'upsertGradeEntry'
  | 'deleteGradeEntry'
  | 'createTeachingNote'
  | 'updateTeachingNote'
  | 'deleteTeachingNote'
  | 'saveAttendance'
  | 'updateTrainingAssignmentStatus';

export type OutboxOp = {
  id: string;
  type: OutboxOpType;
  payload: Record<string, unknown>;
  createdAt: string;
};

export type OfflineMeta = {
  lastSyncedAt: string | null;
  dataSource: DataSource;
  pendingCount: number;
};

function isBrowser(): boolean {
  return typeof window !== 'undefined' && typeof indexedDB !== 'undefined';
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!isBrowser()) {
      reject(new Error('IndexedDB unavailable'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(SNAPSHOT_STORE)) {
        db.createObjectStore(SNAPSHOT_STORE, { keyPath: 'userKey' });
      }
      if (!db.objectStoreNames.contains(OUTBOX_STORE)) {
        db.createObjectStore(OUTBOX_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB open failed'));
  });
}

function idbReq<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error ?? new Error('IndexedDB request failed'));
  });
}

export function readOfflineMeta(): OfflineMeta {
  if (!isBrowser()) {
    return { lastSyncedAt: null, dataSource: 'mock', pendingCount: 0 };
  }
  try {
    const raw = localStorage.getItem(META_KEY);
    if (!raw) return { lastSyncedAt: null, dataSource: 'mock', pendingCount: 0 };
    return JSON.parse(raw) as OfflineMeta;
  } catch {
    return { lastSyncedAt: null, dataSource: 'mock', pendingCount: 0 };
  }
}

export function writeOfflineMeta(meta: Partial<OfflineMeta>): OfflineMeta {
  const next = { ...readOfflineMeta(), ...meta };
  if (isBrowser()) {
    try {
      localStorage.setItem(META_KEY, JSON.stringify(next));
    } catch {
      /* quota */
    }
  }
  return next;
}

export async function saveOfflineSnapshot(
  snapshot: OfflineSnapshot,
  opts?: { markSynced?: boolean },
): Promise<void> {
  if (!isBrowser()) return;
  try {
    const db = await openDb();
    const tx = db.transaction(SNAPSHOT_STORE, 'readwrite');
    await idbReq(tx.objectStore(SNAPSHOT_STORE).put(snapshot));
    db.close();
    if (opts?.markSynced) {
      writeOfflineMeta({
        lastSyncedAt: snapshot.savedAt,
        dataSource: 'api',
      });
    }
  } catch (err) {
    console.warn('[offline] Failed to save snapshot', err);
  }
}

export async function loadOfflineSnapshot(
  userKey = 'anon',
): Promise<OfflineSnapshot | null> {
  if (!isBrowser()) return null;
  try {
    const db = await openDb();
    const tx = db.transaction(SNAPSHOT_STORE, 'readonly');
    const store = tx.objectStore(SNAPSHOT_STORE);
    const exact = await idbReq<OfflineSnapshot | undefined>(store.get(userKey));
    if (exact?.payload) {
      db.close();
      return exact;
    }
    const all = await idbReq<OfflineSnapshot[]>(store.getAll());
    db.close();
    if (!all?.length) return null;
    return all.sort((a, b) => b.savedAt.localeCompare(a.savedAt))[0] ?? null;
  } catch (err) {
    console.warn('[offline] Failed to load snapshot', err);
    return null;
  }
}

export async function enqueueOutbox(
  type: OutboxOpType,
  payload: Record<string, unknown>,
): Promise<void> {
  if (!isBrowser()) return;
  const op: OutboxOp = {
    id: `ob-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    type,
    payload,
    createdAt: new Date().toISOString(),
  };
  try {
    const db = await openDb();
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    await idbReq(tx.objectStore(OUTBOX_STORE).put(op));
    db.close();
    const pending = await countOutbox();
    writeOfflineMeta({ pendingCount: pending });
  } catch (err) {
    console.warn('[offline] Failed to enqueue outbox', err);
  }
}

export async function listOutbox(): Promise<OutboxOp[]> {
  if (!isBrowser()) return [];
  try {
    const db = await openDb();
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const rows = await idbReq<OutboxOp[]>(tx.objectStore(OUTBOX_STORE).getAll());
    db.close();
    return (rows ?? []).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } catch {
    return [];
  }
}

export async function removeOutbox(id: string): Promise<void> {
  if (!isBrowser()) return;
  try {
    const db = await openDb();
    const tx = db.transaction(OUTBOX_STORE, 'readwrite');
    await idbReq(tx.objectStore(OUTBOX_STORE).delete(id));
    db.close();
    writeOfflineMeta({ pendingCount: await countOutbox() });
  } catch (err) {
    console.warn('[offline] Failed to remove outbox item', err);
  }
}

export async function countOutbox(): Promise<number> {
  if (!isBrowser()) return 0;
  try {
    const db = await openDb();
    const tx = db.transaction(OUTBOX_STORE, 'readonly');
    const n = await idbReq(tx.objectStore(OUTBOX_STORE).count());
    db.close();
    return n;
  } catch {
    return 0;
  }
}

export function isBrowserOnline(): boolean {
  if (!isBrowser()) return true;
  return navigator.onLine;
}

/** Empty bootstrap shell used when merging partial updates. */
export function emptyBootstrapPayload(): BootstrapPayload {
  return {
    schools: [],
    departments: [],
    teachers: [],
    students: [],
    classes: [],
    lessonPlans: [],
    assessments: [],
    attendance: [],
    trainings: [],
    checkIns: [],
    exams: [],
    trainingMaterials: [],
    teachingNotes: [],
    academicCalendars: [],
    studentGradeEntries: [],
    teacherResources: [],
    teacherFeedbacks: [],
    parentMessages: [],
    teacherCheckInPrompts: [],
    lessonDeliveries: [],
    communityPosts: [],
    communityReplies: [],
    staffMessages: [],
    teacherSelfAssessments: [],
    teacherTrainingAssignments: [],
    hrEmployees: [],
    leaveRequests: [],
    payrollRecords: [],
    jobPostings: [],
    jobApplications: [],
    performanceReviews: [],
    onboardingTasks: [],
    staffAttendance: [],
    notifications: [],
  };
}
