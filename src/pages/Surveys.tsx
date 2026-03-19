import { useState } from 'react';
import { ClipboardList, Plus, CheckCircle, Users, TrendingUp, Trash2, Edit } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useSurveys, useCreateSurvey, useDeleteSurvey } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Survey } from '@/types/frappe';

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

export default function Surveys() {
  const { data: surveys, isLoading, isError, refetch } = useSurveys();
  const createMutation = useCreateSurvey();
  const deleteMutation = useDeleteSurvey();
  const [showNewModal, setShowNewModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    survey_type: 'General' as Survey['survey_type'],
    is_anonymous: false,
    end_date: '',
  });

  const activeSurveys = surveys?.filter((s) => s.status === 'Active') || [];

  const columns: Column<Survey>[] = [
    {
      key: 'title',
      header: 'Título',
      render: (s) => (
        <div>
          <p className="font-medium text-gray-900">{s.title}</p>
          {s.description && <p className="text-xs text-gray-500 truncate max-w-xs">{s.description}</p>}
        </div>
      ),
    },
    {
      key: 'survey_type',
      header: 'Tipo',
      render: (s) => (
        <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium', TYPE_COLORS[s.survey_type] || TYPE_COLORS['Otro'])}>
          {s.survey_type}
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (s) => (
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', STATUS_COLORS[s.status])}>
          {s.status}
        </span>
      ),
    },
    {
      key: 'is_anonymous',
      header: 'Anónima',
      render: (s) => (
        <span className={clsx('rounded-full px-2 py-0.5 text-xs font-medium', s.is_anonymous ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500')}>
          {s.is_anonymous ? 'Sí' : 'No'}
        </span>
      ),
    },
    {
      key: 'end_date',
      header: 'Vencimiento',
      render: (s) => <span className="text-sm text-gray-600">{s.end_date || 'Sin fecha'}</span>,
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: (s) => (
        <div className="flex gap-1">
          <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
          <button
            onClick={(e) => { e.stopPropagation(); handleDelete(s.name); }}
            className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...form,
        status: 'Draft',
        questions: [],
        target_audience: 'all',
      } as Partial<Survey>);
      toast.success('Encuesta creada', 'La encuesta se guardó como borrador.');
      setShowNewModal(false);
      setForm({ title: '', description: '', survey_type: 'General', is_anonymous: false, end_date: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleDelete = async (name: string) => {
    try {
      await deleteMutation.mutateAsync(name);
      toast.success('Eliminada', 'La encuesta fue eliminada.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Encuestas</h1>
          <p className="mt-1 text-gray-500">Motor de encuestas configurables</p>
        </div>
        <RoleGuard section="surveys" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Encuesta
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Encuestas" value={surveys?.length ?? 0} icon={ClipboardList} color="blue" />
        <StatsCard title="Activas" value={activeSurveys.length} icon={CheckCircle} color="green" />
        <StatsCard title="Respuestas Totales" value={0} icon={Users} color="purple" />
        <StatsCard title="Tasa Participación" value="—%" icon={TrendingUp} color="orange" />
      </div>

      <DataTable
        columns={columns}
        data={surveys ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay encuestas. Crea la primera desde el botón 'Nueva Encuesta'."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Encuesta"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !form.title} className="btn-primary">
              {createMutation.isPending ? 'Creando...' : 'Crear Encuesta'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Título</label>
            <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} placeholder="Título de la encuesta" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea className="input min-h-[80px]" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Descripción de la encuesta..." />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
              <select className="input" value={form.survey_type} onChange={(e) => setForm({ ...form, survey_type: e.target.value as Survey['survey_type'] })}>
                <option value="General">General</option>
                <option value="Clima Laboral">Clima Laboral</option>
                <option value="Satisfacción">Satisfacción</option>
                <option value="Salida">Salida</option>
                <option value="Otro">Otro</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de vencimiento</label>
              <input type="date" className="input" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="is_anonymous" checked={form.is_anonymous} onChange={(e) => setForm({ ...form, is_anonymous: e.target.checked })} className="h-4 w-4 rounded border-gray-300 text-primary-600" />
            <label htmlFor="is_anonymous" className="text-sm font-medium text-gray-700">Encuesta anónima</label>
          </div>
        </div>
      </Modal>
    </div>
  );
}
