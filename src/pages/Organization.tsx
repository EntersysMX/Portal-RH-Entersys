import { Building2, Users, GitBranch } from 'lucide-react';
import { useDepartments, useEmployees } from '@/hooks/useFrappe';
import type { Department } from '@/types/frappe';

export default function Organization() {
  const { data: departments, isLoading } = useDepartments();
  const { data: employees } = useEmployees(undefined, 200);

  const getEmployeeCount = (dept: string) =>
    employees?.filter((e) => e.department === dept).length ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organización</h1>
        <p className="mt-1 text-gray-500">Estructura organizacional y departamentos</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="card text-center">
          <Building2 className="mx-auto h-8 w-8 text-primary-600" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{departments?.length ?? 0}</p>
          <p className="text-sm text-gray-500">Departamentos</p>
        </div>
        <div className="card text-center">
          <Users className="mx-auto h-8 w-8 text-green-600" />
          <p className="mt-2 text-2xl font-bold text-gray-900">{employees?.length ?? 0}</p>
          <p className="text-sm text-gray-500">Empleados Totales</p>
        </div>
        <div className="card text-center">
          <GitBranch className="mx-auto h-8 w-8 text-purple-600" />
          <p className="mt-2 text-2xl font-bold text-gray-900">
            {departments?.filter((d) => d.is_group).length ?? 0}
          </p>
          <p className="text-sm text-gray-500">Grupos</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {departments?.map((dept: Department) => (
            <div key={dept.name} className="card transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary-50">
                  <Building2 className="h-5 w-5 text-primary-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">
                    {dept.department_name || dept.name}
                  </h3>
                  {dept.parent_department && (
                    <p className="text-xs text-gray-400">Parte de: {dept.parent_department}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1 text-sm text-gray-500">
                  <Users className="h-4 w-4" />
                  {getEmployeeCount(dept.name)} empleados
                </div>
                {dept.is_group && (
                  <span className="badge-info">Grupo</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
