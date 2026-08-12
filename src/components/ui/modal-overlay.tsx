'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

/** Full-viewport dimmed backdrop for modals, drawers, and popovers */
export const MODAL_OVERLAY_CLASS = 'fixed inset-0 bg-slate-950/50';

export interface ModalOverlayProps {
  onClick?: () => void;
  className?: string;
  zIndexClass?: string;
}

export const ModalOverlay: React.FC<ModalOverlayProps> = ({
  onClick,
  className = '',
  zIndexClass = 'z-50',
}) => (
  <div
    className={`${MODAL_OVERLAY_CLASS} ${zIndexClass} ${className}`}
    onClick={onClick}
    aria-hidden="true"
  />
);

export interface ModalPortalProps {
  children: React.ReactNode;
}

/** Renders children on document.body (avoids overflow/stacking issues in dashboard layout). */
export const ModalPortal: React.FC<ModalPortalProps> = ({ children }) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setMounted(true), 0);
    return () => clearTimeout(timer);
  }, []);

  if (!mounted) return null;

  return createPortal(children, document.body);
};

/** Lock page scroll while a modal layer is open */
export function useModalScrollLock(locked: boolean) {
  useEffect(() => {
    if (!locked) return;

    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previous;
    };
  }, [locked]);
}
