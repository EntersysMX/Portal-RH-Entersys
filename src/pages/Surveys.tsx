import { useState, useRef, useCallback } from 'react';
import {
  ClipboardList, Plus, CheckCircle, Lock, HelpCircle,
  Trash2, Edit, Upload, Download, X, Loader2,
  FileSpreadsheet, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useSurveys, useCreateSurvey, useUpdateSurvey, useDeleteSurvey } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import { downloadSurveyTemplate, parseSurveyExcel } from '@/lib/excel/surveyExcel';
import type { ParsedSurvey } from '@/lib/excel/surveyExcel';
import type { Survey, SurveyQuestion } from '@/types/frappe';

// ---- Constants ----

const TYPE_COLORS: Record<string, string> = {
  'General': 'bg-blue-100 text-blue-700',
  'Clima Laboral': 'bg-purple-100 text-purple-700',
  'Satisfacción': 'bg-green-100 text-green-700',
  'Salida': 'bg-orange-100 text-orange-700',
  'Otro': 'bg-gray-100 text-gray-700',
};

const STATUS_COLORS: Record<string, string> = {
  Draft: 'bg-gray-100 text-gray-600',
  Active: 'bg-green-100 text-green-700',
  Closed: 'bg-red-100 text-red-700',
};

const STATUS_LABELS: Record<string, string> = {
  Draft: 'Borrador',
  Active: 'Activa',
  Closed: 'Cerrada',
};

const QUESTION_TYPE_LABELS: Record<string, string> = {
  open: 'Abierta',
  multiple_choice: 'Opción Múltiple',
  likert: 'Escala Likert',
};

// ---- Empty question factory ----

function emptyQuestion(idx: number): SurveyQuestion {
  return { idx, question_text: '', question_type: 'open', required: false };
}

// ---- Empty form ----

interface SurveyForm {
  title: string;
  description: string;
  survey_type: Survey['survey_type'];
  is_anonymous: boolean;
  end_date: string;
  questions: SurveyQuestion[];
}

const EMPTY_FORM: SurveyForm = {
  title: '',
  description: '',
  survey_type: 'General',
  is_anonymous: false,
  end_date: '',
  questions: [emptyQuestion(1)],
};

// ============================================
// COMPONENT
// ============================================

