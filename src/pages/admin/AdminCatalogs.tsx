import { useState, useEffect, useCallback } from 'react';
import { Plus, Search, Pencil, Trash2, Database, Crown, ArrowRight } from 'lucide-react';
import Modal from '@/components/ui/Modal';
import ErrorState from '@/components/ui/ErrorState';
import ComboSelect from '@/components/ui/ComboSelect';
import { toast } from '@/components/ui/Toast';
import {
  useDepartments,
  useDesignations,
  useCompanies,
  useBranches,
  useEmploymentTypes,
  useCreateDepartment,
  useUpdateDepartment,
  useDeleteDepartment,
  useCreateDesignation,
  useUpdateDesignation,
  useDeleteDesignation,
  useCreateCompany,
  useUpdateCompany,
  useDeleteCompany,
  useCreateBranch,
  useUpdateBranch,
  useDeleteBranch,
  useCreateEmploymentType,
  useUpdateEmploymentType,
  useDeleteEmploymentType,
} from '@/hooks/useFrappe';
import { platformConfigService, DESIGNATION_LEVELS } from '@/api/services';
import type { DesignationHierarchyConfig, DesignationLevelInfo } from '@/api/services';
import type { Department, Designation, Company, Branch, EmploymentType } from '@/types/frappe';

type TabId = 'departments' | 'designations' | 'companies' | 'branches' | 'employment-types';

const TABS: { id: TabId; label: string }[] = [
  { id: 'departments', label: 'Departamentos' },
  { id: 'designations', label: 'Puestos' },
  { id: 'companies', label: 'Empresas' },
  { id: 'branches', label: 'Sucursales' },
  { id: 'employment-types', label: 'Tipos de Empleo' },
];

export default function AdminCatalogs() {
  const [activeTab, setActiveTab] = useState<TabId>('departments');
  const [search, setSearch] = useState('');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Catálogos</h1>
        <p className="mt-1 text-gray-500">Gestión de catálogos del sistema</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto">
        <nav className="flex gap-4 min-w-max" role="tablist">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              role="tab"
              aria-selected={activeTab === tab.id}
              onClick={() => { setActiveTab(tab.id); setSearch(''); }}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Buscar..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="input pl-10"
        />
      </div>

      {/* Tab content */}
      {activeTab === 'departments' && <DepartmentsTab search={search} />}
      {activeTab === 'designations' && <DesignationsTab search={search} />}
      {activeTab === 'companies' && <CompaniesTab search={search} />}
      {activeTab === 'branches' && <BranchesTab search={search} />}
      {activeTab === 'employment-types' && <EmploymentTypesTab search={search} />}
    </div>
  );
}

// ============================================
// DEPARTMENTS TAB
// ============================================
function DepartmentsTab({ search }: { search: string }) {
  const { data, isLoading, isError, refetch } = useDepartments();
  const { data: companies } = useCompanies();
  const createMut = useCreateDepartment();
  const updateMut = useUpdateDepartment();
  const deleteMut = useDeleteDepartment();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Department | null>(null);
  const [form, setForm] = useState({ department_name: '', company: '' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const companyOptions = (companies ?? []).map((c) => ({ value: c.name, label: c.company_name || c.name }));
  const filtered = (data ?? []).filter((d) =>
    (d.department_name || d.name).toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => {
    setEditing(null);
    setForm({ department_name: '', company: '' });
    setShowModal(true);
  };
  const openEdit = (d: Department) => {
    setEditing(d);
    setForm({ department_name: d.department_name || d.name, company: d.company || '' });
    setShowModal(true);
  };
  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ name: editing.name, data: form });
        toast.success('Actualizado', 'Departamento actualizado correctamente');
      } else {
        await createMut.mutateAsync(form as Partial<Department>);
        toast.success('Creado', 'Departamento creado correctamente');
      }
      setShowModal(false);
    } catch { /* handled by hook */ }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMut.mutateAsync(deleteTarget);
      toast.success('Eliminado', 'Departamento eliminado');
      setDeleteTarget(null);
    } catch { /* handled by hook */ }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} departamento{filtered.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo</button>
      </div>
      <CatalogTable
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        headers={['Nombre', 'Empresa']}
        rows={filtered.map((d) => ({
          key: d.name,
          cells: [d.department_name || d.name, d.company || '—'],
          onEdit: () => openEdit(d),
          onDelete: () => setDeleteTarget(d.name),
        }))}
        emptyMessage="No hay departamentos registrados"
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Departamento' : 'Nuevo Departamento'} footer={
        <><button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="btn-primary">
          {(createMut.isPending || updateMut.isPending) ? 'Guardando...' : 'Guardar'}
        </button></>
      }>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
            <input className="input" value={form.department_name} onChange={(e) => setForm({ ...form, department_name: e.target.value })} />
          </div>
          <ComboSelect label="Empresa" options={companyOptions} value={form.company} onChange={(v) => setForm({ ...form, company: v })} placeholder="Seleccionar empresa" />
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isPending={deleteMut.isPending} itemLabel="departamento" />
    </>
  );
}

