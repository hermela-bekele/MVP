'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { modalBackdrop, modalContent } from '@/lib/animations';
import { MODAL_OVERLAY_CLASS, ModalPortal, useModalScrollLock } from '@/components/ui/modal-overlay';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  /** Portal-style large bold title */
  largeTitle?: boolean;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  size = 'md',
  largeTitle = false,
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useModalScrollLock(isOpen);

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-2xl',
    '2xl': 'max-w-4xl',
    full: 'max-w-5xl w-full max-h-[90vh]',
  };

  if (!mounted) return null;

  return (
    <ModalPortal>
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              variants={modalBackdrop}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={MODAL_OVERLAY_CLASS}
              onClick={onClose}
              aria-hidden="true"
            />

            <motion.div
              variants={modalContent}
              initial="hidden"
              animate="visible"
              exit="exit"
              className={`relative w-full ${sizeClasses[size]} bg-card text-card-foreground border border-border/80 rounded-xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[min(90vh,100dvh)]`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-start justify-between p-5 border-b border-border/40 shrink-0">
                <div className="flex flex-col space-y-1 pr-4">
                  <h2
                    id="dialog-title"
                    className={
                      largeTitle
                        ? 'text-xl font-bold tracking-tight text-ais-on-surface'
                        : 'text-base font-semibold tracking-tight'
                    }
                  >
                    {title}
                  </h2>
                  {description && (
                    <p className="text-xs text-muted-foreground">{description}</p>
                  )}
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="text-muted-foreground hover:text-foreground hover:bg-muted p-2 rounded-lg transition-colors cursor-pointer min-h-[44px] min-w-[44px] flex items-center justify-center -mr-2"
                  aria-label="Close"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto flex-1 leading-relaxed">{children}</div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </ModalPortal>
  );
};

export const DialogFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <div
    className={`flex flex-wrap items-center justify-end gap-2 p-4 bg-muted/30 border-t border-border/40 ${className}`}
  >
    {children}
  </div>
);
