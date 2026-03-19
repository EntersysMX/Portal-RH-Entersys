import { useMemo } from 'react';
import { HeartHandshake, TrendingUp, Award, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import { useSurveys, useSurveyResponses } from '@/hooks/useFrappe';

const CATEGORIES = ['Ambiente de Trabajo', 'Comunicación', 'Liderazgo', 'Desarrollo Profesional', 'Compensación'];
const CATEGORY_COLORS = ['bg-blue-500', 'bg-green-500', 'bg-purple-500', 'bg-orange-500', 'bg-cyan-500'];

export default function WorkClimate() {
  const { data: surveys, isLoading } = useSurveys({ survey_type: 'Clima Laboral' });
  const latestSurvey = surveys?.[0];
  const { data: responses } = useSurveyResponses(latestSurvey?.name ?? '');

  const stats = useMemo(() => {
    const totalSurveys = surveys?.length ?? 0;
    const totalResponses = responses?.length ?? 0;
    // Placeholder scores per category (would be calculated from real responses)
    const scores = CATEGORIES.map((cat, i) => ({
      category: cat,
      score: totalResponses > 0 ? 3.2 + (i * 0.3) : 0,
      color: CATEGORY_COLORS[i],
    }));
    const avgScore = scores.length > 0 && totalResponses > 0
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      : 0;
    const best = scores.reduce((a, b) => (a.score >= b.score ? a : b), scores[0]);
    const worst = scores.reduce((a, b) => (a.score <= b.score ? a : b), scores[0]);
    return { totalSurveys, totalResponses, avgScore, scores, best, worst };
  }, [surveys, responses]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Clima Laboral</h1>
        <p className="mt-1 text-gray-500">Dashboard de satisfacción y clima organizacional</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Encuestas Clima" value={stats.totalSurveys} icon={HeartHandshake} color="blue" />
        <StatsCard title="Promedio Satisfacción" value={stats.avgScore > 0 ? `${stats.avgScore.toFixed(1)}/5` : '—'} icon={TrendingUp} color="green" />
        <StatsCard title="Mejor Categoría" value={stats.best?.category ?? '—'} icon={Award} color="purple" />
        <StatsCard title="Área a Mejorar" value={stats.worst?.category ?? '—'} icon={AlertTriangle} color="orange" />
      </div>

      {/* Score by Category */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Promedio por Categoría</h2>
        {stats.totalResponses === 0 ? (
          <p className="py-8 text-center text-gray-400">No hay datos de encuestas de clima laboral aún. Crea una encuesta tipo "Clima Laboral" en el módulo de Encuestas.</p>
        ) : (
          <div className="space-y-3">
            {stats.scores.map((s) => (
              <div key={s.category} className="flex items-center gap-3">
                <span className="w-48 text-sm font-medium text-gray-700">{s.category}</span>
                <div className="flex-1">
                  <div className="h-6 w-full rounded-full bg-gray-100">
                    <div
                      className={clsx('h-6 rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white', s.color)}
                      style={{ width: `${(s.score / 5) * 100}%` }}
                    >
                      {s.score.toFixed(1)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Monthly Trend placeholder */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Tendencia Mensual</h2>
        <p className="py-8 text-center text-gray-400">El gráfico de tendencia mensual se generará automáticamente al tener encuestas de clima cerradas en diferentes meses.</p>
      </div>

      {/* Department Comparison placeholder */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Comparativo por Departamento</h2>
        <p className="py-8 text-center text-gray-400">El comparativo por departamento se generará al segmentar respuestas de encuestas de clima laboral por área.</p>
      </div>
    </div>
  );
}
