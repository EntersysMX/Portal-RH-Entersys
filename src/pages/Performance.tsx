import { useState } from 'react';
import { Target, Award, TrendingUp, BarChart3, Plus } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable, { type Column } from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useAppraisals, useGoals, useCreateGoal } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Appraisal, Goal } from '@/types/frappe';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

type Tab = 'appraisals' | 'goals';

const TABS: { id: Tab; label: string }[] = [
  { id: 'appraisals', label: 'Evaluaciones' },
  { id: 'goals', label: 'Objetivos' },
];

const demoRadarData = [
  { skill: 'Liderazgo', value: 85 },
  { skill: 'Comunicación', value: 90 },
  { skill: 'Técnico', value: 78 },
  { skill: 'Trabajo en equipo', value: 92 },
  { skill: 'Innovación', value: 70 },
  { skill: 'Puntualidad', value: 88 },
];

export default function Performance() {
  const [activeTab, setActiveTab] = useState<Tab>('appraisals');
  const [showGoalModal, setShowGoalModal] = useState(false);
  const [newGoal, setNewGoal] = useState({
    employee: '',
    goal_name: '',
    kra: '',
    per_weightage: 0,
    start_date: '',
    end_date: '',
  });

  const { data: appraisals, isLoading, isError, refetch } = useAppraisals();
  const { data: goals, isLoading: loadingGoals, isError: errorGoals, refetch: refetchGoals } = useGoals();
  const createGoalMutation = useCreateGoal();

  const completedCount = appraisals?.filter((a) => a.status === 'Completed').length ?? 0;
  const avgScore =
    appraisals && appraisals.length > 0
      ? (appraisals.reduce((sum, a) => sum + (a.final_score ?? 0), 0) / appraisals.length).toFixed(1)
      : '0';

  const goalColumns: Column<Goal>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (g) => (
        <div>
          <p className="font-medium text-gray-900">{g.employee_name}</p>
          <p className="text-xs text-gray-400">{g.employee}</p>
        </div>
      ),
    },
    { key: 'goal_name', header: 'Objetivo' },
    { key: 'kra', header: 'KRA' },
    { key: 'per_weightage', header: 'Peso %', render: (g) => <span>{g.per_weightage}%</span> },
    { key: 'score', header: 'Progreso', render: (g) => <span className="font-medium">{g.score ?? 0}/5</span> },
    { key: 'status', header: 'Estado', render: (g) => <StatusBadge status={g.status} /> },
  ];

  const handleCreateGoal = async () => {
    try {
      await createGoalMutation.mutateAsync({
        ...newGoal,
        status: 'Pending',
        score: 0,
      } as Partial<Goal>);
      toast.success('Objetivo creado', 'El objetivo se registró correctamente.');
      setShowGoalModal(false);
      setNewGoal({ employee: '', goal_name: '', kra: '', per_weightage: 0, start_date: '', end_date: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
          <p className="mt-1 text-gray-500">Evaluaciones de desempeño y objetivos</p>
        </div>
        {activeTab === 'goals' && (
          <RoleGuard section="performance" action="create">
            <button onClick={() => setShowGoalModal(true)} className="btn-primary">
              <Plus className="h-4 w-4" />
              Nuevo Objetivo
            </button>
          </RoleGuard>
        )}
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Evaluaciones Activas" value={appraisals?.length ?? 0} icon={Target} color="blue" />
        <StatsCard title="Completadas" value={completedCount} icon={Award} color="green" />
        <StatsCard title="Promedio General" value={avgScore} icon={TrendingUp} color="purple" />
        <StatsCard title="Objetivos" value={goals?.length ?? 0} icon={BarChart3} color="orange" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={clsx(
                'border-b-2 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Appraisals tab */}
      {activeTab === 'appraisals' && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Competencias Promedio</h3>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={demoRadarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Radar dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} strokeWidth={2} />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="mb-4 text-base font-semibold text-gray-900">Evaluaciones Recientes</h3>
            {isLoading ? (
              <div className="flex h-40 items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
              </div>
            ) : isError ? (
              <ErrorState onRetry={refetch} compact />
            ) : appraisals?.length === 0 ? (
              <p className="py-8 text-center text-gray-400">No hay evaluaciones.</p>
            ) : (
              <div className="space-y-3">
                {appraisals?.slice(0, 6).map((appraisal: Appraisal) => (
                  <div key={appraisal.name} className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50">
                    <div>
                      <p className="font-medium text-gray-900">{appraisal.employee_name}</p>
                      <p className="text-xs text-gray-400">{appraisal.start_date} - {appraisal.end_date}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {appraisal.final_score !== undefined && (
                        <span className="text-lg font-bold text-primary-600">{appraisal.final_score}</span>
                      )}
                      <StatusBadge status={appraisal.status} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Goals tab */}
      {activeTab === 'goals' && (
        <DataTable<Goal>
          columns={goalColumns}
          data={goals ?? []}
          isLoading={loadingGoals}
          isError={errorGoals}
          onRetry={refetchGoals}
          emptyMessage="No hay objetivos registrados"
        />
      )}

      {/* New Goal Modal */}
      <Modal
        isOpen={showGoalModal}
        onClose={() => setShowGoalModal(false)}
        title="Nuevo Objetivo"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowGoalModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreateGoal} disabled={createGoalMutation.isPending || !newGoal.employee || !newGoal.goal_name} className="btn-primary">
              {createGoalMutation.isPending ? 'Creando...' : 'Crear Objetivo'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empleado (ID)</label>
              <input className="input" placeholder="HR-EMP-00001" value={newGoal.employee} onChange={(e) => setNewGoal({ ...newGoal, employee: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nombre del Objetivo</label>
              <input className="input" value={newGoal.goal_name} onChange={(e) => setNewGoal({ ...newGoal, goal_name: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">KRA</label>
              <input className="input" placeholder="Key Result Area" value={newGoal.kra} onChange={(e) => setNewGoal({ ...newGoal, kra: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Peso (%)</label>
              <input type="number" className="input" value={newGoal.per_weightage || ''} onChange={(e) => setNewGoal({ ...newGoal, per_weightage: Number(e.target.value) })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Inicio</label>
              <input type="date" className="input" value={newGoal.start_date} onChange={(e) => setNewGoal({ ...newGoal, start_date: e.target.value })} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha Fin</label>
              <input type="date" className="input" value={newGoal.end_date} onChange={(e) => setNewGoal({ ...newGoal, end_date: e.target.value })} />
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
