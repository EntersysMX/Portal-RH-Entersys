import { Building2, ChevronRight } from 'lucide-react';
import { useDepartments, useMyEmployee } from '@/hooks/useFrappe';
import ErrorState from '@/components/ui/ErrorState';

export default function MyOrganization() {
  const { data: departments, isLoading, isError, refetch } = useDepartments();
  const { data: myEmployee } = useMyEmployee();

  // Agrupar departamentos por padre
  const rootDepts = departments?.filter((d) => !d.parent_department || d.parent_department === d.name) ?? [];
  const childDepts = departments?.filter((d) => d.parent_department && d.parent_department !== d.name) ?? [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Organización</h1>
        <p className="mt-1 text-gray-500">Estructura organizacional de la empresa</p>
      </div>

      {/* My position */}
      {myEmployee && (
        <div className="card border-l-4 border-l-primary-500 p-6">
          <h3 className="mb-2 font-semibold text-gray-900">Mi Posición</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div>
              <span className="text-gray-500">Departamento: </span>
              <span className="font-medium text-gray-900">{myEmployee.department || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Puesto: </span>
              <span className="font-medium text-gray-900">{myEmployee.designation || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Reporta a: </span>
              <span className="font-medium text-gray-900">{myEmployee.reports_to || '—'}</span>
            </div>
            <div>
              <span className="text-gray-500">Empresa: </span>
              <span className="font-medium text-gray-900">{myEmployee.company || '—'}</span>
            </div>
          </div>
        </div>
      )}

      {/* Department list */}
      {isLoading ? (
        <div className="flex h-48 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} compact />
      ) : departments && departments.length > 0 ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rootDepts.map((dept) => {
            const children = childDepts.filter((c) => c.parent_department === dept.name);
            const isMyDept = myEmployee?.department === dept.name;

            return (
              <div
                key={dept.name}
                className={`card p-5 ${isMyDept ? 'ring-2 ring-primary-500' : ''}`}
              >
                <div className="mb-3 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${isMyDept ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-600'}`}>
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {dept.department_name || dept.name}
                    </h3>
                    <p className="text-xs text-gray-400">{dept.company}</p>
                  </div>
                </div>

                {isMyDept && (
                  <span className="mb-3 inline-block rounded-full bg-primary-100 px-2 py-0.5 text-xs font-medium text-primary-700">
                    Mi departamento
                  </span>
                )}

                {children.length > 0 && (
                  <div className="space-y-1">
                    {children.map((child) => (
                      <div
                        key={child.name}
                        className="flex items-center gap-2 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-600"
                      >
                        <ChevronRight className="h-3 w-3 text-gray-400" />
                        {child.department_name || child.name}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="card flex flex-col items-center justify-center py-12">
          <Building2 className="h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Sin datos</h3>
          <p className="mt-2 text-gray-500">
            No se encontraron departamentos. Contacta al área de RH.
          </p>
        </div>
      )}
    </div>
  );
}
