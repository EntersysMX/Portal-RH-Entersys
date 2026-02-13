import { usePermissions } from '@/hooks/usePermissions';
import type { MenuSection, Action } from '@/lib/permissions';

interface RoleGuardProps {
  children: React.ReactNode;
  /** Solo renderiza si puede ver esta sección */
  section?: MenuSection;
  /** Solo renderiza si puede realizar esta acción en la sección */
  action?: Action;
  /** Solo renderiza si tiene al menos uno de estos roles */
  roles?: string[];
  /** Solo para admins */
  adminOnly?: boolean;
  /** Solo para empleados sin roles HR */
  employeeOnly?: boolean;
  /** Componente alternativo si no tiene permiso */
  fallback?: React.ReactNode;
}

/**
 * Renderizado condicional basado en permisos.
 * Envuelve botones, secciones o cualquier elemento que deba
 * ocultarse según el rol del usuario.
 */
export default function RoleGuard({
  children,
  section,
  action,
  roles,
  adminOnly,
  employeeOnly,
  fallback = null,
}: RoleGuardProps) {
  const { canAccess, can, hasAnyRole, isAdmin, isEmployeeOnly } = usePermissions();

  if (adminOnly && !isAdmin) return <>{fallback}</>;
  if (employeeOnly && !isEmployeeOnly) return <>{fallback}</>;
  if (roles && roles.length > 0 && !hasAnyRole(roles)) return <>{fallback}</>;
  if (section && action && !can(section, action)) return <>{fallback}</>;
  if (section && !action && !canAccess(section)) return <>{fallback}</>;

  return <>{children}</>;
}
