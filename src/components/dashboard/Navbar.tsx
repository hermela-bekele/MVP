'use client';

import React, { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { useSidebar } from '@/context/SidebarContext';
import { Breadcrumb, BreadcrumbItem } from '@/components/ui/breadcrumb';

interface NavbarProps {
  breadcrumbs?: BreadcrumbItem[];
}

export const Navbar: React.FC<NavbarProps> = ({ breadcrumbs }) => {
  const { activeRole, theme, toggleTheme, notifications, markNotificationAsRead, clearNotifications } = useApp();
  const { toggleMobile } = useSidebar();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const unreadCount = notifications.filter(n => !n.read).length;

  const getNotifColor = (type: string) => {
    switch (type) {
      case 'alert': return 'bg-destructive/10 text-destructive border-destructive/20';
      case 'success': return 'bg-primary/10 text-primary border-primary/20';
      case 'request': return 'bg-primary/5 text-primary border-primary/15';
      default: return 'bg-muted text-foreground border-border';
    }
  };

  const getRoleLabel = () => {
    switch (activeRole) {
      case 'moe': return 'MOE Admin';
      case 'school-head': return 'School Head';
      case 'hr': return 'HR Officer';
      case 'registrar': return 'Registrar';
      case 'curriculum-head': return 'Curriculum';
      case 'department-head': return 'Dept Head';
      case 'teacher': return 'Teacher';
      case 'student': return 'Student';
      case 'parent': return 'Parent';
      default: return 'User';
    }
  };

  const defaultBreadcrumbs: BreadcrumbItem[] = [
    { label: 'Portal', href: '#' },
    { label: getRoleLabel() }
  ];

  const activeBreadcrumbs = breadcrumbs ?? defaultBreadcrumbs;

  return (
    <header className="h-14 border-b border-border/70 bg-card px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 w-full shadow-sm">
      
      {/* Left side: Mobile Toggle & Breadcrumbs */}
      <div className="flex items-center space-x-3 flex-1 min-w-0">
        <button
          onClick={toggleMobile}
          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-lg transition-colors cursor-pointer lg:hidden shrink-0"
          title="Toggle Navigation Menu"
          aria-label="Toggle Navigation Menu"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
        
        <div className="hidden sm:block truncate">
          <Breadcrumb items={activeBreadcrumbs} />
        </div>
      </div>

      {/* Search Input Bar (Command Palette Trigger) */}
      <div className="w-80 max-w-full hidden md:block mx-4">
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('open-command-palette'))}
          className="w-full h-9 px-3 bg-muted/40 hover:bg-muted/60 border border-border/60 rounded-lg text-xs text-muted-foreground flex items-center justify-between transition-all duration-200 group cursor-pointer focus:outline-none focus:ring-2 focus:ring-ring"
        >
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <span className="group-hover:text-foreground transition-colors duration-200 truncate">Search portals, actions (Ctrl+K)...</span>
          </div>
          <kbd className="hidden lg:inline-flex items-center gap-0.5 rounded border border-border bg-muted/80 px-1.5 py-0.5 font-mono text-[9px] font-bold text-muted-foreground select-none">
            Ctrl+K
          </kbd>
        </button>
      </div>

      {/* Utilities */}
      <div className="flex items-center space-x-4 ml-auto">
        
        {/* Theme Swapper Toggle */}
        <button
          onClick={toggleTheme}
          className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors cursor-pointer"
          title="Toggle Theme"
        >
          {theme === 'dark' ? (
            // Sun icon
            <svg className="w-5 h-5 animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M16.243 17.657l.707.707M6.343 6.364l.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
            </svg>
          ) : (
            // Moon icon
            <svg className="w-5 h-5 animate-fade-in" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>

        {/* Notifications Popover Dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowNotif(!showNotif); setShowProfile(false); }}
            className="p-1.5 hover:bg-muted text-muted-foreground hover:text-foreground rounded-md transition-colors relative cursor-pointer"
            title="Notifications"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[9px] font-bold text-destructive-foreground">
                {unreadCount}
              </span>
            )}
          </button>

          {showNotif && (
            <>
              <div
                className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-md backdrop-saturate-150 [-webkit-backdrop-filter:blur(12px)]"
                onClick={() => setShowNotif(false)}
                aria-hidden
              />
              <div className="absolute right-0 mt-2 w-80 bg-card border border-border/80 rounded-lg shadow-xl z-30 p-4 animate-fade-in glass max-h-96 flex flex-col">
                <div className="flex items-center justify-between border-b border-border/40 pb-2 mb-2">
                  <span className="text-xs font-semibold">Active Alerts</span>
                  <div className="flex space-x-2">
                    {unreadCount > 0 && (
                      <button onClick={clearNotifications} className="text-[10px] text-muted-foreground hover:text-foreground font-medium cursor-pointer">
                        Clear all
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="overflow-y-auto space-y-2.5 flex-1 pr-0.5">
                  {notifications.length === 0 ? (
                    <div className="text-center py-6 text-xxs text-muted-foreground">
                      No notifications at this time.
                    </div>
                  ) : (
                    notifications.map((not) => (
                      <div
                        key={not.id}
                        onClick={() => markNotificationAsRead(not.id)}
                        className={`p-2.5 rounded-lg border text-xxs leading-normal flex flex-col space-y-1 transition-all duration-200 cursor-pointer ${
                          not.read 
                            ? 'bg-card/30 border-border/20 opacity-60' 
                            : 'bg-primary/5 border-primary/20 hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start justify-between">
                          <span className={`px-1.5 py-0.5 rounded-sm border text-[9px] font-semibold uppercase ${getNotifColor(not.type)}`}>
                            {not.type}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{not.timestamp}</span>
                        </div>
                        <h5 className="font-semibold text-foreground mt-0.5">{not.title}</h5>
                        <p className="text-muted-foreground">{not.description}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </>
          )}
        </div>

        {/* Profile Avatar Trigger */}
        <div className="relative">
          <button
            onClick={() => { setShowProfile(!showProfile); setShowNotif(false); }}
            className="flex items-center space-x-2.5 hover:bg-muted/40 p-1.5 rounded-lg transition-colors cursor-pointer"
          >
            <div className="h-8 w-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-xs shadow-sm">
              AD
            </div>
            <div className="flex flex-col text-left hidden sm:flex">
              <span className="text-xs font-semibold text-foreground">Ato Demeke</span>
              <span className="text-[10px] text-muted-foreground">Admin Desk</span>
            </div>
            <svg className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {showProfile && (
            <>
              <div
                className="fixed inset-0 z-20 bg-slate-950/40 backdrop-blur-md backdrop-saturate-150 [-webkit-backdrop-filter:blur(12px)]"
                onClick={() => setShowProfile(false)}
                aria-hidden
              />
              <div className="absolute right-0 mt-2 w-48 bg-card border border-border/80 rounded-lg shadow-xl z-30 p-2 animate-fade-in glass">
                <div className="px-3 py-2 border-b border-border/40">
                  <p className="text-xs font-semibold">Bole Secondary School</p>
                  <p className="text-[10px] text-muted-foreground">Addis Ababa, ET</p>
                </div>
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full text-left px-3 py-2 text-xxs text-foreground hover:bg-muted rounded-md mt-1.5 transition-colors cursor-pointer"
                >
                  My Profile Settings
                </button>
                <button
                  onClick={() => setShowProfile(false)}
                  className="w-full text-left px-3 py-2 text-xxs text-foreground hover:bg-muted rounded-md transition-colors cursor-pointer"
                >
                  System Preferences
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