export default function Surveys() {
  const { data: surveys, isLoading, isError, refetch } = useSurveys();
  const createMutation = useCreateSurvey();
  const updateMutation = useUpdateSurvey();
  const deleteMutation = useDeleteSurvey();

  // Editor modal
  const [showEditor, setShowEditor] = useState(false);
  const [editingName, setEditingName] = useState<string | null>(null);
  const [form, setForm] = useState<SurveyForm>({ ...EMPTY_FORM });

  // Bulk upload modal
  const [showBulk, setShowBulk] = useState(false);

  // ---- Stats ----
  const allSurveys = surveys ?? [];
  const activeSurveys = allSurveys.filter((s) => s.status === 'Active');
  const closedSurveys = allSurveys.filter((s) => s.status === 'Closed');
  const totalQuestions = allSurveys.reduce((sum, s) => sum + (s.questions?.length ?? 0), 0);

  // ---- Open editor ----
  const openCreate = () => {
    setEditingName(null);
    setForm({ ...EMPTY_FORM, questions: [emptyQuestion(1)] });
    setShowEditor(true);
  };

  const openEdit = (s: Survey) => {
    setEditingName(s.name);
    setForm({
      title: s.title,
      description: s.description || '',
      survey_type: s.survey_type,
      is_anonymous: s.is_anonymous,
      end_date: s.end_date || '',
      questions: s.questions?.length
        ? s.questions.map((q, i) => ({ ...q, idx: i + 1 }))
        : [emptyQuestion(1)],
    });
    setShowEditor(true);
  };

  const closeEditor = () => {
    setShowEditor(false);
    setEditingName(null);
  };

  // ---- Save (create or update) ----
  const handleSave = async () => {
    const cleaned = form.questions
      .filter((q) => q.question_text.trim())
      .map((q, i) => ({ ...q, idx: i + 1 }));

    if (!form.title.trim()) {
      toast.error('Error', 'El titulo es requerido.');
      return;
    }
    if (cleaned.length === 0) {
      toast.error('Error', 'Agrega al menos una pregunta.');
      return;
    }

    try {
      if (editingName) {
        await updateMutation.mutateAsync({
          name: editingName,
          data: {
            title: form.title,
            description: form.description,
            survey_type: form.survey_type,
            is_anonymous: form.is_anonymous,
            end_date: form.end_date || undefined,
            questions: cleaned,
          },
        });
        toast.success('Actualizada', 'La encuesta se actualizo correctamente.');
      } else {
        await createMutation.mutateAsync({
          title: form.title,
          description: form.description,
          survey_type: form.survey_type,
          is_anonymous: form.is_anonymous,
          end_date: form.end_date || undefined,
          status: 'Draft',
          questions: cleaned,
          target_audience: 'all',
        } as Partial<Survey>);
        toast.success('Creada', 'La encuesta se guardo como borrador.');
      }
      closeEditor();
    } catch (err) {
      console.error('[Surveys] Error al guardar encuesta:', err);
      toast.fromError(err);
    }
  };

  // ---- Status toggle ----
  const handleToggleStatus = async (s: Survey) => {
    const next: Survey['status'] =
      s.status === 'Draft' ? 'Active' : s.status === 'Active' ? 'Closed' : 'Draft';
    try {
      await updateMutation.mutateAsync({ name: s.name, data: { status: next } });
      toast.success('Estado actualizado', `Encuesta cambiada a ${STATUS_LABELS[next]}.`);
    } catch (err) {
      toast.fromError(err);
    }
  };

  // ---- Delete ----
  const handleDelete = async (name: string) => {
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Eliminada', 'La encuesta fue eliminada.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  // ---- Question builder helpers ----
  const updateQuestion = (idx: number, patch: Partial<SurveyQuestion>) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.idx === idx ? { ...q, ...patch } : q)),
    }));
  };

  const removeQuestion = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      questions: prev.questions
        .filter((q) => q.idx !== idx)
        .map((q, i) => ({ ...q, idx: i + 1 })),
    }));
  };

  const addQuestion = () => {
    setForm((prev) => ({
      ...prev,
      questions: [...prev.questions, emptyQuestion(prev.questions.length + 1)],
    }));
  };

  // ---- Table columns ----
  const columns: Column<Survey>[] = [
    {
      key: 'title',
      header: 'Titulo',
      render: (s) => (
        <div>
          <p className="font-medium text-gray-900">{s.title}</p>
          {s.description && (
            <p className="text-xs text-gray-500 truncate max-w-xs">{s.description}</p>
          )}
        </div>
      ),
    },
    {
      key: 'survey_type',
      header: 'Tipo',
      render: (s) => (
        <span
          className={clsx(
            'rounded-full px-2.5 py-0.5 text-xs font-medium',
            TYPE_COLORS[s.survey_type] || TYPE_COLORS['Otro']
          )}
        >
          {s.survey_type}
        </span>
      ),
    },
    {
      key: 'questions' as keyof Survey,
      header: 'Preguntas',
      render: (s) => (
        <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
          {s.questions?.length ?? 0}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (s) => (
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleToggleStatus(s);
          }}
          className={clsx(
            'cursor-pointer rounded-full px-2 py-0.5 text-xs font-medium transition-colors hover:ring-2 hover:ring-offset-1',
            STATUS_COLORS[s.status]
          )}
          title="Click para cambiar estado"
        >
          {STATUS_LABELS[s.status] || s.status}
        </button>
      ),
    },
    {
      key: 'is_anonymous',
      header: 'Anonima',
      render: (s) => (
        <span
          className={clsx(
            'rounded-full px-2 py-0.5 text-xs font-medium',
            s.is_anonymous ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'
          )}
        >
          {s.is_anonymous ? 'Si' : 'No'}
        </span>
      ),
    },
    {
      key: 'end_date',
      header: 'Vencimiento',
      render: (s) => (
        <span className="text-sm text-gray-600">{s.end_date || 'Sin fecha'}</span>
      ),
    },
    {
      key: 'actions' as keyof Survey,
      header: 'Acciones',
      render: (s) => (
        <div className="flex gap-1">
          <button
            onClick={(e) => {
              e.stopPropagation();
              openEdit(s);
            }}
            className="rounded p-1 text-gray-400 hover:bg-blue-50 hover:text-blue-600"
            title="Editar"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(s.name);
            }}
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
          <h1 className="text-2xl font-bold text-gray-900">Encuestas</h1>
          <p className="mt-1 text-gray-500">Motor de encuestas configurables</p>
        </div>
        <RoleGuard section="surveys" action="create">
          <div className="flex gap-2">
            <button onClick={() => setShowBulk(true)} className="btn-secondary">
              <Upload className="h-4 w-4" />
              Carga Masiva
            </button>
            <button onClick={openCreate} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nueva Encuesta
            </button>
          </div>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Encuestas" value={allSurveys.length} icon={ClipboardList} color="blue" />
        <StatsCard title="Activas" value={activeSurveys.length} icon={CheckCircle} color="green" />
        <StatsCard title="Cerradas" value={closedSurveys.length} icon={Lock} color="red" />
        <StatsCard title="Preguntas Totales" value={totalQuestions} icon={HelpCircle} color="purple" />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={allSurveys}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay encuestas. Crea la primera desde el boton 'Nueva Encuesta'."
      />

      {/* ====== EDITOR MODAL ====== */}
      <Modal
        isOpen={showEditor}
        onClose={closeEditor}
        title={editingName ? 'Editar Encuesta' : 'Nueva Encuesta'}
        size="xl"
        footer={
          <>
            <button onClick={closeEditor} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving || !form.title.trim()}
              className="btn-primary"
            >
              {isSaving ? 'Guardando...' : editingName ? 'Guardar Cambios' : 'Crear Encuesta'}
            </button>
          </>
        }
      >
        <div className="space-y-6">
          {/* Survey metadata */}
          <div className="space-y-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Titulo *</label>
              <input
                className="input"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder="Titulo de la encuesta"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripcion</label>
              <textarea
                className="input min-h-[60px]"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Descripcion de la encuesta..."
              />
            </div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
                <select
                  className="input"
                  value={form.survey_type}
                  onChange={(e) =>
                    setForm({ ...form, survey_type: e.target.value as Survey['survey_type'] })
                  }
                >
                  <option value="General">General</option>
                  <option value="Clima Laboral">Clima Laboral</option>
                  <option value="Satisfacción">Satisfaccion</option>
                  <option value="Salida">Salida</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Fecha de vencimiento
                </label>
                <input
                  type="date"
                  className="input"
                  value={form.end_date}
                  onChange={(e) => setForm({ ...form, end_date: e.target.value })}
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={form.is_anonymous}
                    onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })}
                    className="h-4 w-4 rounded border-gray-300 text-primary-600"
                  />
                  <span className="text-sm font-medium text-gray-700">Anonima</span>
                </label>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-gray-200 pt-4">
            <h3 className="mb-3 text-sm font-semibold text-gray-800 uppercase tracking-wide">
              Constructor de Preguntas
            </h3>
          </div>

          {/* Question cards */}
          <div className="space-y-3">
            {form.questions.map((q) => (
              <QuestionCard
                key={q.idx}
                question={q}
                onUpdate={(patch) => updateQuestion(q.idx, patch)}
                onRemove={() => removeQuestion(q.idx)}
                canRemove={form.questions.length > 1}
              />
            ))}
          </div>

          {/* Add question button */}
          <button
            type="button"
            onClick={addQuestion}
            className="flex w-full items-center justify-center gap-2 rounded-lg border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-500 transition-colors hover:border-primary-400 hover:text-primary-600"
          >
            <Plus className="h-4 w-4" />
            Agregar Pregunta
          </button>
        </div>
      </Modal>

      {/* ====== BULK UPLOAD MODAL ====== */}
      <BulkUploadSurveyModal
        isOpen={showBulk}
        onClose={() => setShowBulk(false)}
        onComplete={() => {
          refetch();
          setShowBulk(false);
        }}
      />
    </div>
  );
}

