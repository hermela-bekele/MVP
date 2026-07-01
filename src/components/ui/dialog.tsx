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
              className={`relative w-full ${sizeClasses[size]} bg-white dark:bg-gray-900 text-foreground dark:text-gray-100 border border-border/80 dark:border-gray-700 rounded-2xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[min(90vh,100dvh)]`}
              role="dialog"
              aria-modal="true"
              aria-labelledby="dialog-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modern gradient header */}
              <div className="flex items-center justify-between px-6 py-5 border-b border-border/40 dark:border-gray-700 bg-gradient-to-r from-blue-50 via-transparent to-blue-50 dark:from-blue-950/20 dark:to-blue-950/20 shrink-0">
                <div className="flex items-center gap-3 min-w-0 flex-1 pr-4">
                  {/* Decorative icon */}
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  
                  <div className="flex flex-col space-y-1 min-w-0 flex-1">
                    <h2
                      id="dialog-title"
                      className={
                        largeTitle
                          ? 'text-lg sm:text-xl font-bold tracking-tight text-gray-900 dark:text-gray-100 truncate'
                          : 'text-base font-semibold tracking-tight text-gray-900 dark:text-gray-100 truncate'
                      }
                    >
                      {title}
                    </h2>
                    {description && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 truncate">{description}</p>
                    )}
                  </div>
                </div>
                
                <button
                  type="button"
                  onClick={onClose}
                  className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 p-2.5 rounded-xl transition-all duration-200 cursor-pointer shrink-0 hover:scale-105"
                  aria-label="Close"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-5 sm:p-6 overflow-y-auto flex-1 leading-relaxed bg-white dark:bg-gray-900">{children}</div>
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
    className={`flex flex-wrap items-center justify-end gap-3 px-6 py-4 bg-white dark:bg-gray-900 border-t border-border/40 dark:border-gray-700 ${className}`}
  >
    {children}
  </div>
);
