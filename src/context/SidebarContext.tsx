'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SidebarContextType {
  isCollapsed: boolean;
  isMobileOpen: boolean;
  toggleCollapsed: () => void;
  setCollapsed: (value: boolean) => void;
  toggleMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarContextType | undefined>(undefined);

const STORAGE_KEY = 'prime-sidebar-collapsed';

export const SidebarProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isCollapsed, setIsCollapsed] = useState(() => {
    // Load persisted state on initial render
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored !== null) {
          return JSON.parse(stored);
        }
      } catch {
        // Ignore storage errors
      }
    }
    return false;
  });
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Persist collapsed state
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(isCollapsed));
    } catch {
      // Ignore storage errors
    }
  }, [isCollapsed]);

  // Keyboard shortcut: Ctrl/Cmd + B to toggle sidebar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setIsCollapsed((prev: boolean) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Close mobile sidebar on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleCollapsed = useCallback(() => {
    setIsCollapsed((prev: boolean) => !prev);
  }, []);

  const setCollapsed = useCallback((value: boolean) => {
    setIsCollapsed(value);
  }, []);

  const toggleMobile = useCallback(() => {
    setIsMobileOpen((prev: boolean) => !prev);
  }, []);

  const closeMobile = useCallback(() => {
    setIsMobileOpen(false);
  }, []);

  return (
    <SidebarContext.Provider value={{
      isCollapsed,
      isMobileOpen,
      toggleCollapsed,
      setCollapsed,
      toggleMobile,
      closeMobile,
    }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const useSidebar = (): SidebarContextType => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error('useSidebar must be used within a SidebarProvider');
  }
  return context;
};
