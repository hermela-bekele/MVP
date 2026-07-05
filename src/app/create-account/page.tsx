'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function CreateAccountPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace('/register');
  }, [router]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
      <div className="flex flex-col items-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        <p className="text-muted-foreground text-sm font-medium">Redirecting…</p>
      </div>
    </div>
  );
}
