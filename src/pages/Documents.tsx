import { useState, useRef } from 'react';
import {
  FileText, Plus, CheckCircle, XCircle, FolderOpen,
  Trash2, Edit, Printer, Eye,
} from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  useDocumentTemplates,
  useCreateDocumentTemplate,
  useUpdateDocumentTemplate,
  useDeleteDocumentTemplate,
  useEmployees,
} from '@/hooks/useFrappe';
import { useModuleStore } from '@/store/moduleStore';
import { toast } from '@/components/ui/Toast';
import type { DocumentTemplate, DocumentCategory, Employee } from '@/types/frappe';

// ---- Constants ----

const CATEGORIES: DocumentCategory[] = [
  'Contrato', 'Carta de Recomendacion', 'Constancia', 'Acta', 'Memorandum', 'Otro',
];

const CATEGORY_COLORS: Record<string, string> = {
  'Contrato': 'bg-blue-100 text-blue-700',
  'Carta de Recomendacion': 'bg-green-100 text-green-700',
  'Constancia': 'bg-purple-100 text-purple-700',
  'Acta': 'bg-orange-100 text-orange-700',
  'Memorandum': 'bg-cyan-100 text-cyan-700',
  'Otro': 'bg-gray-100 text-gray-700',
};

const PLACEHOLDERS: { label: string; tag: string; field?: string }[] = [
  { label: 'Nombre Empleado', tag: '{{nombre_empleado}}', field: 'employee_name' },
  { label: 'ID Empleado', tag: '{{id_empleado}}', field: 'name' },
  { label: 'Departamento', tag: '{{departamento}}', field: 'department' },
  { label: 'Puesto', tag: '{{puesto}}', field: 'designation' },
  { label: 'Empresa', tag: '{{empresa}}', field: 'company' },
  { label: 'Fecha Ingreso', tag: '{{fecha_ingreso}}', field: 'date_of_joining' },
  { label: 'Fecha Nacimiento', tag: '{{fecha_nacimiento}}', field: 'date_of_birth' },
  { label: 'Genero', tag: '{{genero}}', field: 'gender' },
  { label: 'Tipo Empleo', tag: '{{tipo_empleo}}', field: 'employment_type' },
  { label: 'Sucursal', tag: '{{sucursal}}', field: 'branch' },
  { label: 'Email Personal', tag: '{{email_personal}}', field: 'personal_email' },
  { label: 'Telefono', tag: '{{telefono}}', field: 'cell_phone' },
  { label: 'Fecha Actual', tag: '{{fecha_actual}}' },
  { label: 'Nombre Empresa', tag: '{{nombre_empresa}}' },
];

// ---- Empty form ----

interface TemplateForm {
  title: string;
  category: DocumentCategory;
  description: string;
  content: string;
}

const EMPTY_FORM: TemplateForm = {
  title: '',
  category: 'Contrato',
  description: '',
  content: '',
};

// ---- Helpers ----

function replaceAll(str: string, search: string, replacement: string): string {
  return str.split(search).join(replacement);
}

function replacePlaceholders(content: string, employee: Employee | null, companyName: string | null): string {
  let result = content;
  const today = new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });

  if (employee) {
    const map: Record<string, string> = {
      '{{nombre_empleado}}': employee.employee_name || '',
      '{{id_empleado}}': employee.name || '',
      '{{departamento}}': employee.department || '',
      '{{puesto}}': employee.designation || '',
      '{{empresa}}': employee.company || '',
      '{{fecha_ingreso}}': employee.date_of_joining || '',
      '{{fecha_nacimiento}}': employee.date_of_birth || '',
      '{{genero}}': employee.gender || '',
      '{{tipo_empleo}}': employee.employment_type || '',
      '{{sucursal}}': employee.branch || '',
      '{{email_personal}}': employee.personal_email || '',
      '{{telefono}}': employee.cell_phone || '',
    };
    for (const [placeholder, value] of Object.entries(map)) {
      result = replaceAll(result, placeholder, value);
    }
  }

  result = replaceAll(result, '{{fecha_actual}}', today);
  result = replaceAll(result, '{{nombre_empresa}}', companyName || '');
  return result;
}