// ============================================
// DESIGNATIONS TAB (with hierarchy)
// ============================================
function DesignationsTab({ search }: { search: string }) {
  const { data, isLoading, isError, refetch } = useDesignations();
  const createMut = useCreateDesignation();
  const updateMut = useUpdateDesignation();
  const deleteMut = useDeleteDesignation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Designation | null>(null);
  const [form, setForm] = useState({ designation: '' });
  const [hierarchyForm, setHierarchyForm] = useState<DesignationLevelInfo>({ level: 5, isExecutive: false });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [hierarchy, setHierarchy] = useState<DesignationHierarchyConfig>({});
  const [hierarchyLoaded, setHierarchyLoaded] = useState(false);

  // Load hierarchy config from backend
  const loadHierarchy = useCallback(async () => {
    try {
      const config = await platformConfigService.loadDesignationHierarchy({});
      setHierarchy(config);
    } catch { /* use empty */ }
    setHierarchyLoaded(true);
  }, []);

  useEffect(() => { loadHierarchy(); }, [loadHierarchy]);

  const saveHierarchy = async (updated: DesignationHierarchyConfig) => {
    setHierarchy(updated);
    try {
      await platformConfigService.saveDesignationHierarchy(updated);
    } catch {
      toast.error('Error', 'No se pudo guardar la jerarquía');
    }
  };

  const designationNames = (data ?? []).map((d) => d.designation || d.name);
  const designationOptions = designationNames.map((n) => ({ value: n, label: n }));

  const filtered = (data ?? []).filter((d) =>
    (d.designation || d.name).toLowerCase().includes(search.toLowerCase())
  );

  // Sort by level (lower = higher rank)
  const sorted = [...filtered].sort((a, b) => {
    const nameA = a.designation || a.name;
    const nameB = b.designation || b.name;
    const levelA = hierarchy[nameA]?.level ?? 99;
    const levelB = hierarchy[nameB]?.level ?? 99;
    return levelA - levelB;
  });

  const openCreate = () => {
    setEditing(null);
    setForm({ designation: '' });
    setHierarchyForm({ level: 5, isExecutive: false });
    setShowModal(true);
  };
  const openEdit = (d: Designation) => {
    const name = d.designation || d.name;
    setEditing(d);
    setForm({ designation: name });
    setHierarchyForm(hierarchy[name] ?? { level: 5, isExecutive: false });
    setShowModal(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ name: editing.name, data: form });
        // Save hierarchy for this designation
        const updated = { ...hierarchy };
        // If name changed, remove old entry
        const oldName = editing.designation || editing.name;
        if (oldName !== form.designation) delete updated[oldName];
        updated[form.designation] = hierarchyForm;
        await saveHierarchy(updated);
        toast.success('Actualizado', 'Puesto actualizado correctamente');
      } else {
        await createMut.mutateAsync(form as Partial<Designation>);
        const updated = { ...hierarchy, [form.designation]: hierarchyForm };
        await saveHierarchy(updated);
        toast.success('Creado', 'Puesto creado correctamente');
      }
      setShowModal(false);
    } catch { /* handled by hook */ }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      const desig = (data ?? []).find((d) => d.name === deleteTarget);
      await deleteMut.mutateAsync(deleteTarget);
      // Remove from hierarchy
      if (desig) {
        const name = desig.designation || desig.name;
        const updated = { ...hierarchy };
        delete updated[name];
        await saveHierarchy(updated);
      }
      toast.success('Eliminado', 'Puesto eliminado');
      setDeleteTarget(null);
    } catch { /* handled by hook */ }
  };

  const getLevelBadge = (name: string) => {
    const info = hierarchy[name];
    if (!info) return null;
    const levelDef = DESIGNATION_LEVELS.find((l) => l.value === info.level);
    if (!levelDef) return null;
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${levelDef.color}`}>
        {info.isExecutive && <Crown className="h-3 w-3" />}
        {levelDef.label}
      </span>
    );
  };

  if (!hierarchyLoaded) return null;

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} puesto{filtered.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo</button>
      </div>

      {/* Hierarchy legend */}
      <div className="flex flex-wrap gap-2 rounded-lg border border-gray-200 bg-gray-50 p-3">
        <span className="text-xs font-medium text-gray-500 self-center">Niveles:</span>
        {DESIGNATION_LEVELS.map((l) => (
          <span key={l.value} className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${l.color}`}>
            {l.value}. {l.label}
          </span>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} compact />
      ) : sorted.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12">
          <Database className="h-10 w-10 text-gray-300" />
          <p className="mt-3 text-sm text-gray-500">No hay puestos registrados</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-gray-200">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Puesto</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Nivel</th>
                <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">Reporta a</th>
                <th className="w-24 px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((d) => {
                const name = d.designation || d.name;
                const info = hierarchy[name];
                return (
                  <tr key={d.name} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {info?.isExecutive && <Crown className="h-4 w-4 text-amber-500" />}
                        <span className="font-medium text-gray-700">{name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">{getLevelBadge(name) || <span className="text-xs text-gray-400">Sin nivel</span>}</td>
                    <td className="px-4 py-3">
                      {info?.parentDesignation ? (
                        <span className="inline-flex items-center gap-1 text-xs text-gray-600">
                          <ArrowRight className="h-3 w-3 text-gray-400" />
                          {info.parentDesignation}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => openEdit(d)} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Editar">
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button onClick={() => setDeleteTarget(d.name)} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Puesto' : 'Nuevo Puesto'} footer={
        <><button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="btn-primary">
          {(createMut.isPending || updateMut.isPending) ? 'Guardando...' : 'Guardar'}
        </button></>
      }>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del Puesto *</label>
            <input className="input" value={form.designation} onChange={(e) => setForm({ designation: e.target.value })} />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nivel Jerárquico</label>
            <select
              className="input"
              value={hierarchyForm.level}
              onChange={(e) => setHierarchyForm({ ...hierarchyForm, level: Number(e.target.value), isExecutive: Number(e.target.value) <= 2 })}
            >
              {DESIGNATION_LEVELS.map((l) => (
                <option key={l.value} value={l.value}>{l.value}. {l.label}</option>
              ))}
            </select>
          </div>

          <ComboSelect
            label="Reporta a (puesto superior)"
            options={designationOptions.filter((o) => o.value !== form.designation)}
            value={hierarchyForm.parentDesignation || ''}
            onChange={(v) => setHierarchyForm({ ...hierarchyForm, parentDesignation: v || undefined })}
            placeholder="Ninguno (puesto de nivel más alto)"
          />

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={hierarchyForm.isExecutive}
              onChange={(e) => setHierarchyForm({ ...hierarchyForm, isExecutive: e.target.checked })}
              className="h-4 w-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Es puesto ejecutivo</span>
            <span className="text-xs text-gray-400">(no requiere &quot;Reporta a&quot; en empleados)</span>
          </label>
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isPending={deleteMut.isPending} itemLabel="puesto" />
    </>
  );
}

