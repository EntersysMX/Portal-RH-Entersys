import { CalendarDays, GraduationCap, Award } from 'lucide-react';
import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
} from 'recharts';
import type { Employee, Appraisal } from '@/types/frappe';

interface PlayerCardProps {
  employee: Employee;
  appraisals: Appraisal[];
  attendanceRate: number;
  trainingCompleted: number;
}

const DEFAULT_SKILLS = [
  { skill: 'Liderazgo', value: 0 },
  { skill: 'Comunicaci\u00f3n', value: 0 },
  { skill: 'T\u00e9cnico', value: 0 },
  { skill: 'Trabajo en equipo', value: 0 },
  { skill: 'Innovaci\u00f3n', value: 0 },
  { skill: 'Puntualidad', value: 0 },
];

function getInitials(name: string): string {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function getYearsSince(dateStr: string): number {
  const d = new Date(dateStr);
  const now = new Date();
  let years = now.getFullYear() - d.getFullYear();
  const monthDiff = now.getMonth() - d.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < d.getDate())) {
    years--;
  }
  return Math.max(0, years);
}

function formatTenure(dateStr: string): string {
  const years = getYearsSince(dateStr);
  if (years === 0) {
    const d = new Date(dateStr);
    const months = Math.max(
      1,
      (new Date().getFullYear() - d.getFullYear()) * 12 +
        new Date().getMonth() -
        d.getMonth()
    );
    return `${months} mes${months !== 1 ? 'es' : ''}`;
  }
  return `${years} a\u00f1o${years !== 1 ? 's' : ''}`;
}

function attendanceColor(rate: number): string {
  if (rate >= 90) return 'bg-green-100 text-green-700';
  if (rate >= 75) return 'bg-yellow-100 text-yellow-700';
  return 'bg-red-100 text-red-700';
}

export default function PlayerCard({
  employee,
  appraisals,
  attendanceRate,
  trainingCompleted,
}: PlayerCardProps) {
  // Find latest completed appraisal
  const completedAppraisals = appraisals.filter((a) => a.status === 'Completed');
  const latestAppraisal = completedAppraisals[0]; // already sorted by creation desc

  // OVR score: average final_score of completed appraisals (Frappe scores are 0-5, scale to 0-100)
  const ovrScore =
    completedAppraisals.length > 0
      ? Math.round(
          (completedAppraisals.reduce((sum, a) => sum + (a.final_score ?? 0), 0) /
            completedAppraisals.length) *
            20
        )
      : 0;

  // Radar data from latest appraisal goals
  const hasGoals = latestAppraisal?.goals && latestAppraisal.goals.length > 0;
  const radarData = hasGoals
    ? latestAppraisal.goals.map((g) => ({
        skill: g.kra,
        value: Math.round(g.score * 20),
      }))
    : DEFAULT_SKILLS;

  const tenure = formatTenure(employee.date_of_joining);

  return (
    <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
      {/* Header with gradient */}
      <div className="bg-gradient-to-r from-slate-800 via-blue-900 to-blue-800 px-6 py-5">
        <div className="flex items-center gap-4">
          {/* Photo / Avatar */}
          {employee.image ? (
            <img
              src={employee.image}
              alt={employee.employee_name}
              className="h-16 w-16 rounded-full border-2 border-white/30 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-white/30 bg-white/10 text-xl font-bold text-white">
              {getInitials(employee.employee_name)}
            </div>
          )}

          {/* Info */}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-lg font-bold text-white">
              {employee.employee_name}
            </h2>
            <p className="truncate text-sm text-blue-200">
              {employee.designation} &middot; {employee.department}
            </p>
            <p className="text-xs text-blue-300">
              Desde: {employee.date_of_joining} ({tenure})
            </p>
          </div>

          {/* OVR Score */}
          <div className="flex flex-col items-center">
            <span className="text-xs font-medium uppercase tracking-wider text-blue-300">
              OVR
            </span>
            <span className="text-3xl font-black text-white">{ovrScore}</span>
          </div>
        </div>
      </div>

      {/* Radar Chart */}
      <div className="relative px-4 py-4">
        <ResponsiveContainer width="100%" height={250}>
          <RadarChart data={radarData}>
            <PolarGrid stroke="#e2e8f0" />
            <PolarAngleAxis dataKey="skill" tick={{ fontSize: 11, fill: '#64748b' }} />
            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
            <Radar
              dataKey="value"
              stroke={hasGoals ? '#3b82f6' : '#94a3b8'}
              fill={hasGoals ? '#3b82f6' : '#cbd5e1'}
              fillOpacity={0.25}
              strokeWidth={2}
            />
          </RadarChart>
        </ResponsiveContainer>
        {!hasGoals && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="rounded-full bg-gray-100 px-4 py-1.5 text-sm text-gray-500">
              Sin evaluaciones a&uacute;n
            </span>
          </div>
        )}
      </div>

      {/* Achievement Badges */}
      <div className="grid grid-cols-3 gap-3 border-t border-gray-100 px-4 py-4">
        {/* Attendance */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 py-3">
          <div className={`rounded-full p-1.5 ${attendanceColor(attendanceRate)}`}>
            <Award className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-gray-900">{attendanceRate}%</span>
          <span className="text-[11px] text-gray-500">Asistencia</span>
        </div>

        {/* Training */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 py-3">
          <div className="rounded-full bg-purple-100 p-1.5 text-purple-700">
            <GraduationCap className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-gray-900">{trainingCompleted}</span>
          <span className="text-[11px] text-gray-500">Capacitaciones</span>
        </div>

        {/* Tenure */}
        <div className="flex flex-col items-center gap-1 rounded-xl bg-gray-50 py-3">
          <div className="rounded-full bg-blue-100 p-1.5 text-blue-700">
            <CalendarDays className="h-4 w-4" />
          </div>
          <span className="text-lg font-bold text-gray-900">{tenure}</span>
          <span className="text-[11px] text-gray-500">Antig&uuml;edad</span>
        </div>
      </div>
    </div>
  );
}