function highlightPlaceholders(content: string): string {
  return content.replace(
    /\{\{[^}]+\}\}/g,
    (match) => `<span class="inline-block rounded bg-yellow-100 px-1 text-yellow-800 font-mono text-xs">${match}</span>`
  );
}

// ============================================
// COMPONENT
// ============================================

export default function Documents() {
  const { data: templates, isLoading, isError, refetch } = useDocumentTemplates();
  const createMutation = useCreateDocumentTemplate();
  const updateMutation = useUpdateDocumentTemplate();
  const deleteMutation = useDeleteDocumentTemplate();

  const branding = useModuleStore((s) => s.branding);

  // Editor modal
  const [showEditor, setShowEditor] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateForm>({ ...EMPTY_FORM });
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Generate modal
  const [showGenerate, setShowGenerate] = useState(false);
  const [generateTemplate, setGenerateTemplate] = useState<DocumentTemplate | null>(null);

  // ---- Stats ----
  const allTemplates = templates ?? [];
  const activeTemplates = allTemplates.filter((t) => t.status === 'Active');
  const inactiveTemplates = allTemplates.filter((t) => t.status === 'Inactive');
  const categoriesInUse = new Set(allTemplates.map((t) => t.category)).size;

  // ---- Open editor ----
  const openCreate = () => {
    setEditingName(null);
    setForm({ ...EMPTY_FORM });
    setShowEditor(true);
  };

  const openEdit = (t: DocumentTemplate) => {
    setEditingName(t.name);
    setForm({
      title: t.title,
      category: t.category,
      description: t.description || '',
      content: t.content,
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingName(null);
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Error', 'El titulo es requerido.');
      return;
    }
    if (!form.content.trim()) {
      toast.error('Error', 'El contenido de la plantilla es requerido.');
      return;
    }

    try {
      if (editingName) {
        await updateMutation.mutateAsync({
          name: editingName,
          data: {
            title: form.title,
            category: form.category,
            description: form.description,
            content: form.content,
          },
        });
        toast.success('Actualizada', 'La plantilla se actualizo correctamente.');
      } else {
        await createMutation.mutateAsync({
          title: form.title,
          category: form.category,
          description: form.description,
          content: form.content,
          status: 'Active',
        } as Partial<DocumentTemplate>);
        toast.success('Creada', 'La plantilla fue creada exitosamente.');
      }
      closeEditor();
    } catch (err) {
      console.error('[Documents] Error al guardar plantilla:', err);
      toast.fromError(err);
    }
  };

  // ---- Toggle status ----
  const handleToggleStatus = async (t: DocumentTemplate) => {
    const next = t.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateMutation.mutateAsync({ name: t.name, data: { status: next } });
      toast.success('Estado actualizado', `Plantilla ${next === 'Active' ? 'activada' : 'desactivada'}.`);
    } catch (err) {
      toast.fromError(err);
    }
  };

  // ---- Delete ----
  const handleDelete = async (name: string) => {
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Eliminada', 'La plantilla fue eliminada.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  // ---- Insert placeholder ----
  const insertPlaceholder = (tag: string) => {
    const ta = textareaRef.current;
    if (!ta) {
      setForm((prev) => ({ ...prev, content: prev.content + tag }));
      return;
    }
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const before = form.content.slice(0, start);
    const after = form.content.slice(end);
    const newContent = before + tag + after;
    setForm((prev) => ({ ...prev, content: newContent }));
    // Restore cursor after React re-render
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + tag.length;
      ta.focus();
    });
  };

  // ---- Open generate ----
  const openGenerate = (t: DocumentTemplate) => {
    setGenerateTemplate(t);
    setShowGenerate(true);
  };

  // ---- Table columns ----
  const columns: Column<DocumentTemplate>[] = [
    {
      key: 'title',
      header: 'Titulo',
      render: (t) => (
        <div>
          <p className="font-medium text-gray-900">{t.title}</p>
          {t.description && (
            <p className="text-xs text-gray-500 truncate max-w-xs">{t.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (t) => (
        <span
          className={clsx(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            CATEGORY_COLORS[t.category] || CATEGORY_COLORS['Otro']
          )}
        >
          {t.category}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (t) => (
        <button
          onClick={(e) => { e.stopPropagation(); handleToggleStatus(t); }}
          className={clsx(
            'cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition-colors hover:ring-2 hover:ring-offset-1',
            t.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
          )}
          title="Click para cambiar estado"
        >
          {t.status === 'Active' ? 'Activa' : 'Inactiva'}
        </button>
      ),
    },
    {
      key: 'actions' as keyof DocumentTemplate,
      header: 'Acciones',
      render: (t) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); openEdit(t); }}
            className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); openGenerate(t); }}
            className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600"
            title="Generar documento"
          >
            <Printer className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(t.name); }}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
            title="Eliminar"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="mt-1 text-gray-500">Plantillas de documentos HR con generacion automatica</p>
        </div>
        <RoleGuard section="documents" action="create">
          <button onClick={openCreate} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Plantilla
          </button>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Plantillas" value={allTemplates.length} icon={FileText} color="blue" />
        <StatsCard title="Activas" value={activeTemplates.length} icon={CheckCircle} color="green" />
        <StatsCard title="Inactivas" value={inactiveTemplates.length} icon={XCircle} color="red" />
        <StatsCard title="Categorias" value={categoriesInUse} icon={FolderOpen} color="purple" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={allTemplates}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay plantillas. Crea la primera desde el boton 'Nueva Plantilla'."
      />

      {/* ====== EDITOR MODAL ====== */}
      <Modal
        isOpen={showEditor}
        onClose={closeEditor}
        title={editingName ? 'Editar Plantilla' : 'Nueva Plantilla'}
        size="xl"
        footer={
          <>
            <button onClick={closeEditor} className="btn-secondary">Cancelar</button>
            <button
              onClick={handleSave}
              disabled={isSaving || !form.title.trim()}
              className="btn-primary"
            >
              {isSaving ? 'Guardando...' : editingName ? 'Guardar Cambios' : 'Crear Plantilla'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          {/* Title */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Titulo *</label>
            <input
              className="input"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="Ej: Contrato Individual de Trabajo"
            />
          </div>

          {/* Category + Description */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoria</label>
              <select
                className="input"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })}
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripcion</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripcion breve..."
              />
            </div>
          </div>

          {/* Placeholder buttons */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Placeholders disponibles</label>
            <div className="flex flex-wrap gap-1.5">
              {PLACEHOLDERS.map((p) => (
                <button
                  key={p.tag}
                  type="button"
                  onClick={() => insertPlaceholder(p.tag)}
                  className="rounded-md bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-700 ring-1 ring-inset ring-yellow-600/20 transition-colors hover:bg-yellow-100"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content textarea */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Contenido de la plantilla *</label>
            <textarea
              ref={textareaRef}
              className="input min-h-[250px] font-mono text-sm"
              value={form.content}
              onChange={(e) => setForm({ ...form, content: e.target.value })}
              placeholder="Escribe el contenido del documento aqui. Usa los botones de arriba para insertar placeholders como {{nombre_empleado}}..."
            />
          </div>

          {/* Preview */}
          {form.content.trim() && (
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
                <Eye className="h-4 w-4" />
                Vista previa
              </label>
              <div
                className="rounded-lg border border-gray-200 bg-gray-50 p-4 text-sm leading-relaxed whitespace-pre-wrap"
                dangerouslySetInnerHTML={{ __html: highlightPlaceholders(form.content) }}
              />
            </div>
          )}
        </div>
      </Modal>

      {/* ====== GENERATE MODAL ====== */}
      {generateTemplate && (
        <GenerateDocumentModal
          isOpen={showGenerate}
          onClose={() => { setShowGenerate(false); setGenerateTemplate(null); }}
          template={generateTemplate}
          companyName={branding.companyName}
          companyLogoUrl={branding.companyLogoUrl}
        />
      )}
    </div>
  );
}

// ============================================
// GENERATE DOCUMENT MODAL
// ============================================

function GenerateDocumentModal({
  isOpen,
  onClose,
  template,
  companyName,
  companyLogoUrl,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate;
  companyName: string | null;
  companyLogoUrl: string | null;
}) {
  const { data: employeesData, isLoading: loadingEmployees } = useEmployees({ status: 'Active' }, 500);
  const employees = employeesData ?? [];

  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const filtered = search.trim()
    ? employees.filter((e) =>
        e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        e.name.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const documentContent = replacePlaceholders(template.content, selectedEmployee, companyName);

  const handlePrint = () => {
    window.print();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generar: ${template.title}`}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
          {selectedEmployee && (
            <button onClick={handlePrint} className="btn-primary">
              <Printer className="h-4 w-4" />
              Imprimir
            </button>
          )}
        </>
      }
    >
      <div className="space-y-4">
        {/* Employee selector */}
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">Seleccionar Empleado</label>
          <input
            className="input"
            placeholder="Buscar por nombre o ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {!selectedEmployee && (
            <div className="mt-2 max-h-[200px] overflow-y-auto rounded-lg border border-gray-200">
              {loadingEmployees ? (
                <div className="p-4 text-center text-sm text-gray-500">Cargando empleados...</div>
              ) : filtered.length === 0 ? (
                <div className="p-4 text-center text-sm text-gray-500">No se encontraron empleados</div>
              ) : (
                filtered.slice(0, 50).map((emp) => (
                  <button
                    key={emp.name}
                    onClick={() => {
                      setSelectedEmployee(emp);
                      setSearch(emp.employee_name);
                    }}
                    className="flex w-full items-center gap-3 border-b border-gray-100 px-3 py-2 text-left transition-colors hover:bg-blue-50 last:border-0"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-100 text-xs font-semibold text-primary-700">
                      {emp.employee_name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{emp.employee_name}</p>
                      <p className="text-xs text-gray-500">{emp.name} &middot; {emp.department} &middot; {emp.designation}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
          {selectedEmployee && (
            <div className="mt-2 flex items-center gap-2">
              <span className="rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                {selectedEmployee.employee_name}
              </span>
              <button
                onClick={() => { setSelectedEmployee(null); setSearch(''); }}
                className="text-xs text-gray-500 hover:text-red-500"
              >
                Cambiar
              </button>
            </div>
          )}
        </div>

        {/* Document preview */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <Eye className="h-4 w-4" />
            Vista previa del documento
          </label>

          {/* Print area */}
          <div
            id="document-print-area"
            className="rounded-lg border border-gray-300 bg-white p-8 shadow-inner"
          >
            {/* Letterhead */}
            <div className="mb-6 flex items-center justify-between border-b border-gray-300 pb-4">
              <div className="flex items-center gap-3">
                {companyLogoUrl && (
                  <img src={companyLogoUrl} alt="Logo" className="h-12 w-12 object-contain" />
                )}
                <div>
                  <p className="text-lg font-bold text-gray-900">{companyName || 'Empresa'}</p>
                </div>
              </div>
              <p className="text-sm text-gray-500">
                {new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>

            {/* Title */}
            <h2 className="mb-6 text-center text-xl font-bold text-gray-900 uppercase">
              {template.title}
            </h2>

            {/* Body */}
            <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-800 text-justify">
              {selectedEmployee ? (
                documentContent
              ) : (
                <span
                  dangerouslySetInnerHTML={{ __html: highlightPlaceholders(template.content) }}
                />
              )}
            </div>

            {/* Signature lines */}
            <div className="mt-16 grid grid-cols-2 gap-12">
              <div className="text-center">
                <div className="mb-2 border-t border-gray-400" />
                <p className="text-sm font-medium text-gray-700">Firma del Empleado</p>
                {selectedEmployee && (
                  <p className="text-xs text-gray-500">{selectedEmployee.employee_name}</p>
                )}
              </div>
              <div className="text-center">
                <div className="mb-2 border-t border-gray-400" />
                <p className="text-sm font-medium text-gray-700">Firma del Representante</p>
                <p className="text-xs text-gray-500">{companyName || 'Empresa'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}
