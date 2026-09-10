'use client';

import React, { useEffect, useState } from 'react';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { Inbox } from 'lucide-react';
import { useApp } from '@/context/AppContext';
import { api, resolveResourceUrl } from '@/lib/api';
import type { TeacherResource } from '@/lib/mockData';

/**
 * TE-010: HoD review queue for teacher-uploaded resources. Deliberately fetched
 * on-demand rather than folded into the global bootstrap state — the whole point of
 * the workflow is that pending/rejected uploads stay invisible to everyone except the
 * uploader and reviewing staff, so this list must never leak into the general
 * app-wide `teacherResources` (which only ever holds APPROVED rows).
 */
export const DeptResourcesReviewPanel: React.FC = () => {
  const { teachers, teacherResources, addNotification, refreshFromApi } = useApp();
  const [pending, setPending] = useState<TeacherResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [actingId, setActingId] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    void api
      .listPendingTeacherResources()
      .then((rows) => setPending(rows as TeacherResource[]))
      .catch(() => setPending([]))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const act = async (id: string, action: 'approve' | 'reject' | 'remove', title: string) => {
    setActingId(id);
    try {
      if (action === 'approve') await api.approveTeacherResource(id);
      else if (action === 'reject') await api.rejectTeacherResource(id, 'Please revise and resubmit.');
      else await api.removeTeacherResource(id, 'Removed by department head.');
      setPending((prev) => prev.filter((r) => r.id !== id));
      if (action === 'remove') {
        // Already-approved resources live in the shared bootstrap state, not this
        // panel's own `pending` list — refresh it so the removed one disappears
        // from every teacher's resource list too.
        void refreshFromApi();
      }
      addNotification(
        action === 'approve' ? 'Resource approved' : action === 'reject' ? 'Resource rejected' : 'Resource removed',
        `"${title}" ${action === 'approve' ? 'is now visible to teachers and students.' : action === 'reject' ? 'was sent back to the uploader.' : 'was removed.'}`,
        action === 'approve' ? 'success' : 'alert',
      );
    } catch {
      addNotification('Action failed', 'Could not update this resource. Try again.', 'alert');
    } finally {
      setActingId(null);
    }
  };

  return (
    <TablePanel
      title="Teacher-uploaded resources — pending review"
      description="Approve before a resource becomes visible to other teachers and students. Teachers cannot approve their own uploads."
    >
      <table className="eskooly-table">
        <thead>
          <tr>
            <th>Resource</th>
            <th>Uploaded by</th>
            <th>Grade / Subject</th>
            <th>Type</th>
            <th>Uploaded</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            <tr>
              <td colSpan={6} className="p-6 text-center text-sm text-muted-foreground">
                Loading…
              </td>
            </tr>
          ) : pending.length === 0 ? (
            <tr>
              <td colSpan={6} className="p-0">
                <EmptyState icon={<Inbox />} title="No resources awaiting review." className="py-8" />
              </td>
            </tr>
          ) : (
            pending.map((r) => {
              const teacher = teachers.find((t) => t.id === r.teacherId);
              return (
                <tr key={r.id} className="hover:bg-muted/20">
                  <td className="p-3 font-semibold text-foreground">
                    <a href={resolveResourceUrl(r.url)} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                      {r.title}
                    </a>
                  </td>
                  <td className="p-3">{teacher?.name ?? r.teacherId}</td>
                  <td className="p-3">{r.grade} · {r.subject}</td>
                  <td className="p-3">
                    <Badge variant="neutral" size="sm">{r.type}</Badge>
                  </td>
                  <td className="p-3">{r.createdAt}</td>
                  <td className="p-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === r.id}
                      onClick={() => void act(r.id, 'approve', r.title)}
                    >
                      Approve
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={actingId === r.id}
                      onClick={() => void act(r.id, 'reject', r.title)}
                    >
                      Reject
                    </Button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>

      <div className="mt-8">
        <h3 className="mb-1 text-sm font-semibold text-foreground">Approved resources</h3>
        <p className="mb-3 text-xs text-muted-foreground">
          Visible to every teacher and student. Remove one if it&apos;s no longer appropriate.
        </p>
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Resource</th>
              <th>Uploaded by</th>
              <th>Grade / Subject</th>
              <th>Type</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {teacherResources.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-0">
                  <EmptyState icon={<Inbox />} title="No approved resources yet." className="py-8" />
                </td>
              </tr>
            ) : (
              teacherResources.map((r) => {
                const teacher = teachers.find((t) => t.id === r.teacherId);
                return (
                  <tr key={r.id} className="hover:bg-muted/20">
                    <td className="p-3 font-semibold text-foreground">
                      <a href={resolveResourceUrl(r.url)} target="_blank" rel="noreferrer" className="hover:text-primary hover:underline">
                        {r.title}
                      </a>
                    </td>
                    <td className="p-3">{teacher?.name ?? r.teacherId}</td>
                    <td className="p-3">{r.grade} · {r.subject}</td>
                    <td className="p-3">
                      <Badge variant="neutral" size="sm">{r.type}</Badge>
                    </td>
                    <td className="p-3">
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={actingId === r.id}
                        onClick={() => void act(r.id, 'remove', r.title)}
                      >
                        Remove
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </TablePanel>
  );
};
