import { useState, useMemo } from 'react';
import { Users, Search, Shield, UserCog, Trash2 } from 'lucide-react';
import { clsx } from 'clsx';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import ErrorState from '@/components/ui/ErrorState';
import { useModuleStore } from '@/store/moduleStore';
import { useEmployees } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Employee } from '@/types/frappe';

export default function AdminUsers() {
  const { roles, assignments, setUserRoles, removeUserAssignment } = useModuleStore();
  const { data: employees, isLoading, isError, refetch } = useEmployees({ status: 'Active' }, 200);

  const [search, setSearch] = useState('');
  const [selectedUser, setSelectedUser] = useState<Employee | null>(null);
  const [selectedRoleIds, setSelectedRoleIds] = useState<string[]>([]);
  const [removeTarget, setRemoveTarget] = useState<(Employee & { customRoleIds: string[] }) | null>(null);

  // Merge employees with their assignments
  const usersWithRoles = useMemo(() => {
    if (!employees) return [];
    return employees.map((emp) => {
      const assignment = assignments.find((a) => a.userEmail === emp.user_id || a.userEmail === emp.name);
      return {
        ...emp,
        customRoleIds: assignment?.customRoleIds ?? [],
      };
    });
  }, [employees, assignments]);

  const filtered = useMemo(() => {
    if (!search) return usersWithRoles;
    const q = search.toLowerCase();
    return usersWithRoles.filter(
      (u) =>
        u.employee_name.toLowerCase().includes(q) ||
        u.name.toLowerCase().includes(q) ||
        u.department?.toLowerCase().includes(q) ||
        u.designation?.toLowerCase().includes(q) ||
        u.user_id?.toLowerCase().includes(q)
    );
  }, [usersWithRoles, search]);

  const openAssign = (emp: Employee & { customRoleIds: string[] }) => {
    setSelectedUser(emp);
    setSelectedRoleIds([...emp.customRoleIds]);
  };

  const handleSaveRoles = async () => {
    if (!selectedUser) return;
    const email = selectedUser.user_id || selectedUser.name;
    await setUserRoles(email, selectedUser.employee_name, selectedRoleIds);
    setSelectedUser(null);
    toast.success('Roles asignados', `Roles actualizados para ${selectedUser.employee_name}`);
  };

  const handleConfirmRemove = async () => {
    if (!removeTarget) return;
    const email = removeTarget.user_id || removeTarget.name;
    await removeUserAssignment(email);
    toast.success('Asignación removida', `${removeTarget.employee_name} usará el perfil por defecto de Frappe`);
    setRemoveTarget(null);
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoleIds((prev) =>
      prev.includes(roleId) ? prev.filter((r) => r !== roleId) : [...prev, roleId]
    );
  };

  const getRoleNames = (roleIds: string[]) => {
    return roleIds
      .map((id) => roles.find((r) => r.id === id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} message="No se pudo cargar la lista de empleados." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gestión de Usuarios</h1>
        <p className="mt-1 text-gray-500">
          Asigna roles personalizados a los empleados de tu empresa
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-primary-600">{employees?.length ?? 0}</p>
          <p className="text-sm text-gray-500">Empleados activos</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-green-600">{assignments.length}</p>
          <p className="text-sm text-gray-500">Con roles personalizados</p>
        </div>
        <div className="card p-4 text-center">
          <p className="text-2xl font-bold text-gray-400">{(employees?.length ?? 0) - assignments.length}</p>
          <p className="text-sm text-gray-500">Sin roles personalizados</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          className="input pl-10"
          placeholder="Buscar por nombre, ID, departamento o email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Users list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="card p-8 text-center">
            <Users className="mx-auto h-8 w-8 text-gray-300" />
            <p className="mt-2 text-gray-400">No se encontraron empleados</p>
          </div>
        )}
        {filtered.map((emp) => {
          const hasCustomRoles = emp.customRoleIds.length > 0;
          return (
            <div key={emp.name} className="card flex items-center justify-between p-4">
              <div className="flex items-center gap-3">
                <div className={clsx(
                  'flex h-10 w-10 items-center justify-center rounded-full',
                  hasCustomRoles ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                )}>
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-gray-900">{emp.employee_name}</p>
                    <span className="text-xs text-gray-400">{emp.name}</span>
                  </div>
                  <p className="text-sm text-gray-500">
                    {emp.designation} — {emp.department}
                  </p>
                  {hasCustomRoles && (
                    <div className="mt-1 flex flex-wrap gap-1">
                      {emp.customRoleIds.map((rid) => {
                        const role = roles.find((r) => r.id === rid);
                        return role ? (
                          <span key={rid} className="rounded-full bg-primary-50 px-2 py-0.5 text-[10px] font-medium text-primary-700">
                            {role.name}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => openAssign(emp)}
                  className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                  title="Asignar roles"
                >
                  <UserCog className="h-4 w-4" />
                </button>
                {hasCustomRoles && (
                  <button
                    onClick={() => setRemoveTarget(emp)}
                    className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                    title="Quitar roles personalizados"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Assign roles modal */}
      <Modal
        isOpen={!!selectedUser}
        onClose={() => setSelectedUser(null)}
        title={`Asignar Roles: ${selectedUser?.employee_name ?? ''}`}
        size="md"
        footer={
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-400">
              {selectedRoleIds.length === 0 ? 'Sin roles: usará perfil Frappe por defecto' : getRoleNames(selectedRoleIds)}
            </span>
            <div className="flex gap-2">
              <button onClick={() => setSelectedUser(null)} className="btn-secondary">Cancelar</button>
              <button onClick={handleSaveRoles} className="btn-primary">Guardar</button>
            </div>
          </div>
        }
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Selecciona los roles que tendrá este usuario. Los permisos se combinan de todos los roles asignados.
          </p>
          <div className="space-y-2">
            {roles.map((role) => (
              <label
                key={role.id}
                className={clsx(
                  'flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition-colors',
                  selectedRoleIds.includes(role.id)
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:bg-gray-50'
                )}
              >
                <input
                  type="checkbox"
                  checked={selectedRoleIds.includes(role.id)}
                  onChange={() => toggleRole(role.id)}
                  className="mt-0.5 h-4 w-4 rounded border-gray-300 text-primary-600"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">{role.name}</span>
                    {role.isSystem && (
                      <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                        Sistema
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-gray-500">{role.description}</p>
                  <p className="mt-0.5 text-[10px] text-gray-400">{role.permissions.length} permisos</p>
                </div>
              </label>
            ))}
          </div>
        </div>
      </Modal>

      <ConfirmDialog
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        onConfirm={handleConfirmRemove}
        title="Quitar roles personalizados"
        message={`¿Quitar los roles personalizados de ${removeTarget?.employee_name ?? ''}? Usará el perfil por defecto de Frappe.`}
        confirmLabel="Quitar roles"
        variant="warning"
      />

      {/* Info */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Shield className="mt-0.5 h-5 w-5 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Roles personalizados vs. Roles de Frappe</p>
            <p className="mt-1">
              Los roles personalizados se aplican como capa adicional sobre los roles de Frappe (Administrator, HR Manager, etc.).
              Si un usuario no tiene roles personalizados asignados, se usará su perfil de Frappe por defecto.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
