import { useState } from 'react';
import { Star, Plus, Trash2, Users, Award, BarChart } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import Modal from '@/components/ui/Modal';
import ErrorState from '@/components/ui/ErrorState';
import RoleGuard from '@/components/auth/RoleGuard';
import { useSkillMaps, useCreateSkillMap } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { EmployeeSkillMap } from '@/types/frappe';

interface SkillRow {
  skill: string;
  proficiency: number;
}

const PROFICIENCY_COLORS: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-red-400',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-green-500',
};

const PROFICIENCY_BG: Record<number, string> = {
  1: 'bg-red-100 text-red-700',
  2: 'bg-red-100 text-red-700',
  3: 'bg-yellow-100 text-yellow-700',
  4: 'bg-blue-100 text-blue-700',
  5: 'bg-green-100 text-green-700',
};

const emptySkillRow: SkillRow = { skill: '', proficiency: 3 };

export default function Skills() {
  const { data: maps, isLoading, isError, refetch } = useSkillMaps();
  const createMutation = useCreateSkillMap();

  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    employee: '',
    employee_name: '',
    designation: '',
    department: '',
  });
  const [skills, setSkills] = useState<SkillRow[]>([{ ...emptySkillRow }]);

  // Stats calculations
  const totalMaps = maps?.length ?? 0;

  const uniqueSkills = new Set(
    maps?.flatMap((m) => m.employee_skills?.map((s) => s.skill) ?? []) ?? []
  ).size;

  const allProficiencies = maps?.flatMap(
    (m) => m.employee_skills?.map((s) => s.proficiency) ?? []
  ) ?? [];
  const avgProficiency =
    allProficiencies.length > 0
      ? (allProficiencies.reduce((sum, p) => sum + p, 0) / allProficiencies.length).toFixed(1)
      : '0';

  const uniqueDepartments = new Set(
    maps?.map((m) => m.department).filter(Boolean) ?? []
  ).size;

  // Skill rows management
  const addSkillRow = () => setSkills([...skills, { ...emptySkillRow }]);

  const removeSkillRow = (index: number) => {
    if (skills.length === 1) return;
    setSkills(skills.filter((_, i) => i !== index));
  };

  const updateSkillRow = (index: number, field: keyof SkillRow, value: string | number) => {
    setSkills(skills.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  };

  const resetForm = () => {
    setForm({ employee: '', employee_name: '', designation: '', department: '' });
    setSkills([{ ...emptySkillRow }]);
  };

  const handleCreate = async () => {
    const validSkills = skills.filter((s) => s.skill.trim());
    if (validSkills.length === 0) {
      toast.warning('Sin habilidades', 'Agrega al menos una habilidad con nombre.');
      return;
    }
    try {
      await createMutation.mutateAsync({
        ...form,
        employee_skills: validSkills.map((s) => ({
          skill: s.skill.trim(),
          proficiency: Number(s.proficiency),
        })),
      } as Partial<EmployeeSkillMap>);
      toast.success('Mapa creado', 'El mapa de habilidades se registró correctamente.');
      setShowModal(false);
      resetForm();
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habilidades</h1>
          <p className="mt-1 text-gray-500">Mapa de competencias y habilidades del personal</p>
        </div>
        <RoleGuard section="skills" action="create">
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Mapa
          </button>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Mapas" value={totalMaps} icon={Star} color="blue" />
        <StatsCard title="Habilidades Unicas" value={uniqueSkills} icon={Award} color="purple" />
        <StatsCard title="Promedio Competencia" value={avgProficiency} icon={BarChart} color="green" />
        <StatsCard title="Departamentos" value={uniqueDepartments} icon={Users} color="orange" />
      </div>

      {/* Main content */}
      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} compact />
      ) : maps?.length === 0 ? (
        <div className="card py-12 text-center text-gray-400">
          No hay mapas de habilidades registrados.
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {maps?.map((map: EmployeeSkillMap) => (
            <div key={map.name} className="card transition-shadow hover:shadow-md">
              <div className="mb-3">
                <h3 className="font-semibold text-gray-900">{map.employee_name}</h3>
                <div className="mt-1 space-y-0.5 text-sm text-gray-500">
                  {map.designation && <p>{map.designation}</p>}
                  {map.department && <p>{map.department}</p>}
                </div>
              </div>

              {map.employee_skills?.length > 0 ? (
                <div className="space-y-2.5">
                  {map.employee_skills.map((skill, idx) => (
                    <div key={`${map.name}-${skill.skill}-${idx}`}>
                      <div className="mb-1 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-semibold ${PROFICIENCY_BG[skill.proficiency] || PROFICIENCY_BG[3]}`}
                        >
                          {skill.proficiency}
                        </span>
                      </div>
                      <div className="h-2 w-full overflow-hidden rounded-full bg-gray-100">
                        <div
                          className={`h-full rounded-full transition-all ${PROFICIENCY_COLORS[skill.proficiency] || PROFICIENCY_COLORS[3]}`}
                          style={{ width: `${(skill.proficiency / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400">Sin habilidades registradas</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Create Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nuevo Mapa de Habilidades"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              disabled={createMutation.isPending || !form.employee}
              className="btn-primary"
            >
              {createMutation.isPending ? 'Guardando...' : 'Crear Mapa'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          {/* Employee info */}
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">ID Empleado</label>
              <input
                className="input"
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
                placeholder="HR-EMP-00001"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Nombre Empleado
              </label>
              <input
                className="input"
                value={form.employee_name}
                onChange={(e) => setForm({ ...form, employee_name: e.target.value })}
                placeholder="Nombre completo"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Puesto</label>
              <input
                className="input"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                placeholder="Ej. Desarrollador Senior"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Departamento
              </label>
              <input
                className="input"
                value={form.department}
                onChange={(e) => setForm({ ...form, department: e.target.value })}
                placeholder="Ej. Ingenieria"
              />
            </div>
          </div>

          {/* Skills section */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Habilidades</label>
              <button
                type="button"
                onClick={addSkillRow}
                className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700"
              >
                <Plus className="h-3.5 w-3.5" />
                Agregar habilidad
              </button>
            </div>
            <div className="space-y-2">
              {skills.map((row, index) => (
                <div key={index} className="flex items-center gap-2">
                  <input
                    className="input flex-1"
                    value={row.skill}
                    onChange={(e) => updateSkillRow(index, 'skill', e.target.value)}
                    placeholder="Nombre de la habilidad"
                  />
                  <select
                    className="input w-20"
                    value={row.proficiency}
                    onChange={(e) => updateSkillRow(index, 'proficiency', Number(e.target.value))}
                  >
                    <option value={1}>1</option>
                    <option value={2}>2</option>
                    <option value={3}>3</option>
                    <option value={4}>4</option>
                    <option value={5}>5</option>
                  </select>
                  <button
                    type="button"
                    onClick={() => removeSkillRow(index)}
                    disabled={skills.length === 1}
                    className="rounded p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-30"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
}
