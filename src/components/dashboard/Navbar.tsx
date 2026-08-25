'use client';

import React, { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/context/AppContext';
import { useSidebar } from '@/context/SidebarContext';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb';
import {
  aisBodyMd,
  aisBodySm,
  aisNavbar,
  aisNavbarAvatar,
  aisNavbarDropdown,
  aisNavbarDropdownItem,
  aisNavbarIconBtn,
  aisNavbarNotifBadge,
  aisNavbarNotifFilterBtn,
  aisNavbarNotifFilterBtnActive,
  aisNavbarNotifFilterBtnInactive,
  aisNavbarNotifFilters,
  aisNavbarNotifHeader,
  aisNavbarNotifItem,
  aisNavbarNotifItemUnread,
  aisNavbarNotifItemInner,
  aisNavbarNotifIconWrap,
  aisNavbarNotifIconAlert,
  aisNavbarNotifIconSuccess,
  aisNavbarNotifIconRequest,
  aisNavbarNotifIconInfo,
  aisNavbarNotifActionBtn,
  aisNavbarNotifActionBtnDanger,
  aisNavbarNotifActions,
  aisNavbarNotifFooterBtn,
  aisNavbarNotifList,
  aisNavbarNotifPanel,
  aisNavbarNotifSectionHeader,
  aisNavbarNotifTypeAlert,
  aisNavbarNotifTypeInfo,
  aisNavbarNotifTypeRequest,
  aisNavbarNotifTypeSuccess,
  aisNavbarOverlay,
  aisNavbarProfileBtn,
  aisNavbarProfileName,
  aisNavbarProfileRole,
  aisNavbarSearch,
  aisNavbarSearchKbd,
} from '@/components/dashboard/teacher/aisStyles';
import type { AppNotification } from '@/context/AppContext';
import { roleLabel, isPortalRole } from '@/lib/auth';
import { portalTabPath } from '@/lib/portalPaths';

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Resolve deep-link path or fall back to role-aware tab heuristics. */
function resolveNotifDestination(
  not: AppNotification,
  role: string | null | undefined,
): { path?: string; tab?: string; label: string } {
  if (not.linkPath) {
    return { path: not.linkPath, label: 'Open' };
  }
  const title = not.title.toLowerCase();
  if (not.type === 'alert' && title.includes('attendance')) {
    return { tab: 'attendance', label: 'Take attendance' };
  }
  if (title.includes('lesson plan')) {
    return {
      tab: 'lesson-plans',
      label: 'Review plan',
    };
  }
  if (title.includes('teaching note') || title.includes('lesson note')) {
    return {
      tab: 'lesson-notes',
      label: 'Open lesson notes',
    };
  }
  if (title.includes('assessment') || title.includes('quiz') || title.includes('exam')) {
    return {
      tab: role === 'department-head' ? 'assessments' : 'assessments',
      label: 'Open assessments',
    };
  }
  if (title.includes('grade gap') || title.includes('training') || title.includes('miss')) {
    return {
      tab: role === 'department-head' ? 'training' : 'training',
      label: 'Open training',
    };
  }
  if (title.includes('message') || title.includes('challenge') || title.includes('communication')) {
    return { tab: 'communication', label: 'Open messages' };
  }
  if (not.type === 'request') {
    return { tab: 'dashboard', label: 'Open queue' };
  }
  return { tab: 'dashboard', label: 'View details' };
}

interface NavbarProps {
  breadcrumbs?: BreadcrumbItem[];
  hideSearch?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({ breadcrumbs, hideSearch = false }) => {
  const router = useRouter();
  const {
    activeRole,
    currentUser,
    schools,
    notifications,
    markNotificationAsRead,
    markNotificationAsUnread,
    dismissNotification,
    clearNotifications,
    logout,
  } = useApp();
  const { toggleMobile } = useSidebar();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [notifFilter, setNotifFilter] = useState<'all' | 'unread' | 'read'>('all');

  const role = currentUser?.role ?? activeRole;

  const unreadNotifications = useMemo(
    () => notifications.filter((n) => !n.read),
    [notifications]
  );
  const readNotifications = useMemo(
    () => notifications.filter((n) => n.read),
    [notifications]
  );
  const unreadCount = unreadNotifications.length;

  const getNotifTypeClass = (type: string) => {
    switch (type) {
      case 'alert': return aisNavbarNotifTypeAlert;
      case 'success': return aisNavbarNotifTypeSuccess;
      case 'request': return aisNavbarNotifTypeRequest;
      default: return aisNavbarNotifTypeInfo;
    }
  };

  const getNotifIconWrapClass = (type: string) => {
    switch (type) {
      case 'alert': return aisNavbarNotifIconAlert;
      case 'success': return aisNavbarNotifIconSuccess;
      case 'request': return aisNavbarNotifIconRequest;
      default: return aisNavbarNotifIconInfo;
    }
  };

  const NotifTypeIcon = ({ type }: { type: AppNotification['type'] }) => {
    const cls = 'h-5 w-5';
    switch (type) {
      case 'alert':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        );
      case 'success':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
      case 'request':
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        );
      default:
        return (
          <svg className={cls} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        );
    }
  };

  const getNotifActions = (not: AppNotification) => {
    const dest = resolveNotifDestination(not, role);
    return [dest];
  };

  const handleNotifNavigate = (not: AppNotification, dest: { path?: string; tab?: string }) => {
    markNotificationAsRead(not.id);
    setShowNotif(false);
    if (dest.path) {
      router.push(dest.path);
      return;
    }
    if (dest.tab) {
      const path = portalTabPath(role, dest.tab);
      router.push(path);
      window.dispatchEvent(new CustomEvent('dashboard-navigate', { detail: { tab: dest.tab } }));
    }
  };

  const renderNotification = (not: AppNotification) => {
    const footerActions = getNotifActions(not);

    return (
      <div
        key={not.id}
        className={`${aisNavbarNotifItem} ${not.read ? 'opacity-75' : aisNavbarNotifItemUnread}`}
      >
        <div className={aisNavbarNotifItemInner}>
          <div className={`${aisNavbarNotifIconWrap} ${getNotifIconWrapClass(not.type)}`}>
            <NotifTypeIcon type={not.type} />
          </div>

          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-start justify-between gap-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className={`${getNotifTypeClass(not.type)} capitalize`}>{not.type}</span>
                <span className="text-ais-outline">·</span>
                <span className={`${aisBodySm} shrink-0 tabular-nums`}>{not.timestamp}</span>
                {!not.read && (
                  <span className="inline-flex h-2 w-2 rounded-full bg-ais-primary" title="Unread" aria-hidden />
                )}
              </div>

              <div className={aisNavbarNotifActions}>
                {!not.read ? (
                  <button
                    type="button"
                    title="Mark as read"
                    aria-label="Mark as read"
                    className={aisNavbarNotifActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsRead(not.id);
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    type="button"
                    title="Mark as unread"
                    aria-label="Mark as unread"
                    className={aisNavbarNotifActionBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      markNotificationAsUnread(not.id);
                    }}
                  >
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                  </button>
                )}
                <button
                  type="button"
                  title="Open"
                  aria-label="Open notification"
                  className={aisNavbarNotifActionBtn}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleNotifNavigate(not, footerActions[0] ?? { tab: 'dashboard' });
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </button>
                <button
                  type="button"
                  title="Dismiss"
                  aria-label="Dismiss notification"
                  className={aisNavbarNotifActionBtnDanger}
                  onClick={(e) => {
                    e.stopPropagation();
                    dismissNotification(not.id);
                  }}
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="button"
              className="w-full text-left cursor-pointer"
              onClick={() => handleNotifNavigate(not, footerActions[0] ?? { tab: 'dashboard' })}
            >
              <p className="text-base font-bold leading-snug text-foreground">{not.title}</p>
              <p className={`${aisBodyMd} mt-1.5 leading-relaxed`}>{not.description}</p>
            </button>

            {footerActions.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {footerActions.map((action) => (
                  <button
                    key={action.label}
                    type="button"
                    className={aisNavbarNotifFooterBtn}
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNotifNavigate(not, action);
                    }}
                  >
                    {action.label}
                    <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const getRoleLabel = () => {
    const role = currentUser?.role ?? activeRole;
    return isPortalRole(role) ? roleLabel(role) : 'User';
  };

  const profileName = currentUser?.displayName ?? 'Signed in user';
  const profileRole = getRoleLabel();
  const profileInitials = getInitials(profileName);
  const primarySchool = schools[0];

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Portal', href: '#' },
    { label: getRoleLabel() }
  ];

  const activeBreadcrumbs = breadcrumbs ?? defaultBreadcrumbs;

  return (
    <header className={aisNavbar}>
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <button
          onClick={toggleMobile}
          className={`${aisNavbarIconBtn} lg:hidden shrink-0`}
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        <div className="hidden sm:block truncate">
          <Breadcrumb items={activeBreadcrumbs} variant="ais" />
        </div>
      </div>

      {/* Search Input Bar (Command Palette Trigger) */}
      {!hideSearch && (
        <div className="w-80 max-w-full hidden md:block mx-4">
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
            className={aisNavbarSearch}
          >
            <div className="flex items-center space-x-2 min-w-0">
              <svg className="w-4 h-4 text-ais-primary shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <span className="truncate group-hover:text-ais-primary transition-colors duration-200">
                Search portals, actions (Ctrl+K)...
              </span>
            </div>
            <kbd className={aisNavbarSearchKbd}>
              Ctrl+K
            </kbd>
          </button>
        </div>
      )}

      {/* Utilities */}
      <div className="flex items-center space-x-3 ml-auto">
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className={`${aisNavbarIconBtn} relative`}
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className={aisNavbarNotifBadge}>
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div
                className={aisNavbarOverlay}
                onClick={() => setShowNotif(false)}
                aria-hidden
              />
              <div className={aisNavbarNotifPanel}>
                <div className={aisNavbarNotifHeader}>
                  <span className="text-sm font-bold text-ais-on-surface">Notifications</span>
                  {unreadCount > 0 && (
                    <button
                      type="button"
                      onClick={clearNotifications}
                      className="text-[11px] font-semibold text-ais-primary hover:text-ais-primary-container cursor-pointer"
                    >
                      Clear all
                    </button>
                  )}
                </div>

                <div className={aisNavbarNotifFilters}>
                  {(
                    [
                      { id: 'all' as const, label: 'All', count: notifications.length },
                      { id: 'unread' as const, label: 'Unread', count: unreadCount },
                      { id: 'read' as const, label: 'Read', count: readNotifications.length },
                    ] as const
                  ).map(({ id, label, count }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setNotifFilter(id)}
                      className={`${aisNavbarNotifFilterBtn} ${
                        notifFilter === id
                          ? aisNavbarNotifFilterBtnActive
                          : aisNavbarNotifFilterBtnInactive
                      }`}
                    >
                      {label}
                      {count > 0 && (
                        <span className="ml-1 tabular-nums text-muted-foreground">
                          ({count})
                        </span>
                      )}
                    </button>
                  ))}
                </div>

                <div className={aisNavbarNotifList}>
                  {notifications.length === 0 ? (
                    <p className={`${aisBodyMd} px-4 py-8 text-center`}>
                      No notifications at this time.
                    </p>
                  ) : notifFilter === 'unread' && unreadCount === 0 ? (
                    <p className={`${aisBodyMd} px-4 py-8 text-center`}>
                      You&apos;re all caught up — no unread alerts.
                    </p>
                  ) : notifFilter === 'read' && readNotifications.length === 0 ? (
                    <p className={`${aisBodyMd} px-4 py-8 text-center`}>
                      No read notifications yet.
                    </p>
                  ) : notifFilter === 'all' ? (
                    <>
                      {unreadCount > 0 && (
                        <>
                          <div className={aisNavbarNotifSectionHeader}>
                            Unread · {unreadCount}
                          </div>
                          {unreadNotifications.map(renderNotification)}
                        </>
                      )}
                      {readNotifications.length > 0 && (
                        <>
                          <div className={aisNavbarNotifSectionHeader}>Read</div>
                          {readNotifications.map(renderNotification)}
                        </>
                      )}
                    </>
                  ) : notifFilter === 'unread' ? (
                    unreadNotifications.map(renderNotification)
                  ) : (
                    readNotifications.map(renderNotification)
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className={aisNavbarProfileBtn}
          >
            <div className={aisNavbarAvatar}>
              {profileInitials}
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className={aisNavbarProfileName}>{profileName}</span>
              <span className={aisNavbarProfileRole}>{profileRole}</span>
            </div>
            <svg className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfile && (
            <>
              <div
                className={aisNavbarOverlay}
                onClick={() => setShowProfile(false)}
                aria-hidden
              />
              <div className={`${aisNavbarDropdown} right-0 mt-2 w-52 p-2`}>
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-xs font-bold text-foreground truncate">
                    {primarySchool?.name ?? profileName}
                  </p>
                  <p className="text-[10px] text-muted-foreground truncate">
                    {primarySchool?.region ?? currentUser?.email ?? profileRole}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    const path = portalTabPath(role, 'profile');
                    router.push(path);
                    window.dispatchEvent(
                      new CustomEvent('dashboard-navigate', { detail: { tab: 'profile' } }),
                    );
                  }}
                  className={`${aisNavbarDropdownItem} mt-1.5`}
                >
                  My Profile Settings
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowProfile(false);
                    logout();
                    router.push('/login');
                  }}
                  className="w-full rounded-md px-3 py-2 text-left text-xs font-semibold text-red-600 transition-colors hover:bg-red-50 hover:text-red-700 cursor-pointer"
                >
                  Sign Out
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
export default Navbar;
