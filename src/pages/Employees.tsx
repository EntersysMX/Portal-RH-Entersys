import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Download, User, Upload, MoreVertical, Power, PowerOff, Ban, Trash2 } from 'lucide-react';
import DataTable, { Column } from '@/components/ui/DataTable';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import BulkUploadModal from '@/components/employees/BulkUploadModal';
import RoleGuard from '@/components/auth/RoleGuard';
import ComboSelect from '@/components/ui/ComboSelect';
import { useEmployees, useCreateEmployee, useUpdateEmployeeStatus, useDeleteEmployee, useDepartments, useDesignations, useCompanies } from '@/hooks/useFrappe';
import { usePermissions } from '@/hooks/usePermissions';
import { catalogService } from '@/api/services';
import { toast } from '@/components/ui/Toast';
import type { Employee } from '@/types/frappe';

export default function Employees() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [showNewModal, setShowNewModal] = useState(false);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [actionMenuOpen, setActionMenuOpen] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const { isAdmin } = usePermissions();
  const statusMutation = useUpdateEmployeeStatus();
  const deleteMutation = useDeleteEmployee();
  const [newEmployee, setNewEmployee] = useState({
    first_name: '',
    last_name: '',
    gender: '',
    date_of_birth: '',
    date_of_joining: '',
    department: '',
    designation: '',
    company: '',
  });

  const filters: Record<string, unknown> = {};
  if (statusFilter) filters.status = statusFilter;
  if (deptFilter) filters.department = deptFilter;
  if (search) filters.employee_name = ['like', `%${search}%`];

  const { data: employees, isLoading, isError, refetch } = useEmployees(
    Object.keys(filters).length ? filters : undefined,
    20,
    (page - 1) * 20
  );
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const { data: companies } = useCompanies();
  const createMutation = useCreateEmployee();

  const departmentOptions = (departments ?? []).map((d) => ({
    value: d.name,
    label: d.department_name || d.name,
  }));
  const designationOptions = (designations ?? []).map((d) => ({
    value: d.name,
    label: d.designation || d.name,
  }));
  const companyOptions = (companies ?? []).map((c) => ({
    value: c.name,
    label: c.company_name || c.name,
  }));

  const columns: Column<Employee>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (emp) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            {emp.image ? (
              <img src={emp.image} alt="" className="h-9 w-9 rounded-full object-cover" />
            ) : (
              <User className="h-4 w-4" />
            )}
          </div>
          <div>
            <p className="font-medium text-gray-900">{emp.employee_name}</p>
            <p className="text-xs text-gray-400">{emp.name}</p>
          </div>
        </div>
      ),
    },
    { key: 'department', header: 'Departamento' },
    { key: 'designation', header: 'Puesto' },
    { key: 'company_email', header: 'Email', render: (emp) => <span className="text-sm text-gray-500">{emp.company_email || emp.personal_email || '—'}</span> },
    { key: 'cell_phone', header: 'Teléfono', render: (emp) => <span className="text-sm text-gray-500">{emp.cell_phone || '—'}</span> },
    {
      key: 'status',
      header: 'Estado',
      render: (emp) => <StatusBadge status={emp.status} />,
    },
    { key: 'date_of_joining', header: 'Fecha Ingreso' },
    { key: 'employment_type', header: 'Tipo Contrato' },
    ...(isAdmin
      ? [
          {
            key: 'actions' as keyof Employee,
            header: 'Acciones',
            render: (emp: Employee) => (
              <div className="relative" onClick={(e) => e.stopPropagation()}>
                <button
                  onClick={() => setActionMenuOpen(actionMenuOpen === emp.name ? null : emp.name)}
                  className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {actionMenuOpen === emp.name && (
                  <div className="absolute right-0 z-50 mt-1 w-44 rounded-lg border border-gray-200 bg-white py-1 shadow-lg">
                    {emp.status !== 'Active' && (
                      <button
                        onClick={async () => {
                          setActionMenuOpen(null);
                          await statusMutation.mutateAsync({ name: emp.name, status: 'Active' });
                          toast.success('Activado', `${emp.employee_name} está activo`);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-green-700 hover:bg-green-50"
                      >
                        <Power className="h-4 w-4" /> Activar
                      </button>
                    )}
                    {emp.status !== 'Inactive' && (
                      <button
                        onClick={async () => {
                          setActionMenuOpen(null);
                          await statusMutation.mutateAsync({ name: emp.name, status: 'Inactive' });
                          toast.success('Desactivado', `${emp.employee_name} está inactivo`);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-yellow-700 hover:bg-yellow-50"
                      >
                        <PowerOff className="h-4 w-4" /> Desactivar
                      </button>
                    )}
                    {emp.status !== 'Suspended' && (
                      <button
                        onClick={async () => {
                          setActionMenuOpen(null);
                          await statusMutation.mutateAsync({ name: emp.name, status: 'Suspended' });
                          toast.success('Suspendido', `${emp.employee_name} está suspendido`);
                        }}
                        className="flex w-full items-center gap-2 px-3 py-2 text-sm text-orange-700 hover:bg-orange-50"
                      >
                        <Ban className="h-4 w-4" /> Suspender
                      </button>
                    )}
                    <div className="my-1 border-t border-gray-100" />
                    <button
                      onClick={() => { setActionMenuOpen(null); setDeleteTarget(emp.name); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            ),
          },
        ]
      : []),
  ];

  const handleCreate = async () => {
    try {
      // Pre-create catalog entries that don't exist
      const promises: Promise<void>[] = [];

      if (newEmployee.company && !companyOptions.some((o) => o.value === newEmployee.company)) {
        promises.push(
          catalogService.ensureExists('Company', {
            company_name: newEmployee.company,
            abbr: newEmployee.company.substring(0, 5).toUpperCase(),
            default_currency: 'MXN',
            country: 'Mexico',
          })
        );
      }
      if (newEmployee.designation && !designationOptions.some((o) => o.value === newEmployee.designation)) {
        promises.push(
          catalogService.ensureExists('Designation', { designation: newEmployee.designation })
        );
      }
      if (newEmployee.department && !departmentOptions.some((o) => o.value === newEmployee.department)) {
        promises.push(
          catalogService.ensureExists('Department', {
            department_name: newEmployee.department,
            company: newEmployee.company || undefined,
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      await createMutation.mutateAsync(newEmployee);
      toast.success('Empleado creado', 'El empleado se registró correctamente.');
      setShowNewModal(false);
      setNewEmployee({
        first_name: '',
        last_name: '',
        gender: '',
        date_of_birth: '',
        date_of_joining: '',
        department: '',
        designation: '',
        company: '',
      });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empleados</h1>
          <p className="mt-1 text-gray-500">Gestión del directorio de empleados</p>
        </div>
        <div className="flex flex-wrap gap-2 sm:gap-3">
          <RoleGuard section="employees" action="create">
            <button onClick={() => setShowBulkUpload(true)} className="btn-secondary">
              <Upload className="h-4 w-4" />
              <span className="hidden sm:inline">Carga Masiva</span>
              <span className="sm:hidden">Masiva</span>
            </button>
          </RoleGuard>
          <RoleGuard section="employees" action="export">
            <button className="btn-secondary">
              <Download className="h-4 w-4" />
              Exportar
            </button>
          </RoleGuard>
          <RoleGuard section="employees" action="create">
            <button onClick={() => setShowNewModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              <span className="hidden sm:inline">Nuevo Empleado</span>
              <span className="sm:hidden">Nuevo</span>
            </button>
          </RoleGuard>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Buscar empleados..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="input pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="input w-auto"
        >
          <option value="">Todos los estados</option>
          <option value="Active">Activo</option>
          <option value="Inactive">Inactivo</option>
          <option value="Left">Baja</option>
          <option value="Suspended">Suspendido</option>
        </select>
        <select
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setPage(1);
          }}
          className="input w-auto"
        >
          <option value="">Todos los departamentos</option>
          {departments?.map((d) => (
            <option key={d.name} value={d.name}>
              {d.department_name || d.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={employees ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(emp) => navigate(`/employees/${emp.name}`)}
        page={page}
        pageSize={20}
        total={employees?.length ?? 0}
        onPageChange={setPage}
        emptyMessage="No se encontraron empleados. Agrega tu primer empleado desde el botón 'Nuevo Empleado'."
      />

      {/* New Employee Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Empleado"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Creando...' : 'Crear Empleado'}
            </button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre</label>
            <input
              className="input"
              value={newEmployee.first_name}
              onChange={(e) => setNewEmployee({ ...newEmployee, first_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Apellido</label>
            <input
              className="input"
              value={newEmployee.last_name}
              onChange={(e) => setNewEmployee({ ...newEmployee, last_name: e.target.value })}
              required
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Género</label>
            <select
              className="input"
              value={newEmployee.gender}
              onChange={(e) => setNewEmployee({ ...newEmployee, gender: e.target.value })}
            >
              <option value="">Seleccionar</option>
              <option value="Masculino">Masculino</option>
              <option value="Femenino">Femenino</option>
              <option value="Otro">Otro</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Fecha de nacimiento
            </label>
            <input
              type="date"
              className="input"
              value={newEmployee.date_of_birth}
              onChange={(e) => setNewEmployee({ ...newEmployee, date_of_birth: e.target.value })}
            />
          </div>
          <div>
            <ComboSelect
              label="Departamento"
              options={departmentOptions}
              value={newEmployee.department}
              onChange={(val) => setNewEmployee({ ...newEmployee, department: val })}
              placeholder="Seleccionar o crear departamento"
            />
          </div>
          <div>
            <ComboSelect
              label="Puesto"
              options={designationOptions}
              value={newEmployee.designation}
              onChange={(val) => setNewEmployee({ ...newEmployee, designation: val })}
              placeholder="Seleccionar o crear puesto"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Fecha de ingreso
            </label>
            <input
              type="date"
              className="input"
              value={newEmployee.date_of_joining}
              onChange={(e) => setNewEmployee({ ...newEmployee, date_of_joining: e.target.value })}
            />
          </div>
          <div>
            <ComboSelect
              label="Empresa"
              options={companyOptions}
              value={newEmployee.company}
              onChange={(val) => setNewEmployee({ ...newEmployee, company: val })}
              placeholder="Seleccionar o crear empresa"
            />
          </div>
        </div>
      </Modal>

      {/* Bulk Upload Modal */}
      <BulkUploadModal
        isOpen={showBulkUpload}
        onClose={() => setShowBulkUpload(false)}
        onComplete={() => queryClient.invalidateQueries({ queryKey: ['employees'] })}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Eliminar empleado"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="btn-secondary">Cancelar</button>
            <button
              onClick={async () => {
                if (!deleteTarget) return;
                try {
                  await deleteMutation.mutateAsync(deleteTarget);
                  toast.success('Eliminado', 'Empleado eliminado correctamente');
                  setDeleteTarget(null);
                } catch { /* handled by hook */ }
              }}
              disabled={deleteMutation.isPending}
              className="btn-primary bg-red-600 hover:bg-red-700"
            >
              {deleteMutation.isPending ? 'Eliminando...' : 'Eliminar'}
            </button>
          </>
        }
      >
        <p className="text-sm text-gray-600">
          ¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.
        </p>
      </Modal>
    </div>
  );
}