// ============================================
// COMPANIES TAB
// ============================================
function CompaniesTab({ search }: { search: string }) {
  const { data, isLoading, isError, refetch } = useCompanies();
  const createMut = useCreateCompany();
  const updateMut = useUpdateCompany();
  const deleteMut = useDeleteCompany();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Company | null>(null);
  const [form, setForm] = useState({ company_name: '', abbr: '', default_currency: 'MXN', country: 'Mexico' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = (data ?? []).filter((c) =>
    (c.company_name || c.name).toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ company_name: '', abbr: '', default_currency: 'MXN', country: 'Mexico' }); setShowModal(true); };
  const openEdit = (c: Company) => { setEditing(c); setForm({ company_name: c.company_name || c.name, abbr: c.abbr || '', default_currency: c.default_currency || 'MXN', country: c.country || 'Mexico' }); setShowModal(true); };
  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ name: editing.name, data: form });
        toast.success('Actualizado', 'Empresa actualizada correctamente');
      } else {
        await createMut.mutateAsync(form as Partial<Company>);
        toast.success('Creado', 'Empresa creada correctamente');
      }
      setShowModal(false);
    } catch { /* handled by hook */ }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteMut.mutateAsync(deleteTarget); toast.success('Eliminado', 'Empresa eliminada'); setDeleteTarget(null); } catch { /* handled by hook */ }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} empresa{filtered.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo</button>
      </div>
      <CatalogTable isLoading={isLoading} isError={isError} onRetry={refetch} headers={['Empresa', 'Abreviatura']}
        rows={filtered.map((c) => ({ key: c.name, cells: [c.company_name || c.name, c.abbr || '—'], onEdit: () => openEdit(c), onDelete: () => setDeleteTarget(c.name) }))}
        emptyMessage="No hay empresas registradas"
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Empresa' : 'Nueva Empresa'} footer={
        <><button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="btn-primary">
          {(createMut.isPending || updateMut.isPending) ? 'Guardando...' : 'Guardar'}
        </button></>
      }>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
            <input className="input" value={form.company_name} onChange={(e) => setForm({ ...form, company_name: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Abreviatura *</label>
            <input className="input" value={form.abbr} onChange={(e) => setForm({ ...form, abbr: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Moneda</label>
            <input className="input" value={form.default_currency} onChange={(e) => setForm({ ...form, default_currency: e.target.value })} />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">País</label>
            <input className="input" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
          </div>
        </div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isPending={deleteMut.isPending} itemLabel="empresa" />
    </>
  );
}

// ============================================
// BRANCHES TAB
// ============================================
function BranchesTab({ search }: { search: string }) {
  const { data, isLoading, isError, refetch } = useBranches();
  const createMut = useCreateBranch();
  const updateMut = useUpdateBranch();
  const deleteMut = useDeleteBranch();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Branch | null>(null);
  const [form, setForm] = useState({ branch: '' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = (data ?? []).filter((b) =>
    (b.branch || b.name).toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ branch: '' }); setShowModal(true); };
  const openEdit = (b: Branch) => { setEditing(b); setForm({ branch: b.branch || b.name }); setShowModal(true); };
  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ name: editing.name, data: form });
        toast.success('Actualizado', 'Sucursal actualizada correctamente');
      } else {
        await createMut.mutateAsync(form as Partial<Branch>);
        toast.success('Creado', 'Sucursal creada correctamente');
      }
      setShowModal(false);
    } catch { /* handled by hook */ }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteMut.mutateAsync(deleteTarget); toast.success('Eliminado', 'Sucursal eliminada'); setDeleteTarget(null); } catch { /* handled by hook */ }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} sucursal{filtered.length !== 1 ? 'es' : ''}</p>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo</button>
      </div>
      <CatalogTable isLoading={isLoading} isError={isError} onRetry={refetch} headers={['Sucursal']}
        rows={filtered.map((b) => ({ key: b.name, cells: [b.branch || b.name], onEdit: () => openEdit(b), onDelete: () => setDeleteTarget(b.name) }))}
        emptyMessage="No hay sucursales registradas"
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Sucursal' : 'Nueva Sucursal'} footer={
        <><button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="btn-primary">
          {(createMut.isPending || updateMut.isPending) ? 'Guardando...' : 'Guardar'}
        </button></>
      }>
        <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre de la Sucursal *</label>
        <input className="input" value={form.branch} onChange={(e) => setForm({ branch: e.target.value })} /></div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isPending={deleteMut.isPending} itemLabel="sucursal" />
    </>
  );
}

