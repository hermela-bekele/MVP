import { api, ApiError } from '@/lib/api';
import { listOutbox, removeOutbox, writeOfflineMeta } from '@/lib/offlineStore';

/**
 * TE-012 root cause: the original loop stopped on the *first* failure of any kind, so
 * one op that could never succeed (e.g. editing a record deleted elsewhere, an expired
 * session, a permission the account no longer has) would jam the queue and leave every
 * later op stuck showing "Waiting to sync" forever, even though nothing was wrong with
 * them individually. Fix: a 4xx response means the server explicitly rejected that op —
 * retrying it unchanged will never succeed, so it's dropped (surfaced to the caller to
 * notify the user) instead of blocking the rest of the queue. A network failure or 5xx
 * means we likely lost connectivity or the server is down; that's genuinely worth
 * stopping for and retrying the whole remaining queue later.
 */
export function isClientRejection(err: unknown): err is ApiError {
  return err instanceof ApiError && err.status >= 400 && err.status < 500;
}

export async function flushOfflineOutbox(): Promise<{
  flushed: number;
  remaining: number;
  dropped: { type: string; error: string }[];
}> {
  const ops = await listOutbox();
  let flushed = 0;
  const dropped: { type: string; error: string }[] = [];

  for (const op of ops) {
    try {
      switch (op.type) {
        case 'upsertGradeEntry':
          await api.upsertGradeEntry(op.payload);
          break;
        case 'deleteGradeEntry':
          await api.deleteGradeEntry(String(op.payload.id));
          break;
        case 'createTeachingNote':
          await api.createTeachingNote(op.payload);
          break;
        case 'updateTeachingNote':
          await api.updateTeachingNote(String(op.payload.id), op.payload.updates as Record<string, unknown>);
          break;
        case 'deleteTeachingNote':
          await api.deleteTeachingNote(String(op.payload.id));
          break;
        case 'saveAttendance':
          await api.saveAttendance(
            op.payload.records as { studentId: string; status: string; remarks?: string }[],
            op.payload.timetableSlotId as string | undefined,
          );
          break;
        case 'updateTrainingAssignmentStatus':
          await api.updateTrainingAssignmentStatus(
            String(op.payload.id),
            op.payload.status as import('@/lib/mockData').TeacherTrainingAssignment['status'],
          );
          break;
        case 'updateTrainingPlan':
          await api.updateTrainingPlan(String(op.payload.id), { status: op.payload.status });
          break;
        default:
          break;
      }
      await removeOutbox(op.id);
      flushed += 1;
    } catch (err) {
      if (isClientRejection(err)) {
        console.warn('[offline] Dropping outbox op the server rejected — will not retry', op.type, err);
        await removeOutbox(op.id);
        dropped.push({ type: op.type, error: err.message });
        continue;
      }
      console.warn('[offline] Outbox flush stopped — connectivity/server issue, will retry later', op.type, err);
      break;
    }
  }

  const remaining = (await listOutbox()).length;
  writeOfflineMeta({ pendingCount: remaining });
  return { flushed, remaining, dropped };
}
