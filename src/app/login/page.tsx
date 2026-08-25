'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useApp } from '@/context/AppContext';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { api, ApiError } from '@/lib/api';
import { dashboardPathForRole } from '@/lib/auth';
import { requiresEngineSelection } from '@/lib/engines';
import { Logo } from '@/components/shared/Logo';

export default function LoginPage() {
  const { login, currentUser, authReady, activeEngine } = useApp();
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [registeredSuccess, setRegisteredSuccess] = useState(false);

  useEffect(() => {
    if (!authReady || !currentUser) return;
    if (requiresEngineSelection(currentUser.role) && !activeEngine) {
      router.replace('/select-engine');
    } else {
      router.replace(dashboardPathForRole(currentUser.role));
    }
  }, [authReady, currentUser, activeEngine, router]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('registered') !== '1') return;

    setRegisteredSuccess(true);
    const emailParam = params.get('email');
    if (emailParam) {
      setEmail(decodeURIComponent(emailParam));
    }
    window.history.replaceState({}, '', '/login');
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const user = await api.login(email.trim(), password);
      login(user, remember);
      router.replace(requiresEngineSelection(user.role) ? '/select-engine' : dashboardPathForRole(user.role));
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        setError('Invalid email or password.');
      } else if (err instanceof ApiError) {
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
              <p className="font-bold text-lg leading-tight">PRIME EduAI</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 flex-1 flex flex-col justify-center space-y-4">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight text-title">
            AI Integrated Curriculum Implementation and School Management
          </h1>
          <p className="text-[hsl(218_12%_40%)] text-sm leading-relaxed max-w-md">
            A unified platform for schools, departments, and educators to manage, analyze,
            and advance learning outcomes.
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
            <span className="font-bold text-lg text-foreground">PRIME EduAI</span>
          </div>

          <div className="bg-card rounded-xl border border-border/80 border-l-4 border-l-primary shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <Logo className="h-9 w-9 mx-auto mb-3" />
              <h2 className="text-xl font-bold text-title">Welcome Back! 👋</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Sign in to continue to your portal.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              {registeredSuccess && (
                <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm">
                  Account created successfully. Sign in with your email and password.
                </div>
              )}

              {error && (
                <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-1.5 text-left">
                <label htmlFor="login-email" className="text-xs font-semibold text-foreground">
                  Email Address
                </label>
                <Input
                  id="login-email"
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
                <label htmlFor="login-password" className="text-xs font-semibold text-foreground">
                  Password
                </label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  required
                  inputSize="lg"
                  className="rounded-lg text-sm"
                  leftIcon={
                    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a1.5 1.5 0 001.5-1.5v-7.5a1.5 1.5 0 00-1.5-1.5H6.75a1.5 1.5 0 00-1.5 1.5v7.5a1.5 1.5 0 001.5 1.5z" />
                    </svg>
                  }
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
                rightIcon={
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                  </svg>
                }
              >
                Sign In
              </Button>
            </form>
          </div>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-primary font-semibold hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
