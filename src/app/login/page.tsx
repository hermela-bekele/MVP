'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { api, ApiError } from '@/lib/api';

type RoleGroup = 'admin' | 'staff' | 'student';

const presets = [
  { label: 'MOE Admin', email: 'moe.admin@prime.gov.et', pass: 'moe123', role: 'moe', group: 'admin' as RoleGroup },
  { label: 'School Head', email: 'principal.semeneh@prime.edu.et', pass: 'school123', role: 'school-head', group: 'admin' as RoleGroup },
  { label: 'Registrar Officer', email: 'registrar.office@prime.edu.et', pass: 'registrar123', role: 'registrar', group: 'admin' as RoleGroup },
  { label: 'HR Officer', email: 'hr.officer@prime.edu.et', pass: 'hr123', role: 'hr', group: 'admin' as RoleGroup },
  { label: 'Curriculum Head', email: 'curriculum.lead@prime.edu.et', pass: 'curr123', role: 'curriculum-head', group: 'admin' as RoleGroup },
  { label: 'Dept Head', email: 'dept.head.math@prime.edu.et', pass: 'dept123', role: 'department-head', group: 'staff' as RoleGroup },
  { label: 'Teacher', email: 'martha.feyissa@prime.edu.et', pass: 'teacher123', role: 'teacher', group: 'staff' as RoleGroup },
  { label: 'Student', email: 'selam.abebe@std.edu.et', pass: 'student123', role: 'student', group: 'student' as RoleGroup },
  { label: 'Parent', email: 'abebe.demeke@gmail.com', pass: 'parent123', role: 'parent', group: 'student' as RoleGroup },
];

export default function LoginPage() {
  const { setActiveRole } = useApp();
  const router = useRouter();
  const [roleGroup, setRoleGroup] = useState<RoleGroup>('admin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const filteredPresets = presets.filter((p) => p.group === roleGroup);

  const handleQuickFill = (preset: (typeof presets)[0]) => {
    setEmail(preset.email);
    setPassword(preset.pass);
    setError('');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await api.login(email, password);
      setActiveRole(user.role);
      router.push(`/dashboard/${user.role}`);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else {
        const match = presets.find((p) => p.email.toLowerCase() === email.toLowerCase());
        if (match && match.pass === password) {
          setActiveRole(match.role);
          router.push(`/dashboard/${match.role}`);
        } else {
          setError('Could not reach the server. Check that the API is running on port 3004.');
        }
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[hsl(var(--dashboard-bg))]">
      {/* Brand panel — eSkooly-style welcome */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col justify-between bg-[hsl(var(--sidebar-bg))] text-white p-10 xl:p-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-white text-[hsl(var(--sidebar-bg))] flex items-center justify-center font-bold text-lg shadow-md">
              PR
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">Prime Teaching System</p>
              <p className="text-xs text-white/60">Ethiopian Education Management</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 my-12">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
            Continue Managing!
          </h1>
          <p className="text-white/75 text-sm leading-relaxed max-w-md">
            Pick up right where you left off. Sign in to your school dashboard for
            attendance, academics, lesson plans, and national reporting — built for
            Ethiopian schools.
          </p>
        </div>

        <p className="text-xs text-white/50">
          © 2026 Ministry of Education, Ethiopia · Prime Teaching System v1.0
        </p>
      </div>

      {/* Login form */}
      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              PR
            </div>
            <span className="font-bold text-lg text-foreground">Prime Teaching System</span>
          </div>

          <div className="bg-card rounded-xl border border-border/80 shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Welcome Back! 👋</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your credentials to access your school dashboard.
              </p>
            </div>

            {/* Role group tabs — like eSkooly Admin / Employee / Student */}
            <div className="mb-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 text-center">
                You&apos;re signing in as
              </p>
              <div className="grid grid-cols-3 gap-1 p-1 bg-muted/50 rounded-lg border border-border/60">
                {(
                  [
                    { id: 'admin' as RoleGroup, label: 'Admin' },
                    { id: 'staff' as RoleGroup, label: 'Employee' },
                    { id: 'student' as RoleGroup, label: 'Student' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setRoleGroup(tab.id)}
                    className={`py-2.5 px-2 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                      roleGroup === tab.id
                        ? 'bg-primary text-primary-foreground shadow-sm'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@prime.edu.et"
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <label className="flex items-center gap-2 cursor-pointer text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="rounded border-input text-primary focus:ring-ring"
                  />
                  Remember Me
                </label>
                <Link
                  href="/forgot-password"
                  className="text-primary font-medium hover:underline text-xs"
                >
                  Forgot password?
                </Link>
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-11 font-semibold text-sm"
              >
                Login
              </Button>
            </form>

            <div className="mt-6 pt-5 border-t border-border/60">
              <p className="text-xs font-semibold text-muted-foreground mb-3 text-center">
                Demo accounts ({roleGroup})
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredPresets.map((preset) => (
                  <button
                    key={preset.role}
                    type="button"
                    onClick={() => handleQuickFill(preset)}
                    className="text-left px-3 py-2.5 min-h-[44px] rounded-lg border border-border/70 bg-muted/30 hover:border-primary/40 hover:bg-primary/5 text-xs font-medium text-foreground transition-colors cursor-pointer"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <span className="text-primary font-semibold cursor-pointer">Contact your school admin</span>
          </p>
        </div>
      </div>
    </div>
  );
}
