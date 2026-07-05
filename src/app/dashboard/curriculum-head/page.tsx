'use client';

import React, { useMemo, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uploadFile } from '@/lib/api';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { KpiWidget, KpiGrid } from '@/components/dashboard/KpiWidget';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { MetricProgressRow } from '@/components/ui/metric-progress-row';
import { computeSubjectPerformance } from '@/lib/analytics';

export default function CurriculumHeadPortalPage() {
  const {
    studentGradeEntries,
    trainingMaterials,
    addTrainingMaterial,
    disseminateTrainingMaterial,
    addNotification,
  } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');

  const [isResourceUploadOpen, setIsResourceUploadOpen] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [resourceUploading, setResourceUploading] = useState(false);
  const [resourceCategory, setResourceCategory] = useState('Pedagogy');
  const [resourceGrade, setResourceGrade] = useState('Grade 9');
  const [resourceSubject, setResourceSubject] = useState('Biology');

  const subjectPerformance = useMemo(
    () => computeSubjectPerformance(studentGradeEntries),
    [studentGradeEntries],
  );

  const curriculumResources = useMemo(
    () => trainingMaterials.filter((m) => !m.departmentId),
    [trainingMaterials],
  );

  const disseminatedCount = useMemo(
    () => curriculumResources.filter((m) => m.disseminated).length,
    [curriculumResources],
  );

  const handleUploadResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!resourceTitle || (!resourceFile && !resourceUrl.trim())) return;

    setResourceUploading(true);
    try {
      let finalUrl = resourceUrl.trim();
      if (resourceFile) {
        finalUrl = await uploadFile(resourceFile);
      }
      addTrainingMaterial({
        title: resourceTitle,
        resourceUrl: finalUrl,
        category: resourceCategory,
        grade: resourceGrade,
        subject: resourceSubject,
        trainingType: resourceCategory === 'STEM' ? 'STEM' : 'MOE Mandatory',
      });
      setResourceTitle('');
      setResourceUrl('');
      setResourceFile(null);
      setIsResourceUploadOpen(false);
    } catch (err) {
      addNotification(
        'Upload failed',
        err instanceof Error ? err.message : 'Could not upload file. Try again.',
        'alert',
      );
    } finally {
      setResourceUploading(false);
    }
  };

  const handleDisseminateResource = (id: string) => {
    disseminateTrainingMaterial(id);
  };

  const coverageData = [
    { grade: 'Grade 9', stream: 'Natural Science', coverage: 78.4, status: 'On Track' },
    { grade: 'Grade 10', stream: 'Natural Science', coverage: 82.1, status: 'On Track' },
    { grade: 'Grade 11', stream: 'Natural Science', coverage: 64.8, status: 'Behind Schedule' },
    { grade: 'Grade 12', stream: 'Natural Science', coverage: 91.2, status: 'Completed' },
  ];

  const tabTitles: Record<string, { title: string; subtitle?: string }> = {
    dashboard: { title: 'Curriculum Dashboard', subtitle: 'Syllabus coverage and subject performance.' },
    resources: { title: 'Resource Dissemination', subtitle: 'Upload and publish curriculum materials to teacher and student portals.' },
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
                <KpiWidget label="Curriculum Resources" value={curriculumResources.length} hint="MOE aligned" tone="default" icon={<span>📚</span>} />
                <KpiWidget label="Avg Coverage" value="79%" hint="Grades 9–12" tone="emphasis" icon={<span>📈</span>} />
                <KpiWidget label="Pending Broadcast" value={curriculumResources.length - disseminatedCount} hint="Draft resources" tone="emphasis" icon={<span>⚠</span>} />
                <KpiWidget label="Published" value={disseminatedCount} hint="Visible to teachers" tone="default" icon={<span>⬇</span>} />
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
              <div className="flex justify-end">
                <Button
                  variant="organic"
                  size="sm"
                  className="text-xs h-9 gap-1.5 border-none"
                  onClick={() => setIsResourceUploadOpen(true)}
                >
                  + Upload resource
                </Button>
              </div>

              <TablePanel
                title="Educational Asset Distribution"
                description="Upload government syllabus documents and PDF guidelines, then broadcast them to teacher and student portals."
              >
                    <table className="eskooly-table">
                      <thead>
                        <tr>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Material Asset Name</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Grade / Subject</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Category</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Uploaded</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Status</th>
                          <th className="p-3 text-muted-foreground font-semibold uppercase text-xxs">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/40 text-muted-foreground">
                        {curriculumResources.length === 0 ? (
                          <tr>
                            <td colSpan={6} className="p-8 text-center text-sm text-muted-foreground">
                              No curriculum resources uploaded yet.
                            </td>
                          </tr>
                        ) : (
                          curriculumResources.map((mat) => (
                            <tr key={mat.id} className="hover:bg-muted/20">
                              <td className="p-3 font-bold text-foreground">
                                <a
                                  href={mat.resourceUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="hover:text-primary hover:underline"
                                >
                                  {mat.title}
                                </a>
                              </td>
                              <td className="p-3 font-semibold">
                                {mat.grade && mat.subject
                                  ? `${mat.grade} · ${mat.subject}`
                                  : mat.grade || mat.subject || '—'}
                              </td>
                              <td className="p-3">{mat.category}</td>
                              <td className="p-3">{mat.uploadedAt}</td>
                              <td className="p-3">
                                <Badge
                                  variant={mat.disseminated ? 'success' : 'neutral'}
                                  size="sm"
                                >
                                  {mat.disseminated ? 'Published' : 'Draft'}
                                </Badge>
                              </td>
                              <td className="p-3">
                                {mat.disseminated ? (
                                  <span className="text-xs text-muted-foreground">
                                    Visible to teachers
                                  </span>
                                ) : (
                                  <Button
                                    size="sm"
                                    variant="organic"
                                    onClick={() => handleDisseminateResource(mat.id)}
                                    className="text-xxs cursor-pointer h-8 border-none"
                                  >
                                    Broadcast Asset
                                  </Button>
                                )}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
              </TablePanel>

              <Dialog
                isOpen={isResourceUploadOpen}
                onClose={() => setIsResourceUploadOpen(false)}
                title="Upload curriculum resource"
                size="md"
              >
                <form onSubmit={handleUploadResource} className="space-y-4 pt-2">
                  <input
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-sm text-foreground focus:outline-none"
                    required
                    placeholder="Resource title"
                    value={resourceTitle}
                    onChange={(e) => setResourceTitle(e.target.value)}
                  />
                  <Select
                    label="Category"
                    options={[
                      { value: 'Pedagogy', label: 'Pedagogy' },
                      { value: 'STEM', label: 'STEM' },
                      { value: 'Assessment', label: 'Assessment' },
                      { value: 'Classroom Management', label: 'Classroom Management' },
                      { value: 'Biology', label: 'Biology' },
                      { value: 'Chemistry', label: 'Chemistry' },
                      { value: 'Physics', label: 'Physics' },
                      { value: 'Mathematics', label: 'Mathematics' },
                      { value: 'English', label: 'English' },
                    ]}
                    value={resourceCategory}
                    onChange={(e) => setResourceCategory(e.target.value)}
                  />
                  <Select
                    label="Grade"
                    options={[
                      { value: 'Grade 9', label: 'Grade 9' },
                      { value: 'Grade 10', label: 'Grade 10' },
                      { value: 'Grade 11', label: 'Grade 11' },
                      { value: 'Grade 12', label: 'Grade 12' },
                    ]}
                    value={resourceGrade}
                    onChange={(e) => setResourceGrade(e.target.value)}
                  />
                  <Select
                    label="Subject"
                    options={[
                      { value: 'Biology', label: 'Biology' },
                      { value: 'Chemistry', label: 'Chemistry' },
                      { value: 'Physics', label: 'Physics' },
                      { value: 'Mathematics', label: 'Mathematics' },
                      { value: 'English', label: 'English' },
                      { value: 'History', label: 'History' },
                      { value: 'Geography', label: 'Geography' },
                    ]}
                    value={resourceSubject}
                    onChange={(e) => setResourceSubject(e.target.value)}
                  />
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase">
                      File from device
                    </label>
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.webp,.mp4,.txt,.csv,.zip"
                      className="w-full text-sm text-foreground file:mr-3 file:rounded-md file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-primary hover:file:bg-primary/20"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        setResourceFile(file);
                        if (file && !resourceTitle) {
                          setResourceTitle(file.name.replace(/\.[^.]+$/, ''));
                        }
                      }}
                    />
                    {resourceFile && (
                      <p className="text-xs text-muted-foreground">
                        Selected: {resourceFile.name} ({(resourceFile.size / 1024).toFixed(0)} KB)
                      </p>
                    )}
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-border/60" />
                    </div>
                    <div className="relative flex justify-center text-xs uppercase">
                      <span className="bg-background px-2 text-muted-foreground">or paste a link</span>
                    </div>
                  </div>
                  <input
                    className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-sm text-foreground focus:outline-none"
                    placeholder="External file URL (optional if uploading from device)"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                  />
                  <DialogFooter className="flex-wrap gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={resourceUploading}
                      onClick={() => {
                        setIsResourceUploadOpen(false);
                        setResourceFile(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="organic"
                      size="sm"
                      className="border-none"
                      disabled={resourceUploading || (!resourceFile && !resourceUrl.trim())}
                    >
                      {resourceUploading ? 'Uploading…' : 'Save to library'}
                    </Button>
                  </DialogFooter>
                </form>
              </Dialog>
            </div>
          )}

    </DashboardShell>
  );
}
