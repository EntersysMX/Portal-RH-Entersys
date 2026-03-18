import { create } from 'zustand';
import {
  frappeLogin, frappeLogout, frappeGetLoggedUser,
  frappeGetUserRoles, frappeGetEmployeeByUser, frappeCall,
} from '@/api/client';
import type { FrappeUser } from '@/types/frappe';
import { isAdmin, isHR, isEmployeeOnly, hasAnyRole, getUserProfile, getHomePath } from '@/lib/permissions';
import { useModuleStore } from './moduleStore';

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

/**
 * Intenta generar un API token para el usuario.
 * Solo funciona si el usuario tiene permisos (admin/system manager).
 * Si falla, se usa la auth por cookie de sesión.
 */
async function tryGenerateApiToken(username: string): Promise<void> {
  try {
    // Verificar si ya hay un token almacenado
    if (localStorage.getItem('frappe_api_token')) return;

    // Intentar generar claves API
    const result = await frappeCall<{ api_secret: string }>(
      'frappe.core.doctype.user.user.generate_keys',
      { user: username }
    );
    if (result?.api_secret) {
      // Obtener el api_key del doc del usuario
      const userDoc = await frappeCall<{ api_key: string }>(
        'frappe.client.get_value',
        { doctype: 'User', filters: username, fieldname: 'api_key' }
      );
      if (userDoc?.api_key) {
        const token = `${userDoc.api_key}:${result.api_secret}`;
        localStorage.setItem('frappe_api_token', token);
      }
    }
  } catch {
    // No se pudo generar token — se usa cookie de sesión (ya funciona)
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
        const [fetchedRoles, fetchedEmployee] = await Promise.all([
          frappeGetUserRoles(username),
          frappeGetEmployeeByUser(username),
        ]);
        roles = fetchedRoles;
        employeeInfo = fetchedEmployee;
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

      // Post-login: generar token + cargar config de módulos (async, no bloquea)
      tryGenerateApiToken(username);
      useModuleStore.getState().init();
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
          let employeeInfo: { employee_id: string; employee_name: string } | null = null;
          try {
            const [fetchedRoles, fetchedEmployee] = await Promise.all([
              frappeGetUserRoles(response.message),
              frappeGetEmployeeByUser(response.message),
            ]);
            roles = fetchedRoles;
            employeeInfo = fetchedEmployee;
          } catch {
            roles = ['Employee'];
          }
          const user: FrappeUser = {
            name: response.message,
            email: response.message,
            full_name: response.message,
            roles,
            employee_id: employeeInfo?.employee_id,
            employee_name: employeeInfo?.employee_name,
          };
          localStorage.setItem('frappe_user', JSON.stringify(user));
          set({ user, isAuthenticated: true });
        }
        // Cargar config de módulos desde el backend
        useModuleStore.getState().init();
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
