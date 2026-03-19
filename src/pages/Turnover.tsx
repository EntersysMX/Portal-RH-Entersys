import { useState, useMemo } from 'react';
import { ArrowLeftRight, TrendingUp, TrendingDown, Users } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import { useAllEmployeesAnalytics } from '@/hooks/useFrappe';

export default function Turnover() {
  const { data: employees, isLoading } = useAllEmployeesAnalytics();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);

  const stats = useMemo(() => {
    if (!employees) return null;

    const yearStr = String(year);
    const hires = employees.filter((e) => e.date_of_joining?.startsWith(yearStr));
    const terminations = employees.filter((e) => e.relieving_date?.startsWith(yearStr));
    const active = employees.filter((e) => e.status === 'Active');
    const totalRate = active.length > 0 ? ((terminations.length / active.length) * 100) : 0;

    // Monthly breakdown
    const months = Array.from({ length: 12 }, (_, i) => {
      const m = String(i + 1).padStart(2, '0');
      const prefix = `${yearStr}-${m}`;
      return {
        month: new Date(year, i).toLocaleString('es-MX', { month: 'short' }),
        hires: hires.filter((e) => e.date_of_joining?.startsWith(prefix)).length,
        terminations: terminations.filter((e) => e.relieving_date?.startsWith(prefix)).length,
      };
    });

    // Termination reasons
    const reasons: Record<string, number> = {};
    terminations.forEach((e) => {
      const reason = e.reason_for_leaving || 'Sin especificar';
      reasons[reason] = (reasons[reason] || 0) + 1;
    });

    // By department
    const deptTerms: Record<string, number> = {};
    terminations.forEach((e) => {
      const dept = e.department || 'Sin depto';
      deptTerms[dept] = (deptTerms[dept] || 0) + 1;
    });

    return {
      hiresCount: hires.length,
      termsCount: terminations.length,
      activeCount: active.length,
      rate: totalRate,
      months,
      reasons: Object.entries(reasons).sort((a, b) => b[1] - a[1]),
      deptTerms: Object.entries(deptTerms).sort((a, b) => b[1] - a[1]).slice(0, 8),
    };
  }, [employees, year]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const maxMonthly = stats ? Math.max(...stats.months.map((m) => Math.max(m.hires, m.terminations)), 1) : 1;
  const maxDept = stats?.deptTerms[0]?.[1] ?? 1;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rotación y Retención</h1>
          <p className="mt-1 text-gray-500">Dashboard ejecutivo de movimientos de personal</p>
        </div>
        <select className="input w-auto" value={year} onChange={(e) => setYear(Number(e.target.value))}>
          {[currentYear, currentYear - 1, currentYear - 2].map((y) => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title={`Altas (${year})`} value={stats?.hiresCount ?? 0} icon={TrendingUp} color="green" />
        <StatsCard title={`Bajas (${year})`} value={stats?.termsCount ?? 0} icon={TrendingDown} color="red" />
        <StatsCard title="Activos" value={stats?.activeCount ?? 0} icon={Users} color="blue" />
        <StatsCard title="Tasa Rotación" value={`${(stats?.rate ?? 0).toFixed(1)}%`} icon={ArrowLeftRight} color="orange" />
      </div>

      {/* Monthly chart */}
      <div className="card">
        <h2 className="mb-4 text-lg font-semibold text-gray-900">Altas vs Bajas por Mes</h2>
        {!stats || (stats.hiresCount === 0 && stats.termsCount === 0) ? (
          <p className="py-8 text-center text-gray-400">No hay datos de movimientos para {year}.</p>
        ) : (
          <div className="space-y-2">
            {stats.months.map((m) => (
              <div key={m.month} className="flex items-center gap-3">
                <span className="w-12 text-sm font-medium text-gray-600 capitalize">{m.month}</span>
                <div className="flex flex-1 gap-1">
                  <div className="flex-1">
                    <div className="h-5 rounded-r bg-green-400" style={{ width: `${(m.hires / maxMonthly) * 100}%`, minWidth: m.hires > 0 ? '20px' : '0' }}>
                      {m.hires > 0 && <span className="px-1 text-xs font-bold text-white">{m.hires}</span>}
                    </div>
                  </div>
                  <div className="flex-1">
                    <div className="h-5 rounded-r bg-red-400" style={{ width: `${(m.terminations / maxMonthly) * 100}%`, minWidth: m.terminations > 0 ? '20px' : '0' }}>
                      {m.terminations > 0 && <span className="px-1 text-xs font-bold text-white">{m.terminations}</span>}
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div className="mt-2 flex gap-4 text-xs text-gray-500">
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-green-400" /> Altas</span>
              <span className="flex items-center gap-1"><span className="inline-block h-3 w-3 rounded bg-red-400" /> Bajas</span>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Termination reasons */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Motivos de Baja</h2>
          {stats?.reasons.length === 0 ? (
            <p className="py-8 text-center text-gray-400">Sin datos de motivos de baja.</p>
          ) : (
            <div className="space-y-2">
              {stats?.reasons.map(([reason, count]) => (
                <div key={reason} className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">{reason}</span>
                  <span className={clsx('rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-700')}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Department breakdown */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Bajas por Departamento</h2>
          {stats?.deptTerms.length === 0 ? (
            <p className="py-8 text-center text-gray-400">Sin datos por departamento.</p>
          ) : (
            <div className="space-y-2">
              {stats?.deptTerms.map(([dept, count]) => (
                <div key={dept} className="flex items-center gap-3">
                  <span className="w-36 truncate text-sm font-medium text-gray-700">{dept}</span>
                  <div className="flex-1">
                    <div className="h-5 rounded-r bg-red-400" style={{ width: `${(count / maxDept) * 100}%`, minWidth: '20px' }}>
                      <span className="px-1 text-xs font-bold text-white">{count}</span>
                    </div>
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
