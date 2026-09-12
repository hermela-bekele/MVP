'use client';

import React, { useEffect, useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useApp } from '@/context/AppContext';
import { api, ApiError } from '@/lib/api';

interface SessionRow {
  id: string;
  userAgent?: string;
  ip?: string;
  createdAt: string;
  lastSeenAt: string;
  current: boolean;
}

function describeDevice(userAgent?: string): string {
  if (!userAgent) return 'Unknown device';
  if (/mobile/i.test(userAgent)) return 'Mobile browser';
  if (/chrome/i.test(userAgent)) return 'Chrome';
  if (/firefox/i.test(userAgent)) return 'Firefox';
  if (/safari/i.test(userAgent)) return 'Safari';
  return 'Browser';
}

export function SecurityPanel() {
  const { currentUser, changePassword } = useApp();

  const [currPassword, setCurrPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);

  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [sessionsError, setSessionsError] = useState('');
  const [revokingId, setRevokingId] = useState<string | null>(null);
  const [revokingOthers, setRevokingOthers] = useState(false);

  const loadSessions = () => {
    api.listSessions().then((rows) => setSessions(rows as SessionRow[])).catch(() => setSessionsError('Could not load active sessions.'));
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const handleSavePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess('');

    if (!currPassword) {
      setPasswordError('Please provide your current password to verify this change.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password confirmation does not match.');
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters.');
      return;
    }

    setSavingPassword(true);
    try {
      await changePassword(currPassword, newPassword);
      setPasswordSuccess('Password updated. You have been signed out of every other device.');
      setCurrPassword('');
      setNewPassword('');
      setConfirmPassword('');
      loadSessions();
      setTimeout(() => setPasswordSuccess(''), 5000);
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'Could not update the password. Please try again.');
    } finally {
      setSavingPassword(false);
    }
  };

  const revokeSession = async (id: string) => {
    setRevokingId(id);
    try {
      await api.revokeSession(id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch {
      setSessionsError('Could not revoke that session.');
    } finally {
      setRevokingId(null);
    }
  };

  const revokeOthers = async () => {
    setRevokingOthers(true);
    try {
      await api.revokeOtherSessions();
      setSessions((prev) => prev.filter((s) => s.current));
    } catch {
      setSessionsError('Could not sign out other sessions.');
    } finally {
      setRevokingOthers(false);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/30">
          <CardTitle className="text-base font-bold">Change Password</CardTitle>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleSavePassword} className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-md text-xxs font-bold animate-fade-in">
                ⚠ {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-3 bg-primary/10 border border-primary/20 text-primary rounded-md text-xxs font-bold animate-fade-in">
                ✓ {passwordSuccess}
              </div>
            )}

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Login Email</label>
              <input
                type="email"
                value={currentUser?.email ?? ''}
                disabled
                className="w-full h-10 px-3 bg-muted/20 border border-border rounded-md text-xs text-muted-foreground"
              />
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground uppercase block">Current Password</label>
              <input
                type="password"
                placeholder="••••••••"
                value={currPassword}
                onChange={(e) => setCurrPassword(e.target.value)}
                className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground uppercase block">Confirm New Password</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full h-10 px-3 bg-muted/40 border border-border rounded-md text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
            </div>

            <Button type="submit" variant="organic" disabled={savingPassword} className="text-xs h-10 w-full border-none font-bold">
              {savingPassword ? 'Updating…' : 'Change Password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardHeader className="pb-3 border-b border-border/30 flex flex-row items-center justify-between">
          <CardTitle className="text-base font-bold">Active Sessions</CardTitle>
          {sessions.length > 1 && (
            <Button size="sm" variant="secondary" disabled={revokingOthers} onClick={revokeOthers} className="text-xxs">
              {revokingOthers ? 'Signing out…' : 'Sign out of all other sessions'}
            </Button>
          )}
        </CardHeader>
        <CardContent className="pt-4 space-y-2">
          {sessionsError && <p className="text-xs text-red-500">{sessionsError}</p>}
          {!sessions.length && !sessionsError && (
            <p className="text-xs text-muted-foreground">Loading sessions…</p>
          )}
          {sessions.map((s) => (
            <div key={s.id} className="flex items-center justify-between gap-2 rounded-md border border-border/60 bg-muted/20 px-3 py-2.5">
              <div>
                <p className="text-xs font-semibold text-foreground">
                  {describeDevice(s.userAgent)}
                  {s.current && <span className="ml-2 text-[10px] font-bold text-primary uppercase">This device</span>}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  {s.ip ? `${s.ip} · ` : ''}Last active {new Date(s.lastSeenAt).toLocaleString()}
                </p>
              </div>
              {!s.current && (
                <Button
                  size="sm"
                  variant="secondary"
                  disabled={revokingId === s.id}
                  onClick={() => revokeSession(s.id)}
                  className="text-xxs shrink-0"
                >
                  {revokingId === s.id ? 'Signing out…' : 'Sign out'}
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