// ============================================
// EMPLOYMENT TYPES TAB
// ============================================
function EmploymentTypesTab({ search }: { search: string }) {
  const { data, isLoading, isError, refetch } = useEmploymentTypes();
  const createMut = useCreateEmploymentType();
  const updateMut = useUpdateEmploymentType();
  const deleteMut = useDeleteEmploymentType();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<EmploymentType | null>(null);
  const [form, setForm] = useState({ name: '' });
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  const filtered = (data ?? []).filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );

  const openCreate = () => { setEditing(null); setForm({ name: '' }); setShowModal(true); };
  const openEdit = (t: EmploymentType) => { setEditing(t); setForm({ name: t.name }); setShowModal(true); };
  const handleSave = async () => {
    try {
      if (editing) {
        await updateMut.mutateAsync({ name: editing.name, data: form });
        toast.success('Actualizado', 'Tipo de empleo actualizado');
      } else {
        await createMut.mutateAsync(form as Partial<EmploymentType>);
        toast.success('Creado', 'Tipo de empleo creado');
      }
      setShowModal(false);
    } catch { /* handled by hook */ }
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    try { await deleteMut.mutateAsync(deleteTarget); toast.success('Eliminado', 'Tipo de empleo eliminado'); setDeleteTarget(null); } catch { /* handled by hook */ }
  };

  return (
    <>
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{filtered.length} tipo{filtered.length !== 1 ? 's' : ''}</p>
        <button onClick={openCreate} className="btn-primary"><Plus className="h-4 w-4" /> Nuevo</button>
      </div>
      <CatalogTable isLoading={isLoading} isError={isError} onRetry={refetch} headers={['Tipo de Empleo']}
        rows={filtered.map((t) => ({ key: t.name, cells: [t.name], onEdit: () => openEdit(t), onDelete: () => setDeleteTarget(t.name) }))}
        emptyMessage="No hay tipos de empleo registrados"
      />
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editing ? 'Editar Tipo de Empleo' : 'Nuevo Tipo de Empleo'} footer={
        <><button onClick={() => setShowModal(false)} className="btn-secondary">Cancelar</button>
        <button onClick={handleSave} disabled={createMut.isPending || updateMut.isPending} className="btn-primary">
          {(createMut.isPending || updateMut.isPending) ? 'Guardando...' : 'Guardar'}
        </button></>
      }>
        <div><label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre *</label>
        <input className="input" value={form.name} onChange={(e) => setForm({ name: e.target.value })} /></div>
      </Modal>
      <ConfirmDeleteModal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} onConfirm={handleDelete} isPending={deleteMut.isPending} itemLabel="tipo de empleo" />
    </>
  );
}

