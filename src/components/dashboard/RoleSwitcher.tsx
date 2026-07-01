'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { useApp } from '@/context/AppContext';
import { usePathname, useRouter } from 'next/navigation';
import { ModalOverlay, ModalPortal, useModalScrollLock } from '@/components/ui/modal-overlay';

const DEMO_ROLES = [
  {
    id: 'moe',
    name: 'MOE Admin',
    desc: 'National statistics, map data, regional comparison, predictive dropout analytics, school registry.',
  },
  {
    id: 'school-head',
    name: 'School Head',
    desc: 'Timetable conflict resolver, lesson plan & exam banks approval desk, employee tracker, survey check-ins.',
  },
  {
    id: 'registrar',
    name: 'Registrar Officer',
    desc: 'Student registration & onboarding, application review, grade management, transfers, and class placement.',
  },
  {
    id: 'hr',
    name: 'HR Officer',
    desc: 'Full HRMS — employee directory, leave, attendance, payroll, recruitment, performance reviews, and onboarding.',
  },
  {
    id: 'curriculum-head',
    name: 'Curriculum Head',
    desc: 'Curriculum coverage dashboards, national syllabi customization, textbooks download tracking logs.',
  },
  {
    id: 'department-head',
    name: 'Department Head',
    desc: 'AI Lesson Plan generator, evaluations matrix, teachers allocation, assessment approvals.',
  },
  {
    id: 'teacher',
    name: 'Teacher Portal',
    desc: 'AI Teaching notes generator, multilingual worksheets, marks grid, section attendance logs.',
  },
  {
    id: 'student',
    name: 'Student Portal',
    desc: 'Grades overview, AI homework chatbot tutor, dynamic homework tasks, recommended revision files.',
  },
  {
    id: 'parent',
    name: 'Parent Portal',
    desc: 'Real-time child grades tracking, child attendance calendar, live teacher messaging, AI child advisor notes.',
  },
] as const;

function roleFromPathname(pathname: string | null): string | null {
  if (!pathname) return null;
  const match = pathname.match(/^\/dashboard\/([^/]+)/);
  return match?.[1] ?? null;
}

export const RoleSwitcher: React.FC = () => {
  const { activeRole, setActiveRole } = useApp();
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  const pathRole = roleFromPathname(pathname);
  const currentRole = pathRole ?? activeRole;

  const isAuthPage = pathname === '/login' || pathname === '/forgot-password';

  useModalScrollLock(isOpen);

  // Keep context in sync when URL changes (refresh, direct link, browser back)
  useEffect(() => {
    if (pathRole && pathRole !== activeRole) {
      setActiveRole(pathRole);
    }
  }, [pathRole, activeRole, setActiveRole]);

  useEffect(() => {
    if (!isOpen) return;

    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [isOpen]);

  const handleRoleChange = useCallback(
    (roleId: string) => {
      setActiveRole(roleId);
      router.push(`/dashboard/${roleId}`);
      setIsOpen(false);
    },
    [router, setActiveRole],
  );

  if (isAuthPage) {
    return null;
  }

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[70]">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          aria-expanded={isOpen}
          aria-haspopup="dialog"
          className="flex items-center space-x-2 px-4 py-3 bg-primary text-primary-foreground rounded-full shadow-lg shadow-primary/25 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all duration-200 cursor-pointer font-medium text-xs border border-primary/30"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary-foreground/60 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-primary-foreground" />
          </span>
          <span>Demo Role Switcher</span>
          <svg
            className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
          </svg>
        </button>
      </div>

      {isOpen && (
        <ModalPortal>
          <ModalOverlay zIndexClass="z-[65]" onClick={() => setIsOpen(false)} />

          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="role-switcher-title"
            className="fixed z-[66] bottom-24 right-4 sm:right-6 w-[min(420px,calc(100vw-2rem))] max-h-[min(80vh,32rem)] bg-card border border-border/80 rounded-xl shadow-2xl p-5 overflow-hidden animate-fade-in flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="border-b border-border/40 pb-3 mb-3 flex items-center justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h4 id="role-switcher-title" className="text-sm font-semibold tracking-tight">
                  Ecosystem Role Switcher
                </h4>
                <p className="text-xxs text-muted-foreground mt-0.5">
                  Click a role to test its custom modules and workflows instantly.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="shrink-0 text-muted-foreground hover:text-foreground p-2 rounded-lg hover:bg-muted transition-colors cursor-pointer"
                aria-label="Close role switcher"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="overflow-y-auto space-y-2.5 flex-1 pr-1 min-h-0">
              {DEMO_ROLES.map((role) => {
                const isSelected = currentRole === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => handleRoleChange(role.id)}
                    className={`w-full text-left p-3 rounded-lg border text-xxs transition-all duration-200 cursor-pointer flex flex-col space-y-1.5 ${
                      isSelected
                        ? 'bg-primary/10 border-primary shadow-sm ring-1 ring-primary/20'
                        : 'bg-card border-border/40 hover:border-primary/30 hover:bg-primary/5'
                    }`}
                  >
                    <div className="flex items-center justify-between w-full gap-2">
                      <span className="font-semibold text-foreground text-xs">{role.name}</span>
                      {isSelected ? (
                        <span className="text-[9px] font-bold px-2 py-0.5 bg-primary text-primary-foreground rounded-full shrink-0">
                          ACTIVE
                        </span>
                      ) : (
                        <span className="text-[9px] px-2 py-0.5 bg-muted text-muted-foreground rounded-full shrink-0">
                          Switch
                        </span>
                      )}
                    </div>
                    <p className="text-muted-foreground leading-relaxed text-xxs">{role.desc}</p>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-border/40 pt-3 mt-3 text-center shrink-0">
              <span className="text-[10px] text-muted-foreground">
                All data is simulated locally inside the browser.
              </span>
            </div>
          </div>
        </ModalPortal>
      )}
    </>
  );
};

export default RoleSwitcher;
