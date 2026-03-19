import { Link } from 'react-router-dom';
import {
  BookOpen, CheckCircle2, AlertTriangle, Database,
  FileSpreadsheet, Users, ArrowRight,
} from 'lucide-react';
import { VALIDATION_RULES, EXECUTIVE_DESIGNATIONS } from '@/lib/validation/rules';
import {
  useDepartments,
  useDesignations,
  useCompanies,
  useBranches,
  useEmploymentTypes,
  useEmployees,
} from '@/hooks/useFrappe';
import BrandingSection from '@/components/admin/BrandingSection';

export default function AdminPlatform() {
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const { data: companies } = useCompanies();
  const { data: branches } = useBranches();
  const { data: employmentTypes } = useEmploymentTypes();
  const { data: allEmployees } = useEmployees(undefined, 5000);
  const { data: activeEmployees } = useEmployees({ status: 'Active' }, 5000);
  const { data: inactiveEmployees } = useEmployees({ status: 'Inactive' }, 5000);
  const { data: suspendedEmployees } = useEmployees({ status: 'Suspended' }, 5000);

  const empRules = VALIDATION_RULES.employee;
  const etNames = (employmentTypes ?? []).map((t) => t.name);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Plataforma</h1>
        <p className="mt-1 text-gray-500">Reglas de validación, estado de datos y guía de carga masiva</p>
      </div>

      {/* Section 0: Branding */}
      <BrandingSection />

      {/* Section A: Validation Guide */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Guía de Validaciones</h2>
        </div>

        {/* Required fields */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-gray-700">Campos requeridos (Empleado)</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Campo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Formato / Valores</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Fuente</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {empRules?.required?.map((r) => (
                <tr key={r.field} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{r.label}</td>
                  <td className="px-4 py-2 text-gray-600">
                    {r.validValues ? r.validValues.join(', ') : r.format || '—'}
                  </td>
                  <td className="px-4 py-2">
                    {r.source === 'catalog' ? (
                      <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">Catálogo</span>
                    ) : (
                      <span className="text-gray-400">Manual</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Format validations */}
        <div className="rounded-xl border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-gray-700">Validaciones de formato</h3>
          </div>
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Campo</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Longitud</th>
                <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Descripción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {empRules?.formats?.map((f) => (
                <tr key={f.field} className="hover:bg-gray-50">
                  <td className="px-4 py-2 font-medium text-gray-900">{f.label}</td>
                  <td className="px-4 py-2 text-gray-600">{f.length ? `${f.length} caracteres` : f.format || '—'}</td>
                  <td className="px-4 py-2 text-gray-500">{f.description || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Conditional rules */}
        <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4">
          <div className="flex items-start gap-2">
            <AlertTriangle className="mt-0.5 h-5 w-5 text-yellow-600" />
            <div>
              <h3 className="text-sm font-semibold text-yellow-800">Reglas condicionales</h3>
              {empRules?.conditional?.map((c) => (
                <p key={c.field} className="mt-1 text-sm text-yellow-700">
                  <strong>{c.field}</strong>: {c.description}
                </p>
              ))}
              <p className="mt-2 text-xs text-yellow-600">
                Puestos ejecutivos: {EXECUTIVE_DESIGNATIONS.map((d) => d.charAt(0).toUpperCase() + d.slice(1)).join(', ')}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Section B: Data Health */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <Database className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Estado de Datos</h2>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Departamentos" count={departments?.length ?? 0} />
          <StatCard label="Puestos" count={designations?.length ?? 0} />
          <StatCard label="Empresas" count={companies?.length ?? 0} />
          <StatCard label="Sucursales" count={branches?.length ?? 0} />
          <StatCard label="Tipos Empleo" count={employmentTypes?.length ?? 0} />
        </div>

        <Link to="/admin/catalogs" className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
          Gestionar catálogos <ArrowRight className="h-4 w-4" />
        </Link>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-xl border border-gray-200 p-4 text-center">
            <Users className="mx-auto h-6 w-6 text-gray-400" />
            <p className="mt-2 text-2xl font-bold text-gray-900">{allEmployees?.length ?? 0}</p>
            <p className="text-xs text-gray-500">Total Empleados</p>
          </div>
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-center">
            <CheckCircle2 className="mx-auto h-6 w-6 text-green-500" />
            <p className="mt-2 text-2xl font-bold text-green-700">{activeEmployees?.length ?? 0}</p>
            <p className="text-xs text-green-600">Activos</p>
          </div>
          <div className="rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-yellow-500" />
            <p className="mt-2 text-2xl font-bold text-yellow-700">{inactiveEmployees?.length ?? 0}</p>
            <p className="text-xs text-yellow-600">Inactivos</p>
          </div>
          <div className="rounded-xl border border-orange-200 bg-orange-50 p-4 text-center">
            <AlertTriangle className="mx-auto h-6 w-6 text-orange-500" />
            <p className="mt-2 text-2xl font-bold text-orange-700">{suspendedEmployees?.length ?? 0}</p>
            <p className="text-xs text-orange-600">Suspendidos</p>
          </div>
        </div>
      </section>

      {/* Section C: Bulk Upload Tips */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-primary-600" />
          <h2 className="text-lg font-semibold text-gray-900">Tips para Carga Masiva</h2>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-3">
          <TipItem title="Fechas" text="Usar formato AAAA-MM-DD (ejemplo: 2024-03-15). Excel puede auto-convertir, verificar." />
          <TipItem title="Género" text="Valores válidos: Male, Female, Other (en inglés, sensible a mayúsculas)." />
          <TipItem
            title="Tipos de Empleo"
            text={`Valores registrados en BD: ${etNames.length > 0 ? etNames.join(', ') : 'Ninguno aún — crear en Catálogos'}.`}
          />
          <TipItem
            title="reports_to"
            text="Usar el ID del empleado (ej: HR-EMP-00001). Dejar vacío para CEO, Presidente, Director General — no generará error."
          />
          <TipItem title="Catálogos" text="Si un departamento, puesto, empresa o sucursal no existe, se creará automáticamente durante la importación." />
          <TipItem title="Errores vs Warnings" text="Solo los errores bloquean la importación. Los warnings se muestran pero el registro sí se importa." />
        </div>
      </section>
    </div>
  );
}

function StatCard({ label, count }: { label: string; count: number }) {
  return (
    <div className="rounded-xl border border-gray-200 p-4 text-center">
      <p className="text-2xl font-bold text-gray-900">{count}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}

function TipItem({ title, text }: { title: string; text: string }) {
  return (
    <div className="flex items-start gap-2">
      <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-500" />
      <p className="text-sm text-blue-800">
        <strong>{title}:</strong> {text}
      </p>
    </div>
  );
}
