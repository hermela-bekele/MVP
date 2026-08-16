'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Logo } from '@/components/shared/Logo';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState(1);
  const [otp, setOtp] = useState('');
  const [timer, setTimer] = useState(60);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => setTimer((t) => t - 1), 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [step, timer]);

  const handleSubmitPhone = (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone) return;
    setLoading(true);
    setTimeout(() => {
      setStep(2);
      setTimer(60);
      setLoading(false);
    }, 800);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp) return;
    setLoading(true);
    setTimeout(() => {
      setStep(3);
      setLoading(false);
    }, 800);
  };

  const inputClass =
    'w-full h-11 px-3 rounded-lg border border-input bg-background text-sm focus:outline-none focus:ring-2 focus:ring-ring';

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-[hsl(var(--dashboard-bg))]">
      <div className="hidden lg:flex lg:w-[42%] flex-col justify-between bg-[hsl(var(--sidebar-bg))] text-[hsl(var(--sidebar-fg))] p-10 xl:p-14">
        <div className="flex items-center gap-3">
          <Logo className="h-11 w-11" />
          <div>
            <p className="font-bold text-lg">PRIME EduAI</p>
            <p className="text-xs text-[hsl(var(--sidebar-muted))]">Account recovery</p>
          </div>
        </div>
        <p className="text-sm text-[hsl(var(--sidebar-muted))] max-w-sm leading-relaxed">
          Only administrators can recover login credentials here. Students and employees
          should contact their school administrator for login details.
        </p>
        <p className="text-xs text-[hsl(var(--sidebar-muted))]">© 2026 Ministry of Education, Ethiopia</p>
      </div>

      <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          <div className="lg:hidden flex items-center justify-center gap-2 mb-8">
            <Logo className="h-10 w-10" />
            <span className="font-bold text-lg">PRIME EduAI</span>
          </div>

          <div className="bg-card rounded-xl border border-border/80 shadow-lg p-6 sm:p-8">
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-title">
                {step === 1 && 'Forgot Password'}
                {step === 2 && 'Enter Verification Code'}
                {step === 3 && 'Password Reset'}
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                {step === 1 &&
                  'Enter your registered email or phone to receive a verification code.'}
                {step === 2 && (
                  <>
                    We sent a 6-digit code to{' '}
                    <span className="font-semibold text-foreground">{phone}</span>.
                  </>
                )}
                {step === 3 && 'Your identity has been verified. You can sign in again.'}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleSubmitPhone} className="space-y-4">
                <div className="space-y-1.5 text-left">
                  <label className="text-xs font-semibold text-foreground">
                    Email or Phone Number
                  </label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+251-911-XXXXXX or name@prime.edu.et"
                    className={inputClass}
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full h-11 font-semibold">
                  Reset Password
                </Button>
                <Link
                  href="/login"
                  className="block w-full text-center text-sm text-muted-foreground hover:text-foreground font-medium"
                >
                  Back to login
                </Link>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground block text-center">
                    Verification code
                  </label>
                  <input
                    type="text"
                    required
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    placeholder="000000"
                    className={`${inputClass} text-center text-lg font-bold tracking-[0.4em]`}
                  />
                </div>
                <Button type="submit" loading={loading} className="w-full h-11 font-semibold">
                  Verify &amp; Reset
                </Button>
                <p className="text-center text-xs text-muted-foreground">
                  {timer > 0 ? (
                    <>
                      Resend code in <strong>{timer}s</strong>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setTimer(60)}
                      className="text-foreground font-semibold hover:underline cursor-pointer"
                    >
                      Resend code
                    </button>
                  )}
                </p>
              </form>
            )}

            {step === 3 && (
              <div className="space-y-4 text-center">
                <div className="h-12 w-12 rounded-full bg-muted text-foreground flex items-center justify-center mx-auto text-xl font-bold border border-border">
                  ✓
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Password recovery is not fully enabled yet. Contact your school administrator
                  to reset your credentials, or create a new account if you are eligible.
                </p>
                <Button onClick={() => router.push('/login')} className="w-full h-11 font-semibold">
                  Back to Login
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
