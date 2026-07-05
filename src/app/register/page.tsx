'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { DropdownSelect } from '@/components/ui/dropdown-select';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';
import { useApp } from '@/context/AppContext';
import {
  dashboardPathForRole,
  roleLabel,
  SELF_REGISTER_ROLES,
  type PortalRole,
} from '@/lib/auth';

export default function RegisterPage() {
  const { currentUser, authReady } = useApp();
  const router = useRouter();

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<PortalRole>('student');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (authReady && currentUser) {
      router.replace(dashboardPathForRole(currentUser.role));
    }
  }, [authReady, currentUser, router]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!displayName.trim() || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      await api.register({
        email: email.trim(),
        password,
        displayName: displayName.trim(),
        role,
      });
      router.replace(
        `/login?registered=1&email=${encodeURIComponent(email.trim())}`,
      );
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Could not reach the server. Check that the API is running on port 3004.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[hsl(var(--dashboard-bg))]">
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col justify-between bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] p-10 xl:p-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[hsl(var(--sidebar-fg))] text-[hsl(var(--sidebar-bg))] flex items-center justify-center font-bold text-lg shadow-md">
              PR
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">
                Prime Teaching System
              </p>
              <p className="text-xs text-[hsl(var(--sidebar-muted))]">
                Ethiopian Education Management
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 my-12">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">
            Create Your Account
          </h1>
          <p className="text-[hsl(var(--sidebar-muted))] text-sm leading-relaxed max-w-md">
            Register to access your role-specific portal — from MOE
            administration to classroom teaching, student learning, and parent
            engagement.
          </p>
        </div>

        <p className="text-xs text-[hsl(var(--sidebar-muted))]">
          © 2026 Ministry of Education, Ethiopia · Prime Teaching System v1.0
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              PR
            </div>
            <span className="font-bold text-lg text-foreground">
              Prime Teaching System
            </span>
          </div>

          <div className="bg-card rounded-xl border border-border/80 shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">
                Join the Portal
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Set up your credentials to access your dashboard.
              </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label htmlFor="register-name" className="text-xs font-semibold text-foreground">
                  Full Name
                </label>
                <input
                  id="register-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="register-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@prime.edu.et"
                  autoComplete="email"
                  required
                  className="w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">
                  Account Type
                </label>
                <DropdownSelect
                  value={role}
                  onValueChange={(value) => setRole(value as PortalRole)}
                  options={SELF_REGISTER_ROLES.map((r) => ({
                    value: r,
                    label: roleLabel(r),
                  }))}
                  maxVisibleItems={9}
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <Input
                  id="register-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 6 characters"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  inputSize="lg"
                  className="rounded-lg text-sm"
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="register-confirm-password" className="text-xs font-semibold text-foreground">
                  Confirm Password
                </label>
                <Input
                  id="register-confirm-password"
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  autoComplete="new-password"
                  required
                  minLength={6}
                  inputSize="lg"
                  className="rounded-lg text-sm"
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-11 font-semibold text-sm !bg-[#0049C7] !from-[#0049C7] !to-[#0049C7] hover:!bg-[#003ba3] hover:!from-[#003ba3] hover:!to-[#003ba3] text-white"
              >
                Create Account
              </Button>
            </form>

            <p className="text-center text-xs text-muted-foreground mt-6">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-primary font-semibold hover:underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
