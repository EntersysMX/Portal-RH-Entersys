import { useMemo } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  getUserProfile,
  canAccessSection,
  canPerformAction,
  getVisibleSections,
  isAdmin as checkAdmin,
  isHR as checkHR,
  isEmployeeOnly as checkEmployeeOnly,
  hasAnyRole,
  getHomePath,
  getProfileLabel,
  getProfileBadgeColor,
  type MenuSection,
  type Action,
  type UserProfile,
} from '@/lib/permissions';

export function usePermissions() {
  const user = useAuthStore((s) => s.user);
  const roles = useMemo(() => user?.roles ?? [], [user]);

  return useMemo(
    () => ({
      /** Roles raw del usuario */
      roles,

      /** Perfil calculado */
      profile: getUserProfile(roles) as UserProfile,

      /** Puede ver esta sección? */
      canAccess: (section: MenuSection) => canAccessSection(roles, section),

      /** Puede realizar esta acción en esta sección? */
      can: (section: MenuSection, action: Action) => canPerformAction(roles, section, action),

      /** Helpers de rol */
      isAdmin: checkAdmin(roles),
      isHR: checkHR(roles),
      isEmployeeOnly: checkEmployeeOnly(roles),
      hasAnyRole: (required: string[]) => hasAnyRole(roles, required),

      /** Secciones visibles */
      visibleSections: getVisibleSections(roles),

      /** Ruta de inicio */
      homePath: getHomePath(roles),

      /** Label y color del perfil */
      profileLabel: getProfileLabel(roles),
      profileBadgeColor: getProfileBadgeColor(roles),
    }),
    [roles]
  );
}
