import { useState, useRef } from 'react';
import {
  FileText, Plus, CheckCircle, XCircle, FolderOpen,
  Trash2, Edit, Eye, Upload, File, Download,
} from 'lucide-react';
import { clsx } from 'clsx';
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
} from '@/hooks/useFrappe';
import { frappeUploadFile } from '@/api/client';
import { toast } from '@/components/ui/Toast';
import type { DocumentTemplate, DocumentCategory } from '@/types/frappe';

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
  const [form, setForm] = useState<TemplateForm>({ ...EMPTY_FORM });
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfPreviewUrl, setPdfPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Preview modal
  const [previewTemplate, setPreviewTemplate] = useState<DocumentTemplate | null>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);

  // ---- Stats ----
  const allTemplates = templates ?? [];
  const activeTemplates = allTemplates.filter((t) => t.status === 'Active');
  const inactiveTemplates = allTemplates.filter((t) => t.status === 'Inactive');
  const categoriesInUse = new Set(allTemplates.map((t) => t.category)).size;

  // ---- Open editor ----
  const openCreate = () => {
    setEditingName(null);
    setEditingFileUrl(null);
    setForm({ ...EMPTY_FORM });
    setPdfFile(null);
    setPdfPreviewUrl(null);
    setShowEditor(true);
  };

  const openEdit = (t: DocumentTemplate) => {
    setEditingName(t.name);
    setEditingFileUrl(t.file_url || null);
    setForm({
      title: t.title,
      category: t.category,
      description: t.description || '',
    });
    setPdfFile(null);
    setPdfPreviewUrl(t.file_url || null);
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingName(null);
    setEditingFileUrl(null);
    setPdfFile(null);
    setPdfPreviewUrl(null);
  };

  // ---- Handle file select ----
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== 'application/pdf') {
      toast.error('Formato invalido', 'Solo se permiten archivos PDF.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Archivo muy grande', 'El PDF no debe superar 10 MB.');
      return;
    }
    setPdfFile(file);
    setPdfPreviewUrl(URL.createObjectURL(file));
  };

  // ---- Save ----
  const handleSave = async () => {
    if (!form.title.trim()) {
      toast.error('Error', 'El titulo es requerido.');
      return;
    }

    // Must have either an existing file or a new file
    if (!pdfFile && !editingFileUrl) {
      toast.error('Error', 'Debes subir un archivo PDF.');
      return;
    }

    try {
      setIsUploading(true);
      let fileUrl = editingFileUrl || '';

      // Upload new PDF if selected
      if (pdfFile) {
        const uploaded = await frappeUploadFile({
          file: pdfFile,
          is_private: false,
        });
        fileUrl = uploaded.file_url;
      }

      if (editingName) {
        await updateMutation.mutateAsync({
          name: editingName,
          data: {
            title: form.title,
            category: form.category,
            description: form.description,
            file_url: fileUrl,
            content: '',
          },
        });
        toast.success('Actualizada', 'La plantilla se actualizo correctamente.');
      } else {
        await createMutation.mutateAsync({
          title: form.title,
          category: form.category,
          description: form.description,
          file_url: fileUrl,
          content: '',
          status: 'Active',
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

  // ---- Table columns ----
  const columns: Column<DocumentTemplate>[] = [
    {
      key: 'title',
      header: 'Titulo',
      render: (t) => (
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-red-50">
            <File className="h-5 w-5 text-red-500" />
          </div>
          <div>
            <p className="font-medium text-gray-900">{t.title}</p>
            {t.description && (
              <p className="text-xs text-gray-500 truncate max-w-xs">{t.description}</p>
            )}
          </div>
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
      key: 'actions',
      header: 'Acciones',
      render: (t) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => { e.stopPropagation(); setPreviewTemplate(t); }}
            className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="Ver PDF"
          >
            <Eye className="h-4 w-4" />
          </button>
          <RoleGuard section="documents" action="edit">
            <button
              onClick={(e) => { e.stopPropagation(); openEdit(t); }}
              className="rounded p-1 text-gray-400 hover:bg-amber-50 hover:text-amber-600"
              title="Editar"
            >
              <Edit className="h-4 w-4" />
            </button>
          </RoleGuard>
          {t.file_url && (
            <a
              href={t.file_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="rounded p-1 text-gray-400 hover:bg-green-50 hover:text-green-600"
              title="Descargar PDF"
            >
              <Download className="h-4 w-4" />
            </a>
          )}
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
          <p className="mt-1 text-gray-500">Plantillas PDF de documentos HR</p>
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

          {/* PDF Upload */}
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Archivo PDF *</label>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={handleFileSelect}
            />

            {pdfPreviewUrl ? (
              <div className="space-y-3">
                {/* PDF preview */}
                <div className="overflow-hidden rounded-lg border border-gray-200">
                  <iframe
                    src={pdfPreviewUrl}
                    className="h-[400px] w-full"
                    title="Vista previa del PDF"
                  />
                </div>
                {/* File info + change button */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <File className="h-4 w-4 text-red-500" />
                    {pdfFile ? (
                      <span>{pdfFile.name} ({(pdfFile.size / 1024).toFixed(0)} KB)</span>
                    ) : (
                      <span>PDF actual</span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-sm text-primary-600 hover:text-primary-700"
                  >
                    Cambiar archivo
                  </button>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="flex w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 py-12 transition-colors hover:border-primary-400 hover:bg-primary-50/30"
              >
                <div className="rounded-full bg-primary-100 p-3">
                  <Upload className="h-6 w-6 text-primary-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-gray-700">
                    Haz clic para subir un PDF
                  </p>
                  <p className="mt-1 text-xs text-gray-500">
                    PDF hasta 10 MB
                  </p>
                </div>
              </button>
            )}
          </div>
        </div>
      </Modal>

      {/* ====== PDF PREVIEW MODAL ====== */}
      <Modal
        isOpen={!!previewTemplate}
        onClose={() => setPreviewTemplate(null)}
        title={previewTemplate?.title || 'Documento'}
        size="xl"
        footer={
          <>
            <button onClick={() => setPreviewTemplate(null)} className="btn-secondary">Cerrar</button>
            {previewTemplate?.file_url && (
              <a
                href={previewTemplate.file_url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn-primary inline-flex items-center gap-2"
              >
                <Download className="h-4 w-4" />
                Descargar PDF
              </a>
            )}
          </>
        }
      >
        {previewTemplate && (
          <div className="space-y-4">
            {/* Template info */}
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-50">
                <File className="h-5 w-5 text-red-500" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{previewTemplate.title}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className={clsx(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium',
                    CATEGORY_COLORS[previewTemplate.category] || CATEGORY_COLORS['Otro']
                  )}>
                    {previewTemplate.category}
                  </span>
                  {previewTemplate.description && (
                    <span className="text-xs text-gray-500">{previewTemplate.description}</span>
                  )}
                </div>
              </div>
            </div>

            {/* PDF viewer */}
            {previewTemplate.file_url ? (
              <div className="overflow-hidden rounded-lg border border-gray-200">
                <iframe
                  src={previewTemplate.file_url}
                  className="h-[70vh] w-full"
                  title={previewTemplate.title}
                />
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <FileText className="h-12 w-12 text-gray-300" />
                <p className="mt-3 text-sm text-gray-500">
                  Esta plantilla no tiene un PDF asociado.
                </p>
              </div>
            )}
          </div>
        )}
      </Modal>

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
