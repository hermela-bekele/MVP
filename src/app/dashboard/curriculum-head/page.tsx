'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { computeSubjectPerformance } from '@/lib/analytics';

export default function CurriculumHeadPortalPage() {
  const { studentGradeEntries, addNotification } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  
  const subjectPerformance = React.useMemo(() => computeSubjectPerformance(studentGradeEntries), [studentGradeEntries]);
  
  // Local Mock Textbooks shared state
  const [textbooks, setTextbooks] = useState([
    { id: 'tb-1', name: 'Grade 9 Biology Textbook', stream: 'Natural Science', downloads: 342, status: 'Synced with MOE v3.4' },
    { id: 'tb-2', name: 'Grade 10 Mathematics Syllabus Guide', stream: 'Common Core', downloads: 580, status: 'Synced with MOE v2.1' },
    { id: 'tb-3', name: 'Grade 11 Chemistry Laboratory Manual', stream: 'Natural Science', downloads: 120, status: 'Pending Lab Updates' },
    { id: 'tb-4', name: 'Grade 12 English grammar workbook', stream: 'Common Core', downloads: 910, status: 'Synced with MOE v4.0' },
  ]);

  const handleShareResource = (id: string) => {
    setTextbooks(
      textbooks.map((tb) => {
        if (tb.id === id) {
          addNotification('Resource Broadcasted', `Textbook "${tb.name}" was pushed nationwide to student portals.`, 'success');
          return { ...tb, downloads: tb.downloads + 1 };
        }
        return tb;
      })
    );
  };

  const coverageData = [
    { grade: 'Grade 9', stream: 'Natural Science', coverage: 78.4, status: 'On Track' },
    { grade: 'Grade 10', stream: 'Natural Science', coverage: 82.1, status: 'On Track' },
    { grade: 'Grade 11', stream: 'Natural Science', coverage: 64.8, status: 'Behind Schedule' },
    { grade: 'Grade 12', stream: 'Natural Science', coverage: 91.2, status: 'Completed' },
  ];

  const tabTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Curriculum Dashboard', subtitle: 'Syllabus coverage and subject performance.' },
    resources: { title: 'Resource Dissemination', subtitle: 'Publish textbooks to student portals.' },
  };
  const meta = tabTitles[activeTab] ?? tabTitles.dashboard;

  return (
    <DashboardShell
      activeTab={activeTab}
      setActiveTab={setActiveTab}
      title={meta.title}
      subtitle={meta.subtitle}
      eyebrow="Curriculum Management"
      actions={
        <span className="text-xs px-3 py-1.5 rounded-md bg-primary/10 text-primary font-medium border border-primary/20">
          W/ro Roman Tadesse
        </span>
      }
    >
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <KpiGrid>
                <KpiWidget label="Textbooks Synced" value={textbooks.length} hint="MOE aligned" tone="default" icon={<span>📚</span>} />
                <KpiWidget label="Avg Coverage" value="79%" hint="Grades 9–12" tone="emphasis" icon={<span>📈</span>} />
                <KpiWidget label="Behind Schedule" value="1" hint="Grade 11" tone="emphasis" icon={<span>⚠</span>} />
                <KpiWidget label="Total Downloads" value={textbooks.reduce((a, t) => a + t.downloads, 0)} hint="Nationwide" tone="default" icon={<span>⬇</span>} />
              </KpiGrid>
              
              {/* Coverage Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Syllabus Coverage Index */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Syllabus Completion Index by Grade</CardTitle>
                    <CardDescription>Estimated percentage of textbook chapters finalized relative to school weeks.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      {coverageData.map((cov) => (
                        <MetricProgressRow
                          key={cov.grade}
                          label={`${cov.grade} (${cov.stream})`}
                          headerExtra={
                            <span className="text-xs font-medium text-muted-foreground">{cov.status}</span>
                          }
                          value={cov.coverage}
                          barClassName={cov.status === 'Behind Schedule' ? 'bg-primary/50' : 'bg-primary'}
                          targetPercent={80}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Grade Averages Comparison */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">National Curriculum Sync Rates</CardTitle>
                    <CardDescription>Subject performance average and predicted national examination readiness index.</CardDescription>
                  </CardHeader>
                  <CardContent className="pt-2">
                    <div className="space-y-4">
                      {subjectPerformance.map((sub) => (
                        <div key={sub.subject} className="flex justify-between items-center p-3 bg-muted/40 border border-border/40 rounded-lg">
                          <div className="text-left">
                            <p className="text-xs font-semibold text-foreground">{sub.subject}</p>
                            <p className="text-[10px] text-muted-foreground mt-0.5">Coverage target: 80%</p>
                          </div>
                          
                          <div className="flex items-center space-x-3">
                            <div className="text-right">
                              <p className="text-[10px] font-bold text-muted-foreground">Class average</p>
                              <p className="text-xs font-bold text-foreground">{sub.average}%</p>
                            </div>
                            <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                              sub.status === 'Critical' ? 'bg-muted text-muted-foreground' : 'bg-primary/10 text-primary'
                            }`}>
                              {sub.average > 70 ? 'On Track' : 'Slowing'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

              </div>

            </div>
          )}

          {/* ==================================================== */}
          {/* TAB 2: RESOURCE DISSEMINATION                      */}
          {/* ==================================================== */}
          {activeTab === 'resources' && (
            <div className="space-y-6 animate-fade-in">
              <TablePanel
                title="Educational Asset Distribution"
                description="Broadcast government syllabus documents and PDF guidelines directly to student and teacher portals."
              >
                    <table className="eskooly-table">
                      <thead>
                        <tr>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Material Asset Name</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Target Stream</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">MOE Sync Status</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Simulated Downloads</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-muted-foreground">
                        {textbooks.map((tb) => (
                          <tr key={tb.id} className="hover:bg-muted/20">
                            <td className="p-3 font-bold text-foreground">{tb.name}</td>
                            <td className="p-3 font-semibold">{tb.stream}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-primary/10 text-primary border border-primary/20">
                                {tb.status}
                              </span>
                            </td>
                            <td className="p-3 font-mono font-bold text-foreground">{tb.downloads} files</td>
                            <td className="p-3">
                              <Button 
                                size="sm" 
                                onClick={() => handleShareResource(tb.id)}
                                className="text-xxs cursor-pointer h-8"
                              >
                                Broadcast Asset
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
              </TablePanel>
            </div>
          )}

    </DashboardShell>
  );
}
