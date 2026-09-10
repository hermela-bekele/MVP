'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { ApiError } from '@/lib/api';

export function InstitutionProfilePanel() {
  const { schools, regions, currentUser, updateSchool } = useApp();
  const currentSchool = schools.find((s) => s.id === currentUser?.schoolId) ?? schools[0];

  // `schools` loads asynchronously from bootstrap, so seed these from currentSchool
  // once it arrives rather than only at mount (a fresh page load would otherwise
  // mount this form before the fetch resolves and leave every field blank).
  const [schoolName, setSchoolName] = useState(currentSchool?.name ?? '');
  const [schoolPrincipal, setSchoolPrincipal] = useState(currentSchool?.principal ?? '');
  const [schoolPhone, setSchoolPhone] = useState(currentSchool?.phone ?? '');
  const [schoolEmail, setSchoolEmail] = useState(currentSchool?.email ?? '');
  const [schoolRegion, setSchoolRegion] = useState(currentSchool?.region ?? '');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (!currentSchool) return;
    setSchoolName(currentSchool.name ?? '');
    setSchoolPrincipal(currentSchool.principal ?? '');
    setSchoolPhone(currentSchool.phone ?? '');
    setSchoolEmail(currentSchool.email ?? '');
    setSchoolRegion(currentSchool.region ?? '');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSchool?.id, currentSchool?.name, currentSchool?.principal, currentSchool?.phone, currentSchool?.email, currentSchool?.region]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSchool) return;
    setError('');
    setSaving(true);
    try {
      await updateSchool(currentSchool.id, {
        name: schoolName,
        principal: schoolPrincipal,
        phone: schoolPhone,
        email: schoolEmail,
        region: schoolRegion,
      });
      setSuccess('Institution profile updated successfully.');
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not save the institution profile. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="border-border/60 max-w-2xl">
      <CardHeader className="pb-3 border-b border-border/30">
        <CardTitle className="text-base font-bold">Institution Profile</CardTitle>
      </CardHeader>
      <CardContent className="pt-4">
        <form onSubmit={handleSave} className="space-y-4">
          {success && (
            <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-md text-xxs font-bold animate-fade-in">
              ✓ {success}
            </div>
          )}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold animate-fade-in">
              ⚠ {error}
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground uppercase block">School Name</label>
            <input
              type="text"
              value={schoolName}
              onChange={(e) => setSchoolName(e.target.value)}
              className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Principal In Charge</label>
              <input
                type="text"
                value={schoolPrincipal}
                onChange={(e) => setSchoolPrincipal(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Contact Phone</label>
              <input
                type="text"
                value={schoolPhone}
                onChange={(e) => setSchoolPhone(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Contact Email</label>
              <input
                type="email"
                value={schoolEmail}
                onChange={(e) => setSchoolEmail(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">MOE Region</label>
              <select
                value={schoolRegion}
                onChange={(e) => setSchoolRegion(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none"
              >
                {regions.map((region) => (
                  <option key={region.id} value={region.name}>{region.name}</option>
                ))}
              </select>
            </div>
          </div>

          <Button type="submit" variant="organic" disabled={saving} className="text-xs h-10 border-none font-bold">
            {saving ? 'Saving…' : 'Save Institution Profile'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