// ============================================
// QUESTION CARD SUB-COMPONENT
// ============================================

function QuestionCard({
  question,
  onUpdate,
  onRemove,
  canRemove,
}: {
  question: SurveyQuestion;
  onUpdate: (patch: Partial<SurveyQuestion>) => void;
  onRemove: () => void;
  canRemove: boolean;
}) {
  const options = question.options ? question.options.split(',').map((o) => o.trim()) : [];

  const setOptions = (newOpts: string[]) => {
    onUpdate({ options: newOpts.join(',') });
  };

  const addOption = () => setOptions([...options, '']);
  const removeOption = (i: number) => setOptions(options.filter((_, idx) => idx !== i));
  const updateOption = (i: number, val: string) =>
    setOptions(options.map((o, idx) => (idx === i ? val : o)));

  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      {/* Header row */}
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          {question.idx}. Pregunta
        </span>
        {canRemove && (
          <button
            onClick={onRemove}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
            title="Eliminar pregunta"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Type selector */}
      <div className="mb-3">
        <label className="mb-1 block text-xs font-medium text-gray-600">Tipo</label>
        <select
          className="input text-sm"
          value={question.question_type}
          onChange={(e) => {
            const newType = e.target.value as SurveyQuestion['question_type'];
            const patch: Partial<SurveyQuestion> = { question_type: newType };
            if (newType === 'multiple_choice' && !question.options) {
              patch.options = 'Opcion 1,Opcion 2,Opcion 3';
            }
            if (newType !== 'multiple_choice') {
              patch.options = undefined;
            }
            onUpdate(patch);
          }}
        >
          <option value="open">{QUESTION_TYPE_LABELS.open}</option>
          <option value="multiple_choice">{QUESTION_TYPE_LABELS.multiple_choice}</option>
          <option value="likert">{QUESTION_TYPE_LABELS.likert}</option>
        </select>
      </div>

      {/* Question text */}
      <div className="mb-3">
        <input
          className="input text-sm"
          placeholder="Texto de la pregunta..."
          value={question.question_text}
          onChange={(e) => onUpdate({ question_text: e.target.value })}
        />
      </div>

      {/* MC options */}
      {question.question_type === 'multiple_choice' && (
        <div className="mb-3 space-y-2 pl-4">
          {options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2">
              <input
                className="input flex-1 text-sm"
                value={opt}
                placeholder={`Opcion ${i + 1}`}
                onChange={(e) => updateOption(i, e.target.value)}
              />
              <button
                onClick={() => removeOption(i)}
                className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                title="Quitar opcion"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
          <button
            onClick={addOption}
            className="text-xs font-medium text-primary-600 hover:text-primary-700"
          >
            + Agregar opcion
          </button>
        </div>
      )}

      {/* Likert info */}
      {question.question_type === 'likert' && (
        <div className="mb-3 rounded-md bg-blue-50 px-3 py-2 text-xs text-blue-700">
          Escala 1-5: 1 = Muy en desacuerdo, 5 = Muy de acuerdo
        </div>
      )}

      {/* Required checkbox */}
      <label className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={question.required}
          onChange={(e) => onUpdate({ required: e.target.checked })}
          className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
        />
        <span className="text-xs font-medium text-gray-600">Obligatoria</span>
      </label>
    </div>
  );
}

// ============================================
// BULK UPLOAD MODAL
// ============================================

type BulkStep = 'upload' | 'preview' | 'importing' | 'done';

function BulkUploadSurveyModal({
  isOpen,
  onClose,
  onComplete,
}: {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}) {
  const createMutation = useCreateSurvey();

  const [step, setStep] = useState<BulkStep>('upload');
  const [parsed, setParsed] = useState<ParsedSurvey[]>([]);
  const [parseErrors, setParseErrors] = useState<string[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState({ created: 0, failed: 0, errors: [] as string[] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setParsed([]);
    setParseErrors([]);
    setIsParsing(false);
    setIsDownloading(false);
    setImportProgress({ current: 0, total: 0 });
    setImportResults({ created: 0, failed: 0, errors: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = () => {
    if (step === 'importing') return;
    reset();
    onClose();
  };

  const handleDownload = async () => {
    setIsDownloading(true);
    try {
      await downloadSurveyTemplate();
    } catch (err) {
      toast.fromError(err);
    } finally {
      setIsDownloading(false);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsParsing(true);
    setParseErrors([]);
    try {
      const result = await parseSurveyExcel(file);
      setParsed(result.surveys);
      setParseErrors(result.errors);
      setStep('preview');
    } catch (err) {
      setParseErrors([err instanceof Error ? err.message : String(err)]);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    setStep('importing');
    setImportProgress({ current: 0, total: parsed.length });
    let created = 0;
    let failed = 0;
    const errors: string[] = [];

    for (let i = 0; i < parsed.length; i++) {
      const s = parsed[i];
      setImportProgress({ current: i + 1, total: parsed.length });
      try {
        await createMutation.mutateAsync({
          title: s.title,
          description: '',
          survey_type: s.survey_type,
          is_anonymous: s.is_anonymous,
          end_date: s.end_date || undefined,
          status: 'Draft',
          questions: s.questions,
          target_audience: 'all',
        } as Partial<Survey>);
        created++;
      } catch (err) {
        failed++;
        errors.push(`"${s.title}": ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    setImportResults({ created, failed, errors });
    setStep('done');
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Carga Masiva de Encuestas"
      size="xl"
      footer={
        step === 'upload' ? (
          <button onClick={handleClose} className="btn-secondary">
            Cerrar
          </button>
        ) : step === 'preview' ? (
          <>
            <button onClick={reset} className="btn-secondary">
              Volver
            </button>
            <button
              onClick={handleImport}
              disabled={parsed.length === 0}
              className="btn-primary"
            >
              Importar {parsed.length} encuesta{parsed.length !== 1 ? 's' : ''}
            </button>
          </>
        ) : step === 'done' ? (
          <button
            onClick={() => {
              reset();
              onComplete();
            }}
            className="btn-primary"
          >
            Listo
          </button>
        ) : undefined
      }
    >
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-6">
          {/* Download template */}
          <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">1. Descarga la plantilla</p>
                <p className="text-sm text-gray-500">
                  Archivo Excel con formato y validaciones predefinidas.
                </p>
              </div>
              <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="btn-secondary"
              >
                {isDownloading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
                Descargar
              </button>
            </div>
          </div>

          {/* Upload file */}
          <div className="rounded-lg border-2 border-dashed border-gray-300 p-8 text-center">
            <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400" />
            <p className="mt-2 font-medium text-gray-700">2. Sube el archivo completado</p>
            <p className="mt-1 text-sm text-gray-500">
              Formato .xlsx con la hoja &quot;Encuestas&quot;
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isParsing}
              className="btn-primary mt-4"
            >
              {isParsing ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Procesando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4" />
                  Seleccionar Archivo
                </>
              )}
            </button>
          </div>

          {/* Parse errors (if went back and had errors) */}
          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <div className="flex items-center gap-2 text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="font-medium">Errores de formato</span>
              </div>
              <ul className="mt-2 space-y-1 text-sm text-red-600">
                {parseErrors.map((e, i) => (
                  <li key={i}>- {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            <span className="font-medium text-gray-900">
              {parsed.length} encuesta{parsed.length !== 1 ? 's' : ''} detectada
              {parsed.length !== 1 ? 's' : ''}
            </span>
          </div>

          {parseErrors.length > 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
              <div className="flex items-center gap-2 text-amber-700">
                <AlertTriangle className="h-4 w-4" />
                <span className="text-sm font-medium">
                  {parseErrors.length} advertencia{parseErrors.length !== 1 ? 's' : ''}
                </span>
              </div>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-600">
                {parseErrors.slice(0, 10).map((e, i) => (
                  <li key={i}>- {e}</li>
                ))}
                {parseErrors.length > 10 && (
                  <li className="font-medium">...y {parseErrors.length - 10} mas</li>
                )}
              </ul>
            </div>
          )}

          <div className="max-h-[40vh] space-y-2 overflow-y-auto">
            {parsed.map((s, i) => (
              <div key={i} className="rounded-lg border border-gray-200 bg-white p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{s.title}</p>
                    <p className="text-xs text-gray-500">
                      {s.survey_type} {s.is_anonymous ? '| Anonima' : ''}{' '}
                      {s.end_date ? `| Vence: ${s.end_date}` : ''}
                    </p>
                  </div>
                  <span className="rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                    {s.questions.length} pregunta{s.questions.length !== 1 ? 's' : ''}
                  </span>
                </div>
                <div className="mt-2 space-y-1">
                  {s.questions.map((q, qi) => (
                    <div key={qi} className="flex items-center gap-2 text-xs text-gray-600">
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-[10px]">
                        {QUESTION_TYPE_LABELS[q.question_type] || q.question_type}
                      </span>
                      <span className="truncate">{q.question_text}</span>
                      {q.required && (
                        <span className="text-red-400">*</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div className="flex flex-col items-center py-12">
          <Loader2 className="h-10 w-10 animate-spin text-primary-600" />
          <p className="mt-4 text-lg font-medium text-gray-900">Importando encuestas...</p>
          <p className="mt-1 text-sm text-gray-500">
            {importProgress.current} de {importProgress.total}
          </p>
          <div className="mt-4 h-2 w-64 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-primary-600 transition-all"
              style={{
                width: `${importProgress.total ? (importProgress.current / importProgress.total) * 100 : 0}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="space-y-4 py-6 text-center">
          {importResults.failed === 0 ? (
            <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
          ) : (
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
          )}
          <p className="text-lg font-medium text-gray-900">Importacion completada</p>
          <div className="flex justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold text-green-600">{importResults.created}</p>
              <p className="text-xs text-gray-500">Creadas</p>
            </div>
            {importResults.failed > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold text-red-600">{importResults.failed}</p>
                <p className="text-xs text-gray-500">Fallidas</p>
              </div>
            )}
          </div>
          {importResults.errors.length > 0 && (
            <div className="mx-auto max-w-md rounded-lg border border-red-200 bg-red-50 p-3 text-left">
              <p className="mb-1 text-sm font-medium text-red-700">Errores:</p>
              <ul className="space-y-0.5 text-xs text-red-600">
                {importResults.errors.map((e, i) => (
                  <li key={i}>- {e}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
