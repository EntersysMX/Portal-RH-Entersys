import { createContext, useContext, useState, useCallback, useEffect } from 'react';

interface SidebarState {
  collapsed: boolean;
  mobileOpen: boolean;
  toggle: () => void;
  openMobile: () => void;
  closeMobile: () => void;
}

const SidebarContext = createContext<SidebarState | null>(null);

export { SidebarContext };

export function useSidebarStateValue(): SidebarState {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const toggle = useCallback(() => setCollapsed((c) => !c), []);
  const openMobile = useCallback(() => setMobileOpen(true), []);
  const closeMobile = useCallback(() => setMobileOpen(false), []);

  // Close mobile sidebar on window resize past lg breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 1024px)');
    const handler = () => {
      if (mq.matches) setMobileOpen(false);
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { collapsed, mobileOpen, toggle, openMobile, closeMobile };
}

export function useSidebarState(): SidebarState {
  const ctx = useContext(SidebarContext);
  if (!ctx) throw new Error('useSidebarState must be used within SidebarProvider');
  return ctx;
}
