'use client';

import React, { useCallback, useRef, useState } from 'react';
import { Dialog, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface ConfirmOptions {
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

/**
 * In-app replacement for window.confirm(). Renders the app's own Dialog instead of an
 * unstyled OS-chrome popup. Usage:
 *   const { confirm, ConfirmDialog } = useConfirmDialog();
 *   if (await confirm('Delete this question?')) { ... }
 *   return <>{ConfirmDialog}...</>
 */
export function useConfirmDialog() {
  const [state, setState] = useState<{ open: boolean; title: string } & ConfirmOptions>({
    open: false,
    title: '',
  });
  const resolver = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback((title: string, options?: ConfirmOptions) => {
    setState({ open: true, title, ...options });
    return new Promise<boolean>((resolve) => {
      resolver.current = resolve;
    });
  }, []);

  const settle = (result: boolean) => {
    setState((s) => ({ ...s, open: false }));
    resolver.current?.(result);
    resolver.current = null;
  };

  const ConfirmDialog = (
    <Dialog isOpen={state.open} onClose={() => settle(false)} title={state.title} description={state.description}>
      <DialogFooter>
        <Button type="button" variant="outline" onClick={() => settle(false)}>
          {state.cancelLabel ?? 'Cancel'}
        </Button>
        <Button type="button" variant={state.danger ? 'destructive' : 'primary'} onClick={() => settle(true)}>
          {state.confirmLabel ?? 'Confirm'}
        </Button>
      </DialogFooter>
    </Dialog>
  );

  return { confirm, ConfirmDialog };
}
