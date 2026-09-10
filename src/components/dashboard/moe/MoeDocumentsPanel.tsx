'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { api, ApiError, uploadFileWithMeta, MOE_DOCUMENT_CATEGORIES, MOE_DOCUMENT_AUDIENCES, type MoeDocument } from '@/lib/api';
import { TablePanel } from '@/components/dashboard/TablePanel';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { FormField, formFieldInputClass } from '@/components/ui/form-field';
import { useConfirmDialog } from '@/components/ui/confirm-dialog';

function formatFileSize(bytes: number | null): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function MoeDocumentsPanel() {
  const { confirm, ConfirmDialog } = useConfirmDialog();
  const [documents, setDocuments] = useState<MoeDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [audienceFilter, setAudienceFilter] = useState('All');

  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<string>(MOE_DOCUMENT_CATEGORIES[0]);
  const [audience, setAudience] = useState<string>('All');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    setLoadError('');
    api
      .listMoeDocuments({
        category: categoryFilter !== 'All' ? categoryFilter : undefined,
        audience: audienceFilter !== 'All' ? audienceFilter : undefined,
        search: search || undefined,
      })
      .then(setDocuments)
      .catch(() => setLoadError('Could not load documents.'))
      .finally(() => setLoading(false));
  }, [categoryFilter, audienceFilter, search]);

  useEffect(() => {
    const timer = setTimeout(load, 300); // debounce search
    return () => clearTimeout(timer);
  }, [load]);

  const resetUploadForm = () => {
    setTitle(''); setCategory(MOE_DOCUMENT_CATEGORIES[0]); setAudience('All'); setFile(null); setUploadError('');
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !file) {
      setUploadError('Please provide a title and choose a file.');
      return;
    }
    setUploading(true);
    setUploadError('');
    try {
      const uploaded = await uploadFileWithMeta(file);
      await api.uploadMoeDocument({
        title,
        category,
        audience,
        fileUrl: uploaded.url,
        fileName: uploaded.originalName,
        fileSize: uploaded.size,
      });
      setIsUploadOpen(false);
      resetUploadForm();
      load();
    } catch (err) {
      setUploadError(err instanceof ApiError ? err.message : 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (doc: MoeDocument) => {
    const ok = await confirm(`Delete "${doc.title}"?`, {
      description: 'This removes the document from the registry. This cannot be undone.',
      confirmLabel: 'Delete',
      danger: true,
    });
    if (!ok) return;
    try {
      await api.deleteMoeDocument(doc.id);
      setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
    } catch {
      setLoadError('Could not delete this document. Please try again.');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-card p-4 rounded-xl border border-border/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search documents by title..."
          className="w-full sm:w-72 h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="w-44">
            <Select
              options={[{ value: 'All', label: 'All Categories' }, ...MOE_DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c }))]}
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            />
          </div>
          <div className="w-36">
            <Select
              options={[{ value: 'All', label: 'All Audiences' }, ...MOE_DOCUMENT_AUDIENCES.filter((a) => a !== 'All').map((a) => ({ value: a, label: a }))]}
              value={audienceFilter}
              onChange={(e) => setAudienceFilter(e.target.value)}
            />
          </div>
          <Button onClick={() => setIsUploadOpen(true)} size="sm" className="h-10 font-semibold">
            + Upload Document
          </Button>
        </div>
      </div>

      <TablePanel title="Federal Document Registry">
        {loadError && <p className="text-xs text-red-500 px-3 py-2">{loadError}</p>}
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Category</th>
              <th>Audience</th>
              <th>Uploaded By</th>
              <th>Uploaded</th>
              <th>Size</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-12">Loading documents…</td></tr>
            ) : documents.length === 0 ? (
              <tr><td colSpan={7} className="text-center text-muted-foreground py-12">No documents matching your filters.</td></tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id}>
                  <td className="font-medium">{doc.title}</td>
                  <td><Badge variant="neutral" badgeStyle="subtle" size="sm">{doc.category}</Badge></td>
                  <td className="text-muted-foreground">{doc.audience}</td>
                  <td className="text-muted-foreground">{doc.uploadedByName ?? '—'}</td>
                  <td className="text-muted-foreground">{new Date(doc.createdAt).toLocaleDateString()}</td>
                  <td className="text-muted-foreground">{formatFileSize(doc.fileSize)}</td>
                  <td className="space-x-2">
                    <a href={doc.fileUrl} target="_blank" rel="noopener noreferrer">
                      <Button type="button" size="sm" variant="outline" className="h-8 text-xs">View</Button>
                    </a>
                    <Button type="button" size="sm" variant="outline" className="h-8 text-xs text-destructive" onClick={() => void handleDelete(doc)}>
                      Delete
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </TablePanel>

      <Dialog
        isOpen={isUploadOpen}
        onClose={() => { setIsUploadOpen(false); resetUploadForm(); }}
        title="Upload Document"
        description="Add a policy, curriculum, or compliance document to the federal registry."
      >
        <form onSubmit={handleUpload} className="space-y-4 text-left">
          {uploadError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold">⚠ {uploadError}</div>
          )}
          <FormField label="Document Title">
            <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Grade 9 Natural Science Syllabus" className={formFieldInputClass} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Category">
              <Select options={MOE_DOCUMENT_CATEGORIES.map((c) => ({ value: c, label: c }))} value={category} onChange={(e) => setCategory(e.target.value)} />
            </FormField>
            <FormField label="Audience">
              <Select options={MOE_DOCUMENT_AUDIENCES.map((a) => ({ value: a, label: a }))} value={audience} onChange={(e) => setAudience(e.target.value)} />
            </FormField>
          </div>
          <FormField label="File">
            <input
              type="file"
              required
              onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90"
            />
          </FormField>
          <DialogFooter className="mt-2">
            <Button type="button" variant="outline" onClick={() => { setIsUploadOpen(false); resetUploadForm(); }} className="text-xs h-10">
              Cancel
            </Button>
            <Button type="submit" variant="organic" className="text-xs h-10 border-none" disabled={uploading}>
              {uploading ? 'Uploading…' : 'Upload Document'}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
      {ConfirmDialog}
    </div>
  );
}
