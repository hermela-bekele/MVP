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
    <div className="min-h-screen flex flex-col lg:flex-row bg-[hsl(var(--dashboard-bg))] login-orange-theme">
      <style jsx global>{`
        .login-orange-theme {
          --primary: 33.8 96.2% 69.2%;
          --primary-foreground: 0 0% 0%;
          --primary-light: 33.8 96.2% 79.2%;
          --accent: 33.8 96.2% 69.2%;
          --accent-foreground: 0 0% 0%;
          --ring: 33.8 96.2% 69.2%;
          --sidebar-bg: 33.8 100% 97%;
          --sidebar-fg: 33.8 96.2% 69.2%;
          --sidebar-active-fg: 33.8 96.2% 69.2%;
        }
      `}</style>
      <div className="hidden lg:flex lg:w-[42%] xl:w-[45%] flex-col justify-between bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] p-10 xl:p-14">
        <div>
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-[hsl(var(--sidebar-fg))] text-[hsl(var(--sidebar-bg))] flex items-center justify-center font-bold text-lg shadow-md">
              PE
            </div>
            <div>
              <p className="font-bold text-lg leading-tight">PRIME EduAI</p>
              <p className="text-xs text-[hsl(var(--sidebar-muted))]">Ethiopian Education Management</p>
            </div>
          </div>
        </div>

        <div className="space-y-4 my-12">
          <h1 className="text-3xl xl:text-4xl font-bold leading-tight">Continue Managing!</h1>
          <p className="text-[hsl(var(--sidebar-muted))] text-sm leading-relaxed max-w-md">
            Sign in to your role-specific dashboard for attendance, academics, lesson plans,
            and national reporting — built for Ethiopian schools.
          </p>
        </div>

        <p className="text-xs text-[hsl(var(--sidebar-muted))]">
          © 2026 Ministry of Education, Ethiopia · PRIME EduAI v1.0
        </p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <div className="h-10 w-10 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">
              PE
            </div>
            <span className="font-bold text-lg text-foreground">PRIME EduAI</span>
          </div>

          <div className="bg-card rounded-xl border border-border/80 shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-foreground">Welcome Back! 👋</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Enter your credentials to access your portal.
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
                <input
                  id="login-email"
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

              <Button type="submit" loading={loading} className="w-full h-11 font-semibold text-sm">
                Login
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
