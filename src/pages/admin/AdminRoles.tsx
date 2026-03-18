import { useState } from 'react';
import { Shield, Plus, Pencil, Trash2, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import Modal from '@/components/ui/Modal';
import { useModuleStore } from '@/store/moduleStore';
import { getEnabledModules, getAllPermissions } from '@/modules/registry';
import { toast } from '@/components/ui/Toast';
import type { CustomRole } from '@/modules/types';

export default function AdminRoles() {
  const { roles, addRole, updateRole, deleteRole, resetRoles } = useModuleStore();
  const [editingRole, setEditingRole] = useState<CustomRole | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);

  // Create/edit form state
  const [formName, setFormName] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formPerms, setFormPerms] = useState<Set<string>>(new Set());

  const enabledModules = getEnabledModules();
  const enabledModuleIds = new Set(enabledModules.map((m) => m.id));
  const permissionGroups = getAllPermissions().filter((g) => enabledModuleIds.has(g.moduleId));

  const openCreate = () => {
    setFormName('');
    setFormDesc('');
    setFormPerms(new Set());
    setShowCreateModal(true);
  };

  const openEdit = (role: CustomRole) => {
    setFormName(role.name);
    setFormDesc(role.description);
    setFormPerms(new Set(role.permissions));
    setEditingRole(role);
  };

  const handleSave = async () => {
    if (!formName.trim()) {
      toast.error('Error', 'El nombre del rol es requerido');
      return;
    }

    if (editingRole) {
      await updateRole(editingRole.id, {
        name: formName,
        description: formDesc,
        permissions: Array.from(formPerms),
      });
      setEditingRole(null);
      toast.success('Rol actualizado', `"${formName}" ha sido actualizado`);
    } else {
      await addRole({
        name: formName,
        description: formDesc,
        permissions: Array.from(formPerms),
      });
      setShowCreateModal(false);
      toast.success('Rol creado', `"${formName}" ha sido creado`);
    }
  };

  const handleDelete = async (id: string) => {
    const role = roles.find((r) => r.id === id);
    await deleteRole(id);
    setShowDeleteConfirm(null);
    toast.success('Rol eliminado', `"${role?.name}" ha sido eliminado`);
  };

  const togglePermission = (permId: string) => {
    const next = new Set(formPerms);
    if (next.has(permId)) next.delete(permId);
    else next.add(permId);
    setFormPerms(next);
  };

  const toggleModuleAll = (_moduleId: string, modulePerms: { id: string }[]) => {
    const permIds = modulePerms.map((p) => p.id);
    const allSelected = permIds.every((p) => formPerms.has(p));
    const next = new Set(formPerms);
    if (allSelected) {
      permIds.forEach((p) => next.delete(p));
    } else {
      permIds.forEach((p) => next.add(p));
    }
    setFormPerms(next);
  };

  const isModalOpen = showCreateModal || !!editingRole;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Roles y Permisos</h1>
          <p className="mt-1 text-gray-500">
            Gestiona roles y asigna permisos por módulo
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={async () => { await resetRoles(); toast.success('Roles restaurados'); }} className="btn-secondary">
            <RotateCcw className="h-4 w-4" />
            Restaurar
          </button>
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Rol
          </button>
        </div>
      </div>

      {/* Roles list */}
      <div className="space-y-3">
        {roles.map((role) => {
          const permCount = role.permissions.length;
          const moduleCount = new Set(role.permissions.map((p) => p.split('.')[0])).size;
          return (
            <div key={role.id} className="card p-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={clsx(
                    'rounded-lg p-2',
                    role.isSystem ? 'bg-amber-50 text-amber-600' : 'bg-blue-50 text-blue-600'
                  )}>
                    <Shield className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900">{role.name}</h3>
                      {role.isSystem && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">
                          Sistema
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{role.description}</p>
                    <div className="mt-1 flex gap-3 text-xs text-gray-400">
                      <span>{permCount} permisos</span>
                      <span>{moduleCount} módulos</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEdit(role)}
                    className="rounded p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                    title="Editar permisos"
                  >
                    <Pencil className="h-4 w-4" />
                  </button>
                  {!role.isSystem && (
                    <button
                      onClick={() => setShowDeleteConfirm(role.id)}
                      className="rounded p-2 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      title="Eliminar"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create/Edit Modal with Permission Matrix */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => { setShowCreateModal(false); setEditingRole(null); }}
        title={editingRole ? `Editar: ${editingRole.name}` : 'Nuevo Rol'}
        size="xl"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => { setShowCreateModal(false); setEditingRole(null); }} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleSave} className="btn-primary">
              {editingRole ? 'Guardar Cambios' : 'Crear Rol'}
            </button>
          </div>
        }
      >
        <div className="space-y-6">
          {/* Name & Description */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
              <input
                className="input"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Ej: Supervisor de Nómina"
                disabled={editingRole?.isSystem}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
              <input
                className="input"
                value={formDesc}
                onChange={(e) => setFormDesc(e.target.value)}
                placeholder="Breve descripción del rol"
              />
            </div>
          </div>

          {/* Permission Matrix */}
          <div>
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-gray-900">Matriz de Permisos</h4>
              <span className="text-xs text-gray-400">{formPerms.size} permisos seleccionados</span>
            </div>
            <div className="space-y-3">
              {permissionGroups.map((group) => {
                const allSelected = group.permissions.every((p) => formPerms.has(p.id));
                const someSelected = group.permissions.some((p) => formPerms.has(p.id));
                return (
                  <div key={group.moduleId} className="rounded-lg border border-gray-200 overflow-hidden">
                    {/* Module header */}
                    <div
                      className="flex cursor-pointer items-center justify-between bg-gray-50 px-4 py-2.5"
                      onClick={() => toggleModuleAll(group.moduleId, group.permissions)}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={allSelected}
                          ref={(el) => { if (el) el.indeterminate = someSelected && !allSelected; }}
                          onChange={() => toggleModuleAll(group.moduleId, group.permissions)}
                          className="h-4 w-4 rounded border-gray-300 text-primary-600"
                        />
                        <span className="text-sm font-medium text-gray-700">{group.moduleLabel}</span>
                      </div>
                      <span className="text-xs text-gray-400">
                        {group.permissions.filter((p) => formPerms.has(p.id)).length}/{group.permissions.length}
                      </span>
                    </div>
                    {/* Permission checkboxes */}
                    <div className="flex flex-wrap gap-x-4 gap-y-1 px-4 py-3">
                      {group.permissions.map((perm) => (
                        <label key={perm.id} className="flex items-center gap-2 py-1">
                          <input
                            type="checkbox"
                            checked={formPerms.has(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                            className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                          />
                          <span className="text-sm text-gray-600">{perm.label}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </Modal>

      {/* Delete confirmation */}
      <Modal
        isOpen={!!showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(null)}
        title="Eliminar rol"
        size="sm"
        footer={
          <div className="flex justify-end gap-2">
            <button onClick={() => setShowDeleteConfirm(null)} className="btn-secondary">Cancelar</button>
            <button
              onClick={() => showDeleteConfirm && handleDelete(showDeleteConfirm)}
              className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
            >
              Eliminar
            </button>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          ¿Estás seguro de eliminar este rol? Los usuarios que lo tengan asignado perderán los permisos asociados.
        </p>
      </Modal>
    </div>
  );
}
