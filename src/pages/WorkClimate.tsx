import { useMemo } from 'react';
import { HeartHandshake, TrendingUp, Award, AlertTriangle, Users, BarChart3 } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import { useSurveys, useSurveyResponses } from '@/hooks/useFrappe';

const BAR_COLORS = [
  'bg-blue-500',
  'bg-green-500',
  'bg-purple-500',
  'bg-orange-500',
  'bg-cyan-500',
  'bg-rose-500',
  'bg-amber-500',
  'bg-indigo-500',
  'bg-teal-500',
  'bg-fuchsia-500',
];

export default function WorkClimate() {
  const { data: surveys, isLoading } = useSurveys({ survey_type: 'Clima Laboral' });
  const latestSurvey = surveys?.[0];
  const { data: responses } = useSurveyResponses(latestSurvey?.name ?? '');

  const stats = useMemo(() => {
    const totalSurveys = surveys?.length ?? 0;
    const totalResponses = responses?.length ?? 0;

    // Get likert questions from the latest survey — these are the "categories" to score
    const likertQuestions = latestSurvey?.questions?.filter(
      (q) => q.question_type === 'likert'
    ) ?? [];

    // Calculate real scores from actual response data
    const scores = likertQuestions.map((q, i) => {
      const answers = (responses ?? [])
        .map((r) => {
          const a = r.answers?.find((ans) => ans.question_idx === q.idx);
          return a ? Number(a.answer) : NaN;
        })
        .filter((v) => !isNaN(v) && v >= 1 && v <= 5);

      const avg = answers.length > 0
        ? answers.reduce((sum, v) => sum + v, 0) / answers.length
        : 0;

      return {
        category: q.question_text,
        score: avg,
        count: answers.length,
        color: BAR_COLORS[i % BAR_COLORS.length],
      };
    });

    const validScores = scores.filter((s) => s.score > 0);
    const avgScore = validScores.length > 0
      ? validScores.reduce((sum, s) => sum + s.score, 0) / validScores.length
      : 0;

    const best = validScores.length > 0
      ? validScores.reduce((a, b) => (a.score >= b.score ? a : b))
      : null;
    const worst = validScores.length > 0
      ? validScores.reduce((a, b) => (a.score <= b.score ? a : b))
      : null;

    return { totalSurveys, totalResponses, avgScore, scores, best, worst };
  }, [surveys, responses, latestSurvey]);

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
        <StatsCard
          title="Promedio Satisfacción"
          value={stats.avgScore > 0 ? `${stats.avgScore.toFixed(1)}/5` : '—'}
          icon={TrendingUp}
          color="green"
        />
        <StatsCard
          title="Mejor Categoría"
          value={stats.best?.category ?? '—'}
          icon={Award}
          color="purple"
        />
        <StatsCard
          title="Área a Mejorar"
          value={stats.worst?.category ?? '—'}
          icon={AlertTriangle}
          color="orange"
        />
      </div>

      {/* Latest Survey Info */}
      {latestSurvey && (
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-gray-900">{latestSurvey.title}</h2>
              <p className="text-sm text-gray-500">
                Estado: <span className={clsx(
                  'rounded-full px-2 py-0.5 text-xs font-medium',
                  latestSurvey.status === 'Active' ? 'bg-green-100 text-green-700'
                    : latestSurvey.status === 'Closed' ? 'bg-gray-100 text-gray-600'
                    : 'bg-yellow-100 text-yellow-700'
                )}>{latestSurvey.status}</span>
                {latestSurvey.end_date && <span className="ml-2 text-gray-400">Vence: {latestSurvey.end_date}</span>}
              </p>
            </div>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span className="flex items-center gap-1">
                <Users className="h-4 w-4" />
                {stats.totalResponses} respuesta{stats.totalResponses !== 1 ? 's' : ''}
              </span>
              <span className="flex items-center gap-1">
                <BarChart3 className="h-4 w-4" />
                {latestSurvey.questions?.length ?? 0} pregunta{(latestSurvey.questions?.length ?? 0) !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Score by Question (real data) */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Promedio por Pregunta (Likert)</h2>
        {stats.scores.length === 0 ? (
          <p className="py-8 text-center text-gray-400">
            {!latestSurvey
              ? 'No hay encuestas de clima laboral aún. Crea una encuesta tipo "Clima Laboral" en el módulo de Encuestas.'
              : 'La encuesta de clima laboral no tiene preguntas tipo Likert (escala 1-5). Agrega preguntas Likert para ver los puntajes.'}
          </p>
        ) : stats.totalResponses === 0 ? (
          <p className="py-8 text-center text-gray-400">
            Aún no hay respuestas para la encuesta "{latestSurvey?.title}". Los puntajes aparecerán cuando los empleados respondan.
          </p>
        ) : (
          <div className="space-y-3">
            {stats.scores.map((s) => (
              <div key={s.category} className="flex items-center gap-3">
                <span className="w-56 flex-shrink-0 truncate text-sm font-medium text-gray-700" title={s.category}>
                  {s.category}
                </span>
                <div className="flex-1">
                  <div className="h-6 w-full rounded-full bg-gray-100">
                    {s.score > 0 ? (
                      <div
                        className={clsx('h-6 rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white', s.color)}
                        style={{ width: `${(s.score / 5) * 100}%`, minWidth: '2.5rem' }}
                      >
                        {s.score.toFixed(1)}
                      </div>
                    ) : (
                      <div className="flex h-6 items-center pl-2 text-xs text-gray-400">Sin datos</div>
                    )}
                  </div>
                </div>
                <span className="w-16 text-right text-xs text-gray-400">
                  {s.count} resp.
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* All Climate Surveys */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Historial de Encuestas de Clima</h2>
        {(surveys?.length ?? 0) === 0 ? (
          <p className="py-8 text-center text-gray-400">No hay encuestas de clima laboral registradas.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Título</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Estado</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Preguntas</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Vencimiento</th>
                  <th className="px-4 py-2 text-left font-medium text-gray-500">Anónima</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {surveys?.map((s) => (
                  <tr key={s.name} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-medium text-gray-900">{s.title}</td>
                    <td className="px-4 py-2">
                      <span className={clsx(
                        'rounded-full px-2 py-0.5 text-xs font-medium',
                        s.status === 'Active' ? 'bg-green-100 text-green-700'
                          : s.status === 'Closed' ? 'bg-gray-100 text-gray-600'
                          : 'bg-yellow-100 text-yellow-700'
                      )}>{s.status}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{s.questions?.length ?? 0}</td>
                    <td className="px-4 py-2 text-gray-600">{s.end_date || '—'}</td>
                    <td className="px-4 py-2 text-gray-600">{s.is_anonymous ? 'Sí' : 'No'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
