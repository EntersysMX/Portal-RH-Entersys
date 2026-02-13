import { Target, Award, TrendingUp, BarChart3 } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import { useAppraisals } from '@/hooks/useFrappe';
import type { Appraisal } from '@/types/frappe';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';

const demoRadarData = [
  { skill: 'Liderazgo', value: 85 },
  { skill: 'Comunicación', value: 90 },
  { skill: 'Técnico', value: 78 },
  { skill: 'Trabajo en equipo', value: 92 },
  { skill: 'Innovación', value: 70 },
  { skill: 'Puntualidad', value: 88 },
];

export default function Performance() {
  const { data: appraisals, isLoading } = useAppraisals();

  const completedCount = appraisals?.filter((a) => a.status === 'Completed').length ?? 0;
  const avgScore =
    appraisals && appraisals.length > 0
      ? (appraisals.reduce((sum, a) => sum + (a.final_score ?? 0), 0) / appraisals.length).toFixed(1)
      : '0';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Performance</h1>
        <p className="mt-1 text-gray-500">Evaluaciones de desempeño y objetivos</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Evaluaciones Activas" value={appraisals?.length ?? 0} icon={Target} color="blue" />
        <StatsCard title="Completadas" value={completedCount} icon={Award} color="green" />
        <StatsCard title="Promedio General" value={avgScore} icon={TrendingUp} color="purple" />
        <StatsCard title="En Revisión" value={(appraisals?.length ?? 0) - completedCount} icon={BarChart3} color="orange" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Radar Chart */}
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Competencias Promedio
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={demoRadarData}>
              <PolarGrid stroke="#e2e8f0" />
              <PolarAngleAxis dataKey="skill" tick={{ fontSize: 12 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
              <Radar
                dataKey="value"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.2}
                strokeWidth={2}
              />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Recent Appraisals */}
        <div className="card">
          <h3 className="mb-4 text-base font-semibold text-gray-900">
            Evaluaciones Recientes
          </h3>
          {isLoading ? (
            <div className="flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : appraisals?.length === 0 ? (
            <p className="py-8 text-center text-gray-400">
              No hay evaluaciones. Configura ciclos de evaluación desde el módulo de Performance.
            </p>
          ) : (
            <div className="space-y-3">
              {appraisals?.slice(0, 6).map((appraisal: Appraisal) => (
                <div
                  key={appraisal.name}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3 transition-colors hover:bg-gray-50"
                >
                  <div>
                    <p className="font-medium text-gray-900">{appraisal.employee_name}</p>
                    <p className="text-xs text-gray-400">
                      {appraisal.start_date} - {appraisal.end_date}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    {appraisal.final_score !== undefined && (
                      <span className="text-lg font-bold text-primary-600">
                        {appraisal.final_score}
                      </span>
                    )}
                    <StatusBadge status={appraisal.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
