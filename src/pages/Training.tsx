import { useState } from 'react';
import { GraduationCap, Calendar, Users, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import DataTable, { type Column } from '@/components/ui/DataTable';
import ErrorState from '@/components/ui/ErrorState';
import { useTrainingEvents, useTrainingPrograms, useTrainingResults } from '@/hooks/useFrappe';
import type { TrainingEvent, TrainingProgram, TrainingResult } from '@/types/frappe';

type Tab = 'events' | 'programs' | 'results';

const TABS: { id: Tab; label: string }[] = [
  { id: 'events', label: 'Eventos' },
  { id: 'programs', label: 'Programas' },
  { id: 'results', label: 'Resultados' },
];

export default function Training() {
  const [activeTab, setActiveTab] = useState<Tab>('events');

  const { data: events, isLoading: loadingEvents, isError: errorEvents, refetch: refetchEvents } = useTrainingEvents();
  const { data: programs, isLoading: loadingPrograms, isError: errorPrograms, refetch: refetchPrograms } = useTrainingPrograms();
  const { data: results, isLoading: loadingResults, isError: errorResults, refetch: refetchResults } = useTrainingResults();

  const scheduledCount = events?.filter((e) => e.status === 'Scheduled').length ?? 0;
  const completedCount = events?.filter((e) => e.status === 'Completed').length ?? 0;

  const programColumns: Column<TrainingProgram>[] = [
    { key: 'name', header: 'Nombre' },
    { key: 'trainer_name', header: 'Instructor' },
    { key: 'supplier', header: 'Proveedor' },
    { key: 'status', header: 'Estado', render: (p) => <StatusBadge status={p.status} /> },
  ];

  const resultColumns: Column<TrainingResult>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employee_name}</p>
          <p className="text-xs text-gray-400">{r.employee}</p>
        </div>
      ),
    },
    { key: 'training_event', header: 'Evento' },
    { key: 'hours', header: 'Horas' },
    { key: 'grade', header: 'Calificación' },
    {
      key: 'result',
      header: 'Resultado',
      render: (r) => (
        <span className={clsx(
          'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium',
          r.result === 'Pass' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
        )}>
          {r.result === 'Pass' ? 'Aprobado' : 'Reprobado'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Capacitación</h1>
        <p className="mt-1 text-gray-500">Programas de formación y desarrollo</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Total Eventos" value={events?.length ?? 0} icon={GraduationCap} color="blue" />
        <StatsCard title="Programados" value={scheduledCount} icon={Calendar} color="orange" />
        <StatsCard title="Completados" value={completedCount} icon={CheckCircle2} color="green" />
        <StatsCard title="Participantes" value={events?.reduce((s, e) => s + (e.employees?.length ?? 0), 0) ?? 0} icon={Users} color="purple" />
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

      {/* Events tab - original card view */}
      {activeTab === 'events' && (
        loadingEvents ? (
          <div className="flex h-40 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
          </div>
        ) : errorEvents ? (
          <ErrorState onRetry={refetchEvents} compact />
        ) : events?.length === 0 ? (
          <div className="card py-12 text-center text-gray-400">
            No hay eventos de capacitación.
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {events?.map((event: TrainingEvent) => (
              <div key={event.name} className="card transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{event.event_name}</h3>
                  <StatusBadge status={event.status} />
                </div>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>Tipo: {event.type}</p>
                  <p>Nivel: {event.level}</p>
                  {event.trainer_name && <p>Instructor: {event.trainer_name}</p>}
                  <p>Inicio: {event.start_time}</p>
                  <p>Fin: {event.end_time}</p>
                </div>
                {event.employees?.length > 0 && (
                  <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
                    <Users className="h-3 w-3" />
                    {event.employees.length} participante(s)
                  </div>
                )}
              </div>
            ))}
          </div>
        )
      )}

      {/* Programs tab */}
      {activeTab === 'programs' && (
        <DataTable<TrainingProgram>
          columns={programColumns}
          data={programs ?? []}
          isLoading={loadingPrograms}
          isError={errorPrograms}
          onRetry={refetchPrograms}
          emptyMessage="No hay programas de capacitación registrados"
        />
      )}

      {/* Results tab */}
      {activeTab === 'results' && (
        <DataTable<TrainingResult>
          columns={resultColumns}
          data={results ?? []}
          isLoading={loadingResults}
          isError={errorResults}
          onRetry={refetchResults}
          emptyMessage="No hay resultados de capacitación registrados"
        />
      )}
    </div>
  );
}
