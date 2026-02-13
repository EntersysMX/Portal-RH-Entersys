import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { usePermissions } from '@/hooks/usePermissions';
import type { MenuSection } from '@/lib/permissions';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Sección requerida para acceder a esta ruta */
  requiredSection?: MenuSection;
  /** Roles requeridos (al menos uno) */
  requiredRoles?: string[];
}

/**
 * Guardia de ruta que verifica autenticación y permisos.
 * - Si no está autenticado → /login
 * - Si no tiene permiso → redirige a su home (portal o dashboard)
 */
export default function ProtectedRoute({ children, requiredSection, requiredRoles }: ProtectedRouteProps) {
  const { isAuthenticated } = useAuthStore();
  const { canAccess, hasAnyRole, homePath } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Verificar permiso de sección
  if (requiredSection && !canAccess(requiredSection)) {
    return <Navigate to={homePath} replace />;
  }

  // Verificar roles específicos
  if (requiredRoles && requiredRoles.length > 0 && !hasAnyRole(requiredRoles)) {
    return <Navigate to={homePath} replace />;
  }

  return <>{children}</>;
}
