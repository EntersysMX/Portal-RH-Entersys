import { GraduationCap, Calendar, Users, CheckCircle2 } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useTrainingEvents } from '@/hooks/useFrappe';
import type { TrainingEvent } from '@/types/frappe';

export default function Training() {
  const { data: events, isLoading } = useTrainingEvents();

  const scheduledCount = events?.filter((e) => e.status === 'Scheduled').length ?? 0;
  const completedCount = events?.filter((e) => e.status === 'Completed').length ?? 0;

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

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : events?.length === 0 ? (
        <div className="card py-12 text-center text-gray-400">
          No hay eventos de capacitación. Crea uno desde el módulo de Capacitación.
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
      )}
    </div>
  );
}
