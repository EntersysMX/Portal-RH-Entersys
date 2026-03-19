import { useMemo } from 'react';
import { PieChart, Users, Clock, DollarSign, Calendar } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import { useAllEmployeesAnalytics, useAllSalarySlipsAnalytics } from '@/hooks/useFrappe';

const GENDER_COLORS: Record<string, string> = {
  Male: 'bg-blue-500',
  Female: 'bg-pink-500',
  Other: 'bg-purple-500',
  'Prefer not to say': 'bg-gray-400',
};

export default function PeopleAnalytics() {
  const { data: employees, isLoading: loadingEmps } = useAllEmployeesAnalytics();
  const { data: slips, isLoading: loadingSlips } = useAllSalarySlipsAnalytics();

  const stats = useMemo(() => {
    if (!employees) return null;

    const active = employees.filter((e) => e.status === 'Active');
    const now = new Date();

    // Age stats
    const ages = active
      .filter((e) => e.date_of_birth)
      .map((e) => {
        const dob = new Date(e.date_of_birth);
        return Math.floor((now.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000));
      });
    const avgAge = ages.length > 0 ? ages.reduce((a, b) => a + b, 0) / ages.length : 0;

    // Tenure stats
    const tenures = active
      .filter((e) => e.date_of_joining)
      .map((e) => {
        const doj = new Date(e.date_of_joining);
        return (now.getTime() - doj.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
      });
    const avgTenure = tenures.length > 0 ? tenures.reduce((a, b) => a + b, 0) / tenures.length : 0;

    // Gender distribution
    const genderDist: Record<string, number> = {};
    active.forEach((e) => {
      const g = e.gender || 'Sin especificar';
      genderDist[g] = (genderDist[g] || 0) + 1;
    });

    // Age ranges
    const ageRanges = [
      { label: '18-25', min: 18, max: 25, count: 0 },
      { label: '26-35', min: 26, max: 35, count: 0 },
      { label: '36-45', min: 36, max: 45, count: 0 },
      { label: '46-55', min: 46, max: 55, count: 0 },
      { label: '56+', min: 56, max: 999, count: 0 },
    ];
    ages.forEach((age) => {
      const range = ageRanges.find((r) => age >= r.min && age <= r.max);
      if (range) range.count++;
    });

    // Department distribution
    const deptDist: Record<string, number> = {};
    active.forEach((e) => {
      const d = e.department || 'Sin depto';
      deptDist[d] = (deptDist[d] || 0) + 1;
    });
    const deptSorted = Object.entries(deptDist).sort((a, b) => b[1] - a[1]).slice(0, 10);

    // Salary stats from slips
    const avgSalary = slips && slips.length > 0
      ? slips.reduce((sum, s) => sum + s.gross_pay, 0) / slips.length
      : 0;
    const totalPayroll = slips?.reduce((sum, s) => sum + s.gross_pay, 0) ?? 0;

    // Salary by department
    const deptSalary: Record<string, { total: number; count: number }> = {};
    slips?.forEach((s) => {
      const d = s.department || 'Sin depto';
      if (!deptSalary[d]) deptSalary[d] = { total: 0, count: 0 };
      deptSalary[d].total += s.gross_pay;
      deptSalary[d].count++;
    });
    const deptAvgSalary = Object.entries(deptSalary)
      .map(([dept, v]) => ({ dept, avg: v.total / v.count }))
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 8);

    return {
      totalActive: active.length,
      avgAge,
      avgTenure,
      avgSalary,
      totalPayroll,
      genderDist: Object.entries(genderDist),
      ageRanges,
      deptSorted,
      deptAvgSalary,
    };
  }, [employees, slips]);

  if (loadingEmps || loadingSlips) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
      </div>
    );
  }

  const maxDept = stats?.deptSorted[0]?.[1] ?? 1;
  const maxDeptSalary = stats?.deptAvgSalary[0]?.avg ?? 1;
  const maxAgeRange = stats ? Math.max(...stats.ageRanges.map((r) => r.count), 1) : 1;
  const totalGender = stats?.genderDist.reduce((s, [, c]) => s + c, 0) ?? 1;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">People Analytics</h1>
        <p className="mt-1 text-gray-500">Panel avanzado de analítica de personas</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-5">
        <StatsCard title="Total Empleados" value={stats?.totalActive ?? 0} icon={Users} color="blue" />
        <StatsCard title="Edad Promedio" value={stats ? `${stats.avgAge.toFixed(1)} años` : '—'} icon={Calendar} color="green" />
        <StatsCard title="Antigüedad Prom." value={stats ? `${stats.avgTenure.toFixed(1)} años` : '—'} icon={Clock} color="purple" />
        <StatsCard title="Sueldo Promedio" value={stats ? `$${Math.round(stats.avgSalary).toLocaleString()}` : '—'} icon={DollarSign} color="orange" />
        <StatsCard title="Costo Planilla" value={stats ? `$${Math.round(stats.totalPayroll).toLocaleString()}` : '—'} icon={PieChart} color="cyan" />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Gender */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Distribución por Género</h2>
          {!stats || stats.genderDist.length === 0 ? (
            <p className="py-8 text-center text-gray-400">Sin datos de género.</p>
          ) : (
            <div className="space-y-3">
              {stats.genderDist.map(([gender, count]) => (
                <div key={gender} className="flex items-center gap-3">
                  <span className="w-32 text-sm font-medium text-gray-700">{gender}</span>
                  <div className="flex-1">
                    <div
                      className={clsx('h-6 rounded-full flex items-center justify-end pr-2 text-xs font-bold text-white', GENDER_COLORS[gender] || 'bg-gray-400')}
                      style={{ width: `${(count / totalGender) * 100}%`, minWidth: '40px' }}
                    >
                      {count} ({((count / totalGender) * 100).toFixed(0)}%)
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Age ranges */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Distribución por Edad</h2>
          <div className="space-y-2">
            {stats?.ageRanges.map((r) => (
              <div key={r.label} className="flex items-center gap-3">
                <span className="w-16 text-sm font-medium text-gray-700">{r.label}</span>
                <div className="flex-1">
                  <div className="h-6 rounded-r bg-blue-400" style={{ width: `${(r.count / maxAgeRange) * 100}%`, minWidth: r.count > 0 ? '30px' : '0' }}>
                    {r.count > 0 && <span className="px-1 text-xs font-bold text-white">{r.count}</span>}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Department headcount */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Empleados por Departamento</h2>
          {stats?.deptSorted.length === 0 ? (
            <p className="py-8 text-center text-gray-400">Sin datos por departamento.</p>
          ) : (
            <div className="space-y-2">
              {stats?.deptSorted.map(([dept, count]) => (
                <div key={dept} className="flex items-center gap-3">
                  <span className="w-36 truncate text-sm font-medium text-gray-700">{dept}</span>
                  <div className="flex-1">
                    <div className="h-5 rounded-r bg-purple-400" style={{ width: `${(count / maxDept) * 100}%`, minWidth: '20px' }}>
                      <span className="px-1 text-xs font-bold text-white">{count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Salary by department */}
        <div className="card">
          <h2 className="mb-4 text-lg font-semibold text-gray-900">Sueldo Promedio por Departamento</h2>
          {stats?.deptAvgSalary.length === 0 ? (
            <p className="py-8 text-center text-gray-400">Sin datos de salarios.</p>
          ) : (
            <div className="space-y-2">
              {stats?.deptAvgSalary.map((d) => (
                <div key={d.dept} className="flex items-center gap-3">
                  <span className="w-36 truncate text-sm font-medium text-gray-700">{d.dept}</span>
                  <div className="flex-1">
                    <div className="h-5 rounded-r bg-green-400" style={{ width: `${(d.avg / maxDeptSalary) * 100}%`, minWidth: '40px' }}>
                      <span className="px-1 text-xs font-bold text-white">${Math.round(d.avg).toLocaleString()}</span>
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
