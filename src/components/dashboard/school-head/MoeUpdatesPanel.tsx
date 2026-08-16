'use client';

import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TablePanel } from '@/components/dashboard/TablePanel';
import {
  MOE_ACADEMIC_YEAR_TITLE,
  MOE_MAJOR_ACTIVITIES,
} from '@/lib/moeCalendarData';

const activityTypeVariant: Record<string, 'success' | 'warning' | 'danger' | 'info' | 'neutral'> = {
  moe: 'info',
  term: 'success',
  exam: 'warning',
  break: 'neutral',
  holiday: 'neutral',
};

function formatEcDate(ec: { year: number; month: number; day: number }) {
  return `${String(ec.day).padStart(2, '0')}/${String(ec.month).padStart(2, '0')}/${ec.year} E.C.`;
}

/** Read-only view of MOE circulars and compliance milestones the school head must track. */
export const MoeUpdatesPanel: React.FC = () => {
  return (
    <div className="space-y-6 animate-fade-in text-left">
      <Card className="border-border/60">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-bold text-foreground">{MOE_ACADEMIC_YEAR_TITLE}</CardTitle>
        </CardHeader>
        <CardContent className="text-xxs text-muted-foreground">
          <p>
            Official reference circular governing this academic year&apos;s term structure, exam windows,
            and registration deadlines as issued by the Ministry of Education.
          </p>
        </CardContent>
      </Card>

      <TablePanel
        title="Compliance Milestones"
      >
        <table className="eskooly-table">
          <thead>
            <tr>
              <th className="p-3 text-left text-muted-foreground font-semibold">Milestone</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Start (E.C.)</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">End (E.C.)</th>
              <th className="p-3 text-left text-muted-foreground font-semibold">Category</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border/40 text-muted-foreground">
            {MOE_MAJOR_ACTIVITIES.map((activity) => (
              <tr key={activity.id} className="hover:bg-muted/10">
                <td className="p-3 text-foreground font-bold">{activity.label}</td>
                <td className="p-3 font-mono">{formatEcDate(activity.startEc)}</td>
                <td className="p-3 font-mono">{formatEcDate(activity.endEc)}</td>
                <td className="p-3">
                  <Badge variant={activityTypeVariant[activity.type] ?? 'neutral'} size="sm" className="font-bold capitalize">
                    {activity.type}
                  </Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TablePanel>
    </div>
  );
};
