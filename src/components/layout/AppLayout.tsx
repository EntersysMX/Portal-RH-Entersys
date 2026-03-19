import { Outlet } from 'react-router-dom';
import { clsx } from 'clsx';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import OnboardingTour from '../onboarding/OnboardingTour';
import { SidebarContext, useSidebarStateValue } from '@/hooks/useSidebarState';

export default function AppLayout() {
  const sidebarState = useSidebarStateValue();

  return (
    <SidebarContext.Provider value={sidebarState}>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
        <Sidebar />
        <div
          className={clsx(
            'transition-all duration-300',
            // Mobile: no margin (sidebar is overlay)
            'ml-0',
            // Desktop: margin depends on collapsed state
            sidebarState.collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
          )}
        >
          <Topbar />
          <main className="p-4 lg:p-6">
            <Outlet />
          </main>
        </div>
        <OnboardingTour />
      </div>
    </SidebarContext.Provider>
  );
}
