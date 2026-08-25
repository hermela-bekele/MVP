'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { uploadFile } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export const ResourcesPanel: React.FC = () => {
  const { trainingMaterials, addTrainingMaterial, disseminateTrainingMaterial, addNotification } = useApp();
  const [title, setTitle] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceFile, setResourceFile] = useState<File | null>(null);
  const [category, setCategory] = useState('Pedagogy');
  const [uploading, setUploading] = useState(false);

  const schoolResources = trainingMaterials.filter((m) => !m.departmentId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || (!resourceFile && !resourceUrl.trim())) return;
    setUploading(true);
    try {
      let finalUrl = resourceUrl.trim();
      if (resourceFile) {
        finalUrl = await uploadFile(resourceFile);
      }
      addTrainingMaterial({
        title,
        resourceUrl: finalUrl,
        category,
        trainingType: category === 'STEM' ? 'STEM' : 'Pedagogy',
      });
      setTitle('');
      setResourceUrl('');
      setResourceFile(null);
    } catch (err) {
      addNotification(
        'Upload failed',
        err instanceof Error ? err.message : 'Could not upload resource.',
        'alert',
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-sm font-bold">Upload school resources</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold">Title</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-border text-sm"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>
            <Select
              label="Category"
              options={[
                { value: 'Pedagogy', label: 'Pedagogy' },
                { value: 'STEM', label: 'STEM' },
                { value: 'Policy', label: 'School Policy' },
                { value: 'Assessment', label: 'Assessment' },
              ]}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            />
            <div className="space-y-1">
              <label className="text-xs font-semibold">Resource URL (optional)</label>
              <input
                className="w-full h-10 px-3 rounded-lg border border-border text-sm"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
                placeholder="https://..."
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <label className="text-xs font-semibold">Or upload file</label>
              <input
                type="file"
                className="w-full text-sm"
                accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.png,.jpg,.jpeg"
                onChange={(e) => setResourceFile(e.target.files?.[0] ?? null)}
              />
            </div>
            <Button type="submit" loading={uploading} className="md:col-span-2 w-fit">
              Upload resource
            </Button>
          </form>
        </CardContent>
      </Card>

      <TablePanel title="School-wide resources">
        <table className="eskooly-table w-full">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {schoolResources.length === 0 ? (
              <tr>
                <td colSpan={4} className="p-6 text-center text-sm text-muted-foreground">
                  No school-wide resources uploaded yet.
                </td>
              </tr>
            ) : (
              schoolResources.map((resource) => (
                <tr key={resource.id}>
                  <td className="font-semibold">{resource.title}</td>
                  <td>{resource.category}</td>
                  <td>
                    <Badge variant={resource.disseminated ? 'success' : 'neutral'}>
                      {resource.disseminated ? 'Disseminated' : 'Draft'}
                    </Badge>
                  </td>
                  <td>
                    {!resource.disseminated && (
                      <Button size="sm" variant="outline" onClick={() => disseminateTrainingMaterial(resource.id)}>
                        Disseminate
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TablePanel>
    </div>
  );
};
