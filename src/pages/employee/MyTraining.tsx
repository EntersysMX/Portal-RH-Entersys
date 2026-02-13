import { GraduationCap, Calendar, User, Clock } from 'lucide-react';
import { useTrainingEvents } from '@/hooks/useFrappe';
import StatusBadge from '@/components/ui/StatusBadge';

export default function MyTraining() {
  const { data: events, isLoading } = useTrainingEvents();

  // Categorizar eventos
  const upcoming = events?.filter((e) => e.status === 'Scheduled') ?? [];
  const completed = events?.filter((e) => e.status === 'Completed') ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Capacitación</h1>
        <p className="mt-1 text-gray-500">Cursos y eventos de capacitación disponibles</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="card p-4">
          <p className="text-sm text-gray-500">Próximos eventos</p>
          <p className="text-2xl font-bold text-blue-600">{upcoming.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Completados</p>
          <p className="text-2xl font-bold text-green-600">{completed.length}</p>
        </div>
        <div className="card p-4">
          <p className="text-sm text-gray-500">Total eventos</p>
          <p className="text-2xl font-bold text-gray-900">{events?.length ?? 0}</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : events && events.length > 0 ? (
        <>
          {/* Upcoming */}
          {upcoming.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Próximos Eventos</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {upcoming.map((event) => (
                  <EventCard key={event.name} event={event} />
                ))}
              </div>
            </div>
          )}

          {/* Completed */}
          {completed.length > 0 && (
            <div>
              <h2 className="mb-4 text-lg font-semibold text-gray-900">Eventos Completados</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                {completed.map((event) => (
                  <EventCard key={event.name} event={event} />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="card flex flex-col items-center justify-center py-12">
          <GraduationCap className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Sin eventos</h3>
          <p className="mt-2 text-gray-500">No hay eventos de capacitación disponibles.</p>
        </div>
      )}
    </div>
  );
}

function EventCard({ event }: { event: { name: string; event_name: string; type: string; level: string; status: string; start_time: string; end_time: string; trainer_name?: string; description?: string; employees: { employee: string; employee_name: string }[] } }) {
  return (
    <div className="card p-5">
      <div className="mb-3 flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
          <GraduationCap className="h-5 w-5" />
        </div>
        <StatusBadge status={event.status} />
      </div>

      <h3 className="font-semibold text-gray-900">{event.event_name}</h3>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Calendar className="h-4 w-4" />
          <span>{event.start_time?.split(' ')[0] || event.start_time}</span>
        </div>
        {event.trainer_name && (
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <User className="h-4 w-4" />
            <span>{event.trainer_name}</span>
          </div>
        )}
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Clock className="h-4 w-4" />
          <span>{event.type} &middot; Nivel: {event.level}</span>
        </div>
      </div>

      {event.description && (
        <p className="mt-3 line-clamp-2 text-sm text-gray-500">{event.description}</p>
      )}

      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
        <User className="h-3 w-3" />
        {event.employees?.length ?? 0} participantes
      </div>
    </div>
  );
}
