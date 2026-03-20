import { useState, useRef } from 'react';
import {
  FileText, Plus, CheckCircle, XCircle, FolderOpen,
  Trash2, Edit, Eye, Upload, File, Download, Printer, User, Search,
  FileType,
} from 'lucide-react';
import { clsx } from 'clsx';
import { PDFDocument } from 'pdf-lib';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { saveAs } from 'file-saver';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import RoleGuard from '@/components/auth/RoleGuard';
import {
  useDocumentTemplates,
  useCreateDocumentTemplate,
  useUpdateDocumentTemplate,
  useDeleteDocumentTemplate,
  useEmployees,
} from '@/hooks/useFrappe';
import { frappeUploadFile } from '@/api/client';
import { toast } from '@/components/ui/Toast';
import type { DocumentTemplate, DocumentCategory, DocumentFileType, Employee } from '@/types/frappe';

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

const ACCEPTED_FILE_TYPES = '.pdf,.docx,.doc,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document';

/**
 * Mapeo de placeholders a datos del empleado.
 * Para PDF: nombres de campos AcroForm.
 * Para Word: placeholders {{nombre_empleado}} en el texto del documento.
 */
const FIELD_MAP: { field: string; label: string; getValue: (e: Employee) => string }[] = [
  { field: 'nombre_empleado',  label: 'Nombre completo',   getValue: (e) => e.employee_name || '' },
  { field: 'id_empleado',      label: 'ID Empleado',        getValue: (e) => e.name || '' },
  { field: 'departamento',     label: 'Departamento',       getValue: (e) => e.department || '' },
  { field: 'puesto',           label: 'Puesto',             getValue: (e) => e.designation || '' },
  { field: 'empresa',          label: 'Empresa',            getValue: (e) => e.company || '' },
  { field: 'fecha_ingreso',    label: 'Fecha de ingreso',   getValue: (e) => e.date_of_joining || '' },
  { field: 'fecha_nacimiento', label: 'Fecha nacimiento',   getValue: (e) => e.date_of_birth || '' },
  { field: 'genero',           label: 'Genero',             getValue: (e) => e.gender || '' },
  { field: 'tipo_empleo',      label: 'Tipo de empleo',     getValue: (e) => e.employment_type || '' },
  { field: 'sucursal',         label: 'Sucursal',           getValue: (e) => e.branch || '' },
  { field: 'email_personal',   label: 'Email personal',     getValue: (e) => e.personal_email || '' },
  { field: 'email_empresa',    label: 'Email corporativo',  getValue: (e) => e.company_email || '' },
  { field: 'telefono',         label: 'Telefono',           getValue: (e) => e.cell_phone || '' },
  { field: 'fecha_actual',     label: 'Fecha actual',       getValue: () => new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' }) },
];

// ---- Helpers ----

function detectFileType(file: File): DocumentFileType {
  const ext = file.name.split('.').pop()?.toLowerCase() || '';
  if (ext === 'docx' || ext === 'doc') return 'docx';
  return 'pdf';
}

function detectFileTypeFromUrl(url: string): DocumentFileType {
  const lower = url.toLowerCase();
  if (lower.endsWith('.docx') || lower.endsWith('.doc')) return 'docx';
  return 'pdf';
}

// ---- PDF Form Filler ----

async function fillPdfWithEmployeeData(pdfUrl: string, employee: Employee): Promise<Uint8Array> {
  const response = await fetch(pdfUrl);
  const pdfBytes = await response.arrayBuffer();
  const pdfDoc = await PDFDocument.load(pdfBytes, { ignoreEncryption: true });

  const form = pdfDoc.getForm();
  const fields = form.getFields();

  let filledCount = 0;

  for (const mapping of FIELD_MAP) {
    const value = mapping.getValue(employee);
    if (!value) continue;

    const field = fields.find(
      (f) => f.getName().toLowerCase() === mapping.field.toLowerCase()
    );

    if (field) {
      try {
        const textField = form.getTextField(field.getName());
        textField.setText(value);
        filledCount++;
      } catch {
        // Field exists but is not a text field — skip
      }
    }
  }

  if (filledCount > 0) {
    form.flatten();
  }

  return pdfDoc.save();
}

// ---- Word (DOCX) Filler ----

async function fillDocxWithEmployeeData(docxUrl: string, employee: Employee): Promise<Blob> {
  const response = await fetch(docxUrl);
  const arrayBuffer = await response.arrayBuffer();
  const zip = new PizZip(arrayBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '{{', end: '}}' },
  });

  // Build data object from field map
  const data: Record<string, string> = {};
  for (const mapping of FIELD_MAP) {
    data[mapping.field] = mapping.getValue(employee);
  }

  doc.render(data);

  const out = doc.getZip().generate({
    type: 'blob',
    mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  });

  return out as Blob;
}