// ============================================
// SHARED COMPONENTS
// ============================================

interface CatalogRow {
  key: string;
  cells: string[];
  onEdit: () => void;
  onDelete: () => void;
}

function CatalogTable({
  isLoading,
  isError,
  onRetry,
  headers,
  rows,
  emptyMessage,
}: {
  isLoading: boolean;
  isError?: boolean;
  onRetry?: () => void;
  headers: string[];
  rows: CatalogRow[];
  emptyMessage: string;
}) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={onRetry} compact />;
  }

  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-300 py-12">
        <Database className="h-10 w-10 text-gray-300" />
        <p className="mt-3 text-sm text-gray-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {headers.map((h) => (
              <th key={h} className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">{h}</th>
            ))}
            <th className="w-24 px-4 py-3 text-right text-xs font-semibold uppercase text-gray-500">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.key} className="hover:bg-gray-50">
              {row.cells.map((cell, i) => (
                <td key={i} className="px-4 py-3 text-gray-700">{cell}</td>
              ))}
              <td className="px-4 py-3 text-right">
                <div className="flex items-center justify-end gap-1">
                  <button onClick={row.onEdit} className="rounded p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600" title="Editar">
                    <Pencil className="h-4 w-4" />
                  </button>
                  <button onClick={row.onDelete} className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600" title="Eliminar">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ConfirmDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
  itemLabel,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
  itemLabel: string;
}) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Confirmar eliminación"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cancelar</button>
          <button onClick={onConfirm} disabled={isPending} className="btn-primary bg-red-600 hover:bg-red-700">
            {isPending ? 'Eliminando...' : 'Eliminar'}
          </button>
        </>
      }
    >
      <p className="text-sm text-gray-600">
        ¿Estás seguro de eliminar este {itemLabel}? Si hay registros que lo
        referencian, Frappe rechazará la operación.
      </p>
    </Modal>
  );
}
