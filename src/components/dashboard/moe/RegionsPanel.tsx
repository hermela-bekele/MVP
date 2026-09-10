'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { TablePanel } from '@/components/dashboard/TablePanel';

interface RegionsPanelProps {
  onViewSchools: (regionName: string) => void;
}

export function RegionsPanel({ onViewSchools }: RegionsPanelProps) {
  const { regions, schools, addRegion, updateRegionName } = useApp();

  const [search, setSearch] = useState('');
  const [newRegionName, setNewRegionName] = useState('');
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [renameError, setRenameError] = useState('');

  const filteredRegions = regions.filter((r) => r.name.toLowerCase().includes(search.toLowerCase()));

  const schoolCountFor = (name: string) => schools.filter((s) => s.region === name).length;

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRegionName.trim()) return;
    setAdding(true);
    setAddError('');
    try {
      await addRegion(newRegionName.trim());
      setNewRegionName('');
    } catch (err) {
      setAddError(err instanceof ApiError ? err.message : 'Could not add region.');
    } finally {
      setAdding(false);
    }
  };

  const startEdit = (id: string, name: string) => {
    setEditingId(id);
    setEditingName(name);
    setRenameError('');
  };

  const saveEdit = async () => {
    if (!editingId || !editingName.trim()) return;
    try {
      await updateRegionName(editingId, editingName.trim());
      setEditingId(null);
    } catch (err) {
      setRenameError(err instanceof ApiError ? err.message : 'Could not rename region.');
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleAdd} className="flex flex-col sm:flex-row gap-3 items-start sm:items-center bg-card p-4 rounded-xl border border-border/60">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search regions…"
          className="w-full sm:w-56 h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <div className="flex-1" />
        <input
          type="text"
          value={newRegionName}
          onChange={(e) => setNewRegionName(e.target.value)}
          placeholder="New region name"
          className="w-full sm:w-56 h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
        />
        <Button type="submit" size="sm" className="h-10 font-semibold shrink-0" disabled={adding}>
          {adding ? 'Adding…' : '+ Add Region'}
        </Button>
      </form>
      {addError && <p className="text-xs text-red-500 px-1">{addError}</p>}
      {renameError && <p className="text-xs text-red-500 px-1">{renameError}</p>}

      <TablePanel title="Region Catalog">
        <table className="eskooly-table">
          <thead>
            <tr>
              <th>Region Name</th>
              <th>Connected Schools</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredRegions.length === 0 ? (
              <tr>
                <td colSpan={3} className="text-center text-muted-foreground py-12">
                  No regions matching your search.
                </td>
              </tr>
            ) : (
              filteredRegions.map((r) => (
                <tr key={r.id}>
                  <td className="font-medium">
                    {editingId === r.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        className="h-8 px-2 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
                        autoFocus
                      />
                    ) : (
                      r.name
                    )}
                  </td>
                  <td className="text-muted-foreground">{schoolCountFor(r.name)}</td>
                  <td className="space-x-2">
                    {editingId === r.id ? (
                      <>
                        <Button type="button" size="sm" variant="organic" className="h-8 text-xs border-none" onClick={saveEdit}>
                          Save
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => startEdit(r.id, r.name)}>
                          Rename
                        </Button>
                        <Button type="button" size="sm" variant="outline" className="h-8 text-xs" onClick={() => onViewSchools(r.name)}>
                          View Schools
                        </Button>
                      </>
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
}