// ---- Empty form ----

interface TemplateForm {
  title: string;
  category: DocumentCategory;
  description: string;
}

const EMPTY_FORM: TemplateForm = {
  title: '',
  category: 'Contrato',
  description: '',
};

// ============================================
// COMPONENT
// ============================================

export default function Documents() {
  const { data: templates, isLoading, isError, refetch } = useDocumentTemplates();
  const createMutation = useCreateDocumentTemplate();
  const updateMutation = useUpdateDocumentTemplate();
  const deleteMutation = useDeleteDocumentTemplate();

  // Editor modal
  const [showEditor, setShowEditor] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [editingFileUrl, setEditingFileUrl] = useState<string | null>(null);
  const [editingFileType, setEditingFileType] = useState<DocumentFileType>('pdf');
  const [form, setForm] = useState<TemplateForm>({ ...EMPTY_FORM });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  // Generate modal
  const [generateTemplate, setGenerateTemplate] = useState<DocumentTemplate | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ---- Stats ----
  const allTemplates = templates ?? [];
  const activeTemplates = allTemplates.filter((t) => t.status === 'Active');
  const inactiveTemplates = allTemplates.filter((t) => t.status === 'Inactive');
  const categoriesInUse = new Set(allTemplates.map((t) => t.category)).size;

  // ---- Helpers ----
  const getTemplateFileType = (t: DocumentTemplate): DocumentFileType => {
    if (t.file_type) return t.file_type;
    if (t.file_url) return detectFileTypeFromUrl(t.file_url);
    return 'pdf';
  };

  // ---- Open editor ----
  const openCreate = () => {
    setEditingName(null);
    setEditingFileUrl(null);
    setEditingFileType('pdf');
    setForm({ ...EMPTY_FORM });
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setShowEditor(true);
  };

  const openEdit = (t: DocumentTemplate) => {
    const ft = getTemplateFileType(t);
    setEditingName(t.name);
    setEditingFileUrl(t.file_url || null);
    setEditingFileType(ft);
    setForm({
      title: t.title,
      category: t.category,
      description: t.description || '',
    });
    setSelectedFile(null);
    setFilePreviewUrl(ft === 'pdf' ? (t.file_url || null) : null);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingName(null);
    setEditingFileUrl(null);
    setSelectedFile(null);
    setFilePreviewUrl(null);
  };

  // ---- Handle file select ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf';
    const isDocx = file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      || file.name.endsWith('.docx') || file.name.endsWith('.doc');

    if (!isPdf && !isDocx) {
      toast.error('Formato invalido', 'Solo se permiten archivos PDF o Word (.docx).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Archivo muy grande', 'El archivo no debe superar 10 MB.');
      return;
    }

    const ft = detectFileType(file);
    setSelectedFile(file);
    setEditingFileType(ft);

    if (isPdf) {
      setFilePreviewUrl(URL.createObjectURL(file));
    } else {
      setFilePreviewUrl(null); // No preview for docx in browser
    }
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Error', 'El titulo es requerido.');
      return;
    }
    if (!selectedFile && !editingFileUrl) {
      toast.error('Error', 'Debes subir un archivo (PDF o Word).');
      return;
    }

    try {
      setIsUploading(true);
      let fileUrl = editingFileUrl || '';
      let fileType = editingFileType;

      if (selectedFile) {
        const uploaded = await frappeUploadFile({ file: selectedFile, is_private: false });
        fileUrl = uploaded.file_url;
        fileType = detectFileType(selectedFile);
      }

      if (editingName) {
        await updateMutation.mutateAsync({
          name: editingName,
          data: { title: form.title, category: form.category, description: form.description, file_url: fileUrl, file_type: fileType, content: '' },
        });
        toast.success('Actualizada', 'La plantilla se actualizo correctamente.');
      } else {
        await createMutation.mutateAsync({
          title: form.title, category: form.category, description: form.description,
          file_url: fileUrl, file_type: fileType, content: '', status: 'Active',
        } as Partial<DocumentTemplate>);
        toast.success('Creada', 'La plantilla fue creada exitosamente.');
      }
      closeEditor();
    } catch (err) {
      console.error('[Documents] Error al guardar plantilla:', err);
      toast.fromError(err);
    } finally {
      setIsUploading(false);
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
  const handleConfirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget);
      toast.success('Eliminada', 'La plantilla fue eliminada.');
      setDeleteTarget(null);
    } catch (err) {
      toast.fromError(err);
    }
  };

  // ---- File type badge ----
  const FileTypeBadge = ({ type }: { type: DocumentFileType }) => (
    <span className={clsx(
      'rounded px-1.5 py-0.5 text-[10px] font-bold uppercase',
      type === 'pdf' ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'
    )}>
      {type}
    </span>
  );

  // ---- Table columns ----
  const columns: Column<DocumentTemplate>[] = [
    {
      key: 'title',
      header: 'Titulo',
      render: (t) => {
        const ft = getTemplateFileType(t);
        return (
          <div className="flex items-center gap-3">
            <div className={clsx(
              'flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg',
              ft === 'pdf' ? 'bg-red-50' : 'bg-blue-50'
            )}>
              {ft === 'pdf'
                ? <File className="h-5 w-5 text-red-500" />
                : <FileType className="h-5 w-5 text-blue-500" />
              }
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-medium text-gray-900">{t.title}</p>
                <FileTypeBadge type={ft} />
              </div>
              {t.description && <p className="text-xs text-gray-500 truncate max-w-xs">{t.description}</p>}
            </div>
          </div>
        );
      },
    },
    {
      key: 'category',
      header: 'Categoria',
      render: (t) => (
        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', CATEGORY_COLORS[t.category] || CATEGORY_COLORS['Otro'])}>
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
      key: 'actions',
      header: 'Acciones',
      render: (t) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }}
            className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="Ver archivo"
          >
            <Eye className="h-4 w-4" />
          </button>
          {t.file_url && (
            <button
              onClick={(e) => { e.stopPropagation(); setGenerateTemplate(t); }}
              className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600"
              title="Generar para empleado"
            >
              <Printer className="h-4 w-4" />
            </button>
          )}
          <RoleGuard section="documents" action="edit">
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(t); }}
              className="rounded p-1 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
              title="Editar / Reemplazar archivo"
            >
              <Edit className="h-4 w-4" />
            </button>
          </RoleGuard>
          <RoleGuard section="documents" action="delete">
            <button
              onClick={(e) => { e.stopPropagation(); setDeleteTarget(t.name); }}
              className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
              title="Eliminar"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </RoleGuard>
        </div>
      ),
    },
  ];

  const isSaving = createMutation.isPending || updateMutation.isPending || isUploading;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documentos</h1>
          <p className="mt-1 text-gray-500">Plantillas PDF y Word con llenado automatico de datos del empleado</p>
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

      {/* Info banner */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-700">
            <p className="font-medium">Plantillas con llenado automatico</p>
            <p className="mt-1">
              <strong>PDF:</strong> Usa campos de formulario (AcroForm) con los nombres listados abajo.
              <br />
              <strong>Word (.docx):</strong> Usa placeholders con doble llave, ej: <code className="rounded bg-blue-100 px-1 text-[11px]">{'{{nombre_empleado}}'}</code> directamente en el texto del documento.
            </p>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {FIELD_MAP.map((f) => (
                <code key={f.field} className="rounded bg-blue-100 px-1.5 py-0.5 text-[11px] font-mono text-blue-800">
                  {f.field}
                </code>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={allTemplates}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        onRowClick={(t) => setPreviewTemplate(t)}
        emptyMessage="No hay plantillas. Sube la primera desde el boton 'Nueva Plantilla'."
      />

      {/* ====== EDITOR MODAL ====== */}
      <Modal
        isOpen={showEditor}
        onClose={closeEditor}
        title={editingName ? 'Editar Plantilla' : 'Nueva Plantilla'}
        size="lg"
        footer={
          <>
            <button onClick={closeEditor} className="btn-secondary">Cancelar</button>
            <button onClick={handleSave} disabled={isSaving || !form.title.trim()} className="btn-primary">
              {isSaving ? 'Guardando...' : editingName ? 'Guardar Cambios' : 'Crear Plantilla'}
            </button>
          </>
        }
      >
        <div className="space-y-5">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Titulo *</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Ej: Contrato Individual de Trabajo" />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Categoria</label>
              <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as DocumentCategory })}>
                {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripcion</label>
              <input className="input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripcion breve..." />
            </div>
          </div>

          {/* File Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Archivo (PDF o Word) *</label>
            <input ref={fileInputRef} type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={handleFileSelect} />

            {(filePreviewUrl || selectedFile || editingFileUrl) ? (
              <div className="space-y-3">
                {/* PDF preview */}
                {filePreviewUrl && editingFileType === 'pdf' && (
                  <div className="overflow-hidden rounded-lg border border-gray-200">
                    <iframe src={filePreviewUrl} className="h-[400px] w-full" title="Vista previa del PDF" />
                  </div>
                )}

                {/* DOCX info (no browser preview) */}
                {editingFileType === 'docx' && (
                  <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/50 py-10">
                    <FileType className="h-12 w-12 text-blue-400" />
                    <p className="mt-3 text-sm font-medium text-blue-700">Documento Word cargado</p>
                    <p className="mt-1 text-xs text-blue-500">
                      Los archivos Word no se pueden previsualizar en el navegador.
                      <br />
                      Usa placeholders <code className="rounded bg-blue-100 px-1">{'{{campo}}'}</code> en tu documento.
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    {editingFileType === 'pdf'
                      ? <File className="h-4 w-4 text-red-500" />
                      : <FileType className="h-4 w-4 text-blue-500" />
                    }
                    {selectedFile
                      ? <span>{selectedFile.name} ({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                      : <span>Archivo actual ({editingFileType.toUpperCase()})</span>
                    }
                  </div>
                  <button type="button" onClick={() => fileInputRef.current?.click()} className="text-sm text-primary-600 hover:text-primary-700">
                    Reemplazar archivo
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-12 transition-colors hover:border-primary-400 hover:bg-primary-50/30"
              >
                <div className="rounded-full bg-primary-100 p-3">
                  <Upload className="h-6 w-6 text-primary-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">Haz clic para subir un archivo</p>
                  <p className="mt-1 text-xs text-gray-500">PDF o Word (.docx) hasta 10 MB</p>
                </div>
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* ====== FILE PREVIEW MODAL ====== */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.title || 'Documento'}
        size="xl"
        footer={
          <>
            <button onClick={() => setPreviewTemplate(null)} className="btn-secondary">Cerrar</button>
            {previewTemplate?.file_url && (
              <button
                onClick={() => { setPreviewTemplate(null); if (previewTemplate) setGenerateTemplate(previewTemplate); }}
                className="btn-primary"
              >
                <Printer className="h-4 w-4" />
                Generar para empleado
              </button>
            )}
          </>
        }
      >
        {previewTemplate && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className={clsx(
                'flex h-10 w-10 items-center justify-center rounded-lg',
                getTemplateFileType(previewTemplate) === 'pdf' ? 'bg-red-50' : 'bg-blue-50'
              )}>
                {getTemplateFileType(previewTemplate) === 'pdf'
                  ? <File className="h-5 w-5 text-red-500" />
                  : <FileType className="h-5 w-5 text-blue-500" />
                }
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-medium text-gray-900">{previewTemplate.title}</p>
                  <FileTypeBadge type={getTemplateFileType(previewTemplate)} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={clsx('rounded-full px-2 py-0.5 text-[10px] font-medium', CATEGORY_COLORS[previewTemplate.category] || CATEGORY_COLORS['Otro'])}>
                    {previewTemplate.category}
                  </span>
                  {previewTemplate.description && <span className="text-xs text-gray-500">{previewTemplate.description}</span>}
                </div>
              </div>
            </div>

            {previewTemplate.file_url ? (
              getTemplateFileType(previewTemplate) === 'pdf' ? (
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <iframe src={previewTemplate.file_url} className="h-[70vh] w-full" title={previewTemplate.title} />
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 py-16">
                  <FileType className="h-16 w-16 text-blue-300" />
                  <p className="mt-4 text-sm font-medium text-gray-700">Documento Word</p>
                  <p className="mt-1 text-xs text-gray-500">No se puede previsualizar en el navegador. Usa &quot;Generar para empleado&quot; para descargarlo con datos.</p>
                  <a
                    href={previewTemplate.file_url}
                    download
                    className="mt-4 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
                  >
                    <Download className="h-4 w-4" />
                    Descargar plantilla original
                  </a>
                </div>
              )
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">Esta plantilla no tiene un archivo asociado.</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ====== GENERATE MODAL ====== */}
      {generateTemplate && (
        <GenerateDocumentModal
          isOpen={!!generateTemplate}
          onClose={() => setGenerateTemplate(null)}
          template={generateTemplate}
          fileType={getTemplateFileType(generateTemplate)}
        />
      )}

      {/* ====== DELETE CONFIRM ====== */}
      <ConfirmDialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Eliminar plantilla"
        message="¿Estas seguro de eliminar esta plantilla? Esta accion no se puede deshacer."
        confirmLabel="Eliminar"
        isLoading={deleteMutation.isPending}
        variant="danger"
      />
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
  fileType,
}: {
  isOpen: boolean;
  onClose: () => void;
  template: DocumentTemplate;
  fileType: DocumentFileType;
}) {
  const { data: employeesData, isLoading: loadingEmployees } = useEmployees({ status: 'Active' }, 500);
  const employees = employeesData ?? [];

  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null);
  const [generatedDocxBlob, setGeneratedDocxBlob] = useState<Blob | null>(null);

  const filtered = search.trim()
    ? employees.filter((e) =>
        e.employee_name.toLowerCase().includes(search.toLowerCase()) ||
        e.name.toLowerCase().includes(search.toLowerCase()) ||
        e.department?.toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const handleSelectEmployee = (emp: Employee) => {
    setSelectedEmployee(emp);
    setSearch(emp.employee_name);
    setGeneratedPdfUrl(null);
    setGeneratedDocxBlob(null);
  };

  const handleClearEmployee = () => {
    setSelectedEmployee(null);
    setSearch('');
    setGeneratedPdfUrl(null);
    setGeneratedDocxBlob(null);
  };

  const handleGenerate = async () => {
    if (!selectedEmployee || !template.file_url) return;

    try {
      setIsGenerating(true);

      if (fileType === 'pdf') {
        const filledPdfBytes = await fillPdfWithEmployeeData(template.file_url, selectedEmployee);
        const blob = new Blob([filledPdfBytes as unknown as BlobPart], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        setGeneratedPdfUrl(url);
      } else {
        const blob = await fillDocxWithEmployeeData(template.file_url, selectedEmployee);
        setGeneratedDocxBlob(blob);
      }

      toast.success('Documento generado', `El ${fileType.toUpperCase()} fue llenado con los datos del empleado.`);
    } catch (err) {
      console.error('[Documents] Error al generar documento:', err);
      const hint = fileType === 'pdf'
        ? 'Verifica que el PDF tenga campos de formulario (AcroForm) validos.'
        : 'Verifica que el Word tenga placeholders con formato {{campo}}.';
      toast.error('Error al generar', `No se pudo procesar el archivo. ${hint}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!selectedEmployee) return;
    const baseName = `${template.title} - ${selectedEmployee.employee_name}`;

    if (fileType === 'pdf' && generatedPdfUrl) {
      const link = document.createElement('a');
      link.href = generatedPdfUrl;
      link.download = `${baseName}.pdf`;
      link.click();
    } else if (fileType === 'docx' && generatedDocxBlob) {
      saveAs(generatedDocxBlob, `${baseName}.docx`);
    }
  };

  const handleDownloadOriginal = () => {
    if (!template.file_url) return;
    const ext = fileType === 'pdf' ? '.pdf' : '.docx';
    const link = document.createElement('a');
    link.href = template.file_url;
    link.download = `${template.title}${ext}`;
    link.target = '_blank';
    link.click();
  };

  const hasGenerated = generatedPdfUrl || generatedDocxBlob;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Generar: ${template.title}`}
      size="xl"
      footer={
        <>
          <button onClick={onClose} className="btn-secondary">Cerrar</button>
          <button onClick={handleDownloadOriginal} className="btn-secondary">
            <Download className="h-4 w-4" />
            Descargar original
          </button>
          {selectedEmployee && !hasGenerated && (
            <button onClick={handleGenerate} disabled={isGenerating} className="btn-primary">
              {isGenerating ? 'Generando...' : `Generar ${fileType.toUpperCase()}`}
            </button>
          )}
          {hasGenerated && (
            <button onClick={handleDownload} className="btn-primary">
              <Download className="h-4 w-4" />
              Descargar con datos
            </button>
          )}
        </>
      }
    >
      <div className="space-y-5">
        {/* Step 1: Select employee */}
        <div>
          <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
            <User className="h-4 w-4" />
            1. Seleccionar empleado
          </label>

          {selectedEmployee ? (
            <div className="flex items-center justify-between rounded-lg border border-primary-200 bg-primary-50 p-3">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-200 text-sm font-semibold text-primary-700">
                  {selectedEmployee.employee_name.charAt(0)}
                </div>
                <div>
                  <p className="font-medium text-gray-900">{selectedEmployee.employee_name}</p>
                  <p className="text-xs text-gray-500">{selectedEmployee.name} &middot; {selectedEmployee.department} &middot; {selectedEmployee.designation}</p>
                </div>
              </div>
              <button onClick={handleClearEmployee} className="text-sm text-red-500 hover:text-red-700">
                Cambiar
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  className="input pl-10"
                  placeholder="Buscar por nombre, ID o departamento..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
              <div className="mt-2 max-h-[200px] overflow-y-auto rounded-lg border border-gray-200">
                {loadingEmployees ? (
                  <div className="p-4 text-center text-sm text-gray-500">Cargando empleados...</div>
                ) : filtered.length === 0 ? (
                  <div className="p-4 text-center text-sm text-gray-500">No se encontraron empleados</div>
                ) : (
                  filtered.slice(0, 50).map((emp) => (
                    <button
                      key={emp.name}
                      onClick={() => handleSelectEmployee(emp)}
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
            </>
          )}
        </div>

        {/* Step 2: Employee data preview */}
        {selectedEmployee && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <FileText className="h-4 w-4" />
              2. Datos que se llenaran en el {fileType.toUpperCase()}
            </label>
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-3">
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {FIELD_MAP.map((f) => {
                  const value = f.getValue(selectedEmployee);
                  return (
                    <div key={f.field} className="flex items-center gap-2 text-sm">
                      <code className="flex-shrink-0 rounded bg-gray-200 px-1.5 py-0.5 text-[11px] font-mono text-gray-600">
                        {fileType === 'docx' ? `{{${f.field}}}` : f.field}
                      </code>
                      <span className="text-gray-400">=</span>
                      <span className={clsx('truncate', value ? 'text-gray-900' : 'text-gray-400 italic')}>
                        {value || 'sin dato'}
                      </span>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 text-[11px] text-gray-500">
                {fileType === 'pdf'
                  ? 'Solo se llenan los campos AcroForm que existan en el PDF con estos nombres exactos.'
                  : 'Solo se reemplazan los placeholders {{campo}} que existan en el texto del documento Word.'}
              </p>
            </div>
          </div>
        )}

        {/* Step 3: Generated preview */}
        {generatedPdfUrl && fileType === 'pdf' && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Eye className="h-4 w-4" />
              3. Vista previa del documento generado
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <iframe src={generatedPdfUrl} className="h-[50vh] w-full" title="PDF generado" />
            </div>
          </div>
        )}

        {generatedDocxBlob && fileType === 'docx' && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <CheckCircle className="h-4 w-4 text-green-500" />
              3. Documento Word generado
            </label>
            <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-green-300 bg-green-50/50 py-10">
              <FileType className="h-12 w-12 text-green-400" />
              <p className="mt-3 text-sm font-medium text-green-700">Documento listo para descargar</p>
              <p className="mt-1 text-xs text-green-600">
                El archivo Word fue generado con los datos de {selectedEmployee?.employee_name}.
                Descargalo y editalo si necesitas ajustar algo.
              </p>
              <button onClick={handleDownload} className="mt-4 inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700">
                <Download className="h-4 w-4" />
                Descargar Word
              </button>
            </div>
          </div>
        )}

        {/* Show original template if no employee selected yet */}
        {!selectedEmployee && template.file_url && fileType === 'pdf' && (
          <div>
            <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-gray-700">
              <Eye className="h-4 w-4" />
              Vista previa de la plantilla
            </label>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <iframe src={template.file_url} className="h-[50vh] w-full" title="Plantilla" />
            </div>
          </div>
        )}

        {!selectedEmployee && template.file_url && fileType === 'docx' && (
          <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-blue-300 bg-blue-50/30 py-10">
            <FileType className="h-12 w-12 text-blue-300" />
            <p className="mt-3 text-sm font-medium text-gray-600">Plantilla Word</p>
            <p className="mt-1 text-xs text-gray-500">Selecciona un empleado arriba para generar el documento con sus datos.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
