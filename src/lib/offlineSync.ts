import { api } from '@/lib/api';
import { listOutbox, removeOutbox, writeOfflineMeta } from '@/lib/offlineStore';

/**
 * Replay queued teacher mutations after reconnect.
 * Stops on first failure so remaining ops retry later.
 */
export async function flushOfflineOutbox(): Promise<{ flushed: number; remaining: number }> {
  const ops = await listOutbox();
  let flushed = 0;

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
      console.warn('[offline] Outbox flush stopped', op.type, err);
      break;
    }
  }

  const remaining = (await listOutbox()).length;
  writeOfflineMeta({ pendingCount: remaining });
  return { flushed, remaining };
}
