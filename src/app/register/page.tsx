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
import { Logo } from '@/components/shared/Logo';

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
      <div className="relative hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col overflow-hidden bg-[hsl(var(--sidebar-bg))] text-[hsl(218_32%_14%)] p-10 xl:p-14">
        <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-[hsl(var(--primary-light)/0.35)] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-28 -left-16 h-80 w-80 rounded-full bg-[hsl(var(--primary-light)/0.3)] blur-3xl" />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <Logo className="h-11 w-11" />
            <div>
              <p className="font-bold text-lg leading-tight">
                PRIME EduAI
              </p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center space-y-4">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight text-title">
            Create Your Account
          </h1>
          <p className="text-[hsl(218_12%_40%)] text-sm leading-relaxed max-w-md">
            Register to access your role-specific portal — from MOE
            administration to classroom teaching, student learning, and parent
            engagement.
          </p>
          <div className="inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary-light)/0.3)] px-3 py-2 text-xs font-semibold">
            <svg className="h-4 w-4 text-primary" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.958a1 1 0 00.95.69h4.162c.969 0 1.371 1.24.588 1.81l-3.368 2.448a1 1 0 00-.364 1.118l1.287 3.959c.299.921-.755 1.688-1.54 1.118l-3.368-2.448a1 1 0 00-1.175 0l-3.368 2.448c-.784.57-1.838-.197-1.539-1.118l1.286-3.959a1 1 0 00-.363-1.118L2.062 9.385c-.783-.57-.38-1.81.588-1.81h4.163a1 1 0 00.95-.69l1.286-3.958z" />
            </svg>
            Leading Education Forward
          </div>
        </div>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Logo className="h-10 w-10" />
            <span className="font-bold text-lg text-foreground">
              PRIME EduAI
            </span>
          </div>

          <div className="bg-card rounded-xl border border-border/80 border-l-4 border-l-primary shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <Logo className="h-9 w-9 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-title">
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
                <Input
                  id="register-name"
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="Your full name"
                  autoComplete="name"
                  required
                  inputSize="lg"
                  className="rounded-lg text-sm"
                  leftIcon={
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                    </svg>
                  }
                />
              </div>

              <div className="space-y-1.5 text-left">
                <label htmlFor="register-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  id="register-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@prime.edu.et"
                  autoComplete="email"
                  required
                  inputSize="lg"
                  className="rounded-lg text-sm"
                  leftIcon={
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0-.414.336-.75.75-.75h18c.414 0 .75.336.75.75v10.5a.75.75 0 01-.75.75h-18a.75.75 0 01-.75-.75V6.75z" />
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 7l9.5 6.5L21.5 7" />
                    </svg>
                  }
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
                  leftIcon={
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  }
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
                  leftIcon={
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  }
                  className="rounded-lg text-sm"
                />
              </div>

              <Button
                type="submit"
                loading={loading}
                className="w-full h-11 font-semibold text-sm"
                rightIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                }
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
