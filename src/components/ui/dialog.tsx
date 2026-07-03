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
              className={`relative w-full ${sizeClasses[size]} bg-white text-ais-on-surface border border-ais-card-border rounded-2xl shadow-[0_8px_24px_rgba(15,23,42,0.12)] overflow-hidden z-10 flex flex-col max-h-[min(90vh,100dvh)]`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-ais-card-border bg-ais-surface-container-low/50 shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-ais-primary text-white shadow-sm">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>

                  <div className="flex flex-col space-y-1 min-w-0 flex-1">
                    <h2
                      id="dialog-title"
                      className={
                        largeTitle
                          ? 'text-lg sm:text-xl font-bold tracking-tight text-ais-on-surface truncate'
                          : 'text-base font-semibold tracking-tight text-ais-on-surface truncate'
                      }
                    >
                      {title}
                    </h2>
                    {description && (
                      <p className="text-xs text-ais-on-surface-variant truncate">{description}</p>
                    )}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={onClose}
                  className="text-ais-on-surface-variant hover:text-ais-on-surface hover:bg-ais-surface-container-low p-2.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto flex-1 leading-relaxed bg-white text-ais-on-surface">{children}</div>
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
    className={`flex flex-wrap items-center justify-end gap-3 px-6 py-4 bg-ais-surface-container-low/30 border-t border-ais-card-border ${className}`}
  >
    {children}
  </div>
);
