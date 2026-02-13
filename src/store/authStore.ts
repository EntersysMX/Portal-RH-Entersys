import { create } from 'zustand';
import { frappeLogin, frappeLogout, frappeGetLoggedUser, frappeGetUserRoles, frappeGetEmployeeByUser } from '@/api/client';
import type { FrappeUser } from '@/types/frappe';
import { isAdmin, isHR, isEmployeeOnly, hasAnyRole, getUserProfile, getHomePath } from '@/lib/permissions';

interface AuthState {
  user: FrappeUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
  clearError: () => void;
  hasRole: (role: string) => boolean;
  hasAnyRole: (roles: string[]) => boolean;
  isAdmin: () => boolean;
  isHR: () => boolean;
  isEmployee: () => boolean;
  getProfile: () => string;
  getHomePath: () => string;
}

function getStoredUser(): FrappeUser | null {
  try {
    const stored = localStorage.getItem('frappe_user');
    return stored ? (JSON.parse(stored) as FrappeUser) : null;
  } catch {
    return null;
  }
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: getStoredUser(),
  isAuthenticated: !!localStorage.getItem('frappe_user'),
  isLoading: false,
  error: null,

  login: async (username: string, password: string) => {
    set({ isLoading: true, error: null });

    try {
      const response = await frappeLogin(username, password);

      let roles: string[] = [];
      let employeeInfo: { employee_id: string; employee_name: string } | null = null;
      try {
        roles = await frappeGetUserRoles(username);
        employeeInfo = await frappeGetEmployeeByUser(username);
      } catch {
        roles = ['Employee'];
      }

      const user: FrappeUser = {
        name: response.full_name,
        email: username,
        full_name: response.full_name,
        roles,
        employee_id: employeeInfo?.employee_id,
        employee_name: employeeInfo?.employee_name,
      };
      localStorage.setItem('frappe_user', JSON.stringify(user));
      set({ user, isAuthenticated: true, isLoading: false });
    } catch (err) {
      console.error('[Auth] Login error:', err);
      const msg = err instanceof Error ? err.message : String(err);
      set({ error: `No se pudo conectar al servidor: ${msg}`, isLoading: false });
    }
  },

  logout: async () => {
    try {
      await frappeLogout();
    } catch {
      // Ignore logout errors
    } finally {
      localStorage.removeItem('frappe_user');
      localStorage.removeItem('frappe_api_token');
      set({ user: null, isAuthenticated: false });
    }
  },

  checkAuth: async () => {
    try {
      const response = await frappeGetLoggedUser();
      if (response.message && response.message !== 'Guest') {
        const stored = localStorage.getItem('frappe_user');
        if (stored) {
          const user = JSON.parse(stored) as FrappeUser;
          set({ user, isAuthenticated: true });
        } else {
          let roles: string[] = [];
          try {
            roles = await frappeGetUserRoles();
          } catch {
            roles = ['Employee'];
          }
          const user: FrappeUser = {
            name: response.message,
            email: response.message,
            full_name: response.message,
            roles,
          };
          localStorage.setItem('frappe_user', JSON.stringify(user));
          set({ user, isAuthenticated: true });
        }
      } else {
        set({ user: null, isAuthenticated: false });
      }
    } catch {
      set({ user: null, isAuthenticated: false });
    }
  },

  clearError: () => set({ error: null }),

  hasRole: (role: string) => {
    const user = get().user;
    return user?.roles?.includes(role) ?? false;
  },

  hasAnyRole: (roles: string[]) => {
    const user = get().user;
    return hasAnyRole(user?.roles ?? [], roles);
  },

  isAdmin: () => {
    const user = get().user;
    return isAdmin(user?.roles ?? []);
  },

  isHR: () => {
    const user = get().user;
    return isHR(user?.roles ?? []);
  },

  isEmployee: () => {
    const user = get().user;
    return isEmployeeOnly(user?.roles ?? []);
  },

  getProfile: () => {
    const user = get().user;
    return getUserProfile(user?.roles ?? []);
  },

  getHomePath: () => {
    const user = get().user;
    return getHomePath(user?.roles ?? []);
  },
}));
