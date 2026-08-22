'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  BookOpen,
  FilePlus,
  PenLine,
  Plus,
  Upload,
  X,
} from 'lucide-react';
import {
  aisBodyMd,
  aisBtnPrimary,
  aisHeadlineSm,
} from '@/components/dashboard/teacher/aisStyles';
import { useApp } from '@/context/AppContext';
import { getDemoTeacher } from '@/lib/teacherPortal';

type QuickAction = {
  tab: string;
  event?: string;
  label: string;
  description: string;
  icon: React.ReactNode;
};

const QUICK_ACTIONS: QuickAction[] = [
  {
    tab: 'manage-students',
    event: 'open-teacher-grade-entry',
    label: 'Record grade',
    description: 'Open gradebook',
    icon: <PenLine className="h-4 w-4" aria-hidden />,
  },
  {
    tab: 'teaching-notes',
    event: 'open-teacher-create-note',
    label: 'New teaching note',
    description: 'Create a note with AI assist',
    icon: <BookOpen className="h-4 w-4" aria-hidden />,
  },
  {
    tab: 'teaching-notes',
    event: 'open-teacher-lesson-plan',
    label: 'Create lesson plan',
    description: 'Draft a new lesson plan',
    icon: <BookOpen className="h-4 w-4" aria-hidden />,
  },
  {
    tab: 'resources',
    event: 'open-teacher-resource',
    label: 'Upload resource',
    description: 'Share worksheets and guides',
    icon: <Upload className="h-4 w-4" aria-hidden />,
  },
  {
    tab: 'assessments',
    event: 'open-teacher-assessment',
    label: 'New assessment',
    description: 'Create a quiz, test, or exam',
    icon: <FilePlus className="h-4 w-4" aria-hidden />,
  },
];

export function TeacherQuickActions({
  onNavigate,
}: {
  onNavigate: (tab: string, eventName?: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const { teachers, currentUser } = useApp();
  const teacher = getDemoTeacher(
    teachers,
    currentUser?.email,
    currentUser?.displayName,
  );

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  const handleAction = (action: QuickAction) => {
    onNavigate(action.tab, action.event);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="fixed bottom-8 right-8 z-40 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[min(320px,calc(100vw-4rem))] overflow-hidden rounded-xl border border-border bg-white shadow-[0_8px_24px_rgba(15,23,42,0.12)] animate-fade-in">
          <div className="border-b border-border px-4 py-3">
            <h3 className={aisHeadlineSm}>Quick actions</h3>
            <p className={`${aisBodyMd} mt-0.5`}>{teacher.name}</p>
          </div>
          <div className="p-2">
            {QUICK_ACTIONS.map((action) => (
              <button
                key={`${action.tab}-${action.event ?? action.label}`}
                type="button"
                onClick={() => handleAction(action)}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors hover:bg-muted"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  {action.icon}
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold text-foreground">
                    {action.label}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {action.description}
                  </span>
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      <button
        type="button"
        title={`Quick actions · ${teacher.name}`}
        aria-label="Quick actions"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        className={`${aisBtnPrimary} h-12 w-12 justify-center rounded-full p-0 shadow-[0_4px_12px_rgba(0,74,198,0.25)]`}
      >
        {open ? (
          <X className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        ) : (
          <Plus className="h-5 w-5" strokeWidth={2.5} aria-hidden />
        )}
      </button>
    </div>
  );
}
