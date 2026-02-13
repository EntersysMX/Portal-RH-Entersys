import { Navigate } from 'react-router-dom';
import { usePermissions } from '@/hooks/usePermissions';

/**
 * Redirige la raíz `/` a la ruta apropiada según el rol:
 * - Admin/HR → /dashboard (o index del layout admin)
 * - Empleado → /portal
 */
export default function RoleRedirect() {
  const { isEmployeeOnly } = usePermissions();

  if (isEmployeeOnly) {
    return <Navigate to="/portal" replace />;
  }

  return <Navigate to="/dashboard" replace />;
}
