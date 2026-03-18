import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  Shield,
  Heart,
  Users,
  Building2,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import { calcularNominaCOL } from '@/modules/nomina-col/engine';
import type { TipoContratoCOL, NivelRiesgoARL } from '@/modules/nomina-col/types';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatCOP = (v: number) =>
  new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(v);

const formatPct = (v: number) => `${(v * 100).toFixed(2)}%`;

export default function NominaCol() {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'seguridad' | 'prestaciones'>('calculadora');

  const [form, setForm] = useState({
    salarioMensual: 4_500_000,
    tipoContrato: 'indefinido' as TipoContratoCOL,
    nivelRiesgoARL: 'I' as NivelRiesgoARL,
    tieneHorasExtras: false,
    horasExtrasDiurnas: 0,
    horasExtrasNocturnas: 0,
  });

  const resultado = useMemo(() => calcularNominaCOL({
    id: 'SIM-001',
    nombre: 'Simulación',
    salarioMensual: form.salarioMensual,
    tipoContrato: form.tipoContrato,
    nivelRiesgoARL: form.nivelRiesgoARL,
    fondoPension: 'Porvenir',
    fondoSalud: 'EPS Sura',
    tieneHorasExtras: form.tieneHorasExtras,
    horasExtrasDiurnas: form.horasExtrasDiurnas,
    horasExtrasNocturnas: form.horasExtrasNocturnas,
  }), [form]);

  // Pie chart data: employee pay distribution
  const desglosePie = [
    { name: 'Neto', value: resultado.netoAPagar },
    { name: 'Salud', value: resultado.deducciones.salud },
    { name: 'Pensión', value: resultado.deducciones.pension },
    { name: 'Retención', value: resultado.deducciones.retencionFuente },
  ].filter((d) => d.value > 0);

  // Pie chart data: employer cost breakdown
  const costoEmpleadorPie = [
    { name: 'Salario', value: resultado.costoEmpleador.salarioBruto },
    { name: 'Salud Emp.', value: resultado.costoEmpleador.saludEmpleador },
    { name: 'Pensión Emp.', value: resultado.costoEmpleador.pensionEmpleador },
    { name: 'ARL', value: resultado.costoEmpleador.arl },
    { name: 'Parafiscales', value: resultado.costoEmpleador.sena + resultado.costoEmpleador.icbf + resultado.costoEmpleador.cajaCompensacion },
    { name: 'Prestaciones', value: resultado.costoEmpleador.prima + resultado.costoEmpleador.cesantias + resultado.costoEmpleador.interesesCesantias + resultado.costoEmpleador.vacaciones },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Nómina Colombia</h1>
        <p className="mt-1 text-gray-500">Retención en la fuente, Seguridad Social, Prestaciones — Tasas 2024</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'calculadora' as const, label: 'Calculadora', icon: Calculator },
            { id: 'seguridad' as const, label: 'Seguridad Social', icon: Shield },
            { id: 'prestaciones' as const, label: 'Prestaciones', icon: PieChartIcon },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: CALCULADORA */}
      {activeTab === 'calculadora' && (
        <div className="space-y-6">
          {/* Form */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Simulador de Nómina</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Salario Mensual (COP)</label>
                <input type="number" className="input" value={form.salarioMensual}
                  onChange={(e) => setForm({ ...form, salarioMensual: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Tipo de Contrato</label>
                <select className="input" value={form.tipoContrato}
                  onChange={(e) => setForm({ ...form, tipoContrato: e.target.value as TipoContratoCOL })}>
                  <option value="indefinido">Indefinido</option>
                  <option value="fijo">Término Fijo</option>
                  <option value="obra_labor">Obra o Labor</option>
                  <option value="prestacion_servicios">Prestación de Servicios</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nivel Riesgo ARL</label>
                <select className="input" value={form.nivelRiesgoARL}
                  onChange={(e) => setForm({ ...form, nivelRiesgoARL: e.target.value as NivelRiesgoARL })}>
                  <option value="I">Nivel I (0.522%)</option>
                  <option value="II">Nivel II (1.044%)</option>
                  <option value="III">Nivel III (2.436%)</option>
                  <option value="IV">Nivel IV (4.350%)</option>
                  <option value="V">Nivel V (6.960%)</option>
                </select>
              </div>
            </div>
            {/* Horas extras toggle */}
            <div className="mt-4 flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input type="checkbox" className="rounded" checked={form.tieneHorasExtras}
                  onChange={(e) => setForm({ ...form, tieneHorasExtras: e.target.checked })} />
                Incluir horas extras
              </label>
            </div>
            {form.tieneHorasExtras && (
              <div className="mt-3 grid grid-cols-2 gap-4 sm:grid-cols-4">
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">HE Diurnas</label>
                  <input type="number" className="input" value={form.horasExtrasDiurnas}
                    onChange={(e) => setForm({ ...form, horasExtrasDiurnas: Number(e.target.value) })} />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-medium text-gray-600">HE Nocturnas</label>
                  <input type="number" className="input" value={form.horasExtrasNocturnas}
                    onChange={(e) => setForm({ ...form, horasExtrasNocturnas: Number(e.target.value) })} />
                </div>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatsCard title="Salario Bruto" value={formatCOP(resultado.totalDevengado)} icon={DollarSign} color="blue" />
            <StatsCard title="Retención" value={formatCOP(resultado.deducciones.retencionFuente)} icon={Calculator} color="red" />
            <StatsCard title="Salud" value={formatCOP(resultado.deducciones.salud)} icon={Heart} color="orange" />
            <StatsCard title="Pensión" value={formatCOP(resultado.deducciones.pension)} icon={Shield} color="purple" />
            <StatsCard title="Neto a Pagar" value={formatCOP(resultado.netoAPagar)} icon={DollarSign} color="green" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recibo detallado */}
            <div className="card">
              <h3 className="mb-3 font-semibold text-gray-900">Recibo de Nómina</h3>
              <div className="divide-y divide-gray-100">
                <div className="py-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-green-700">DEVENGADOS</p>
                  <div className="space-y-1.5">
                    <PayRow label="Salario Mensual" value={resultado.salarioBruto} />
                    {resultado.horasExtras > 0 && <PayRow label="Horas Extras" value={resultado.horasExtras} />}
                    <PayRow label="Total Devengado" value={resultado.totalDevengado} bold highlight="green" />
                  </div>
                </div>
                <div className="py-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-700">DEDUCCIONES</p>
                  <div className="space-y-1.5">
                    <PayRow label="Salud (EPS 4%)" value={resultado.deducciones.salud} />
                    <PayRow label="Pensión (AFP 4%)" value={resultado.deducciones.pension} />
                    <PayRow label="Retención en la Fuente" value={resultado.deducciones.retencionFuente} />
                    <PayRow label="Total Deducciones" value={resultado.deducciones.totalDeducciones} bold highlight="red" />
                  </div>
                </div>
                <div className="py-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">NETO A PAGAR</span>
                    <span className="text-green-600">{formatCOP(resultado.netoAPagar)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie charts */}
            <div className="space-y-4">
              <div className="card">
                <h3 className="mb-3 font-semibold text-gray-900">Distribución del Pago</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={desglosePie} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {desglosePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatCOP(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {desglosePie.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-500">{d.name}:</span>
                      <span className="font-medium">{formatCOP(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Retención detail */}
              <div className="card">
                <h3 className="mb-3 font-semibold text-gray-900">Detalle Retención en la Fuente</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Ingreso en UVT:</span><span>{resultado.detalleRetencion.ingresoEnUVT}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Valor UVT 2024:</span><span>{formatCOP(resultado.detalleRetencion.uvtValor)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Rango:</span><span>{resultado.detalleRetencion.rangoUVT}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tarifa Marginal:</span><span>{formatPct(resultado.detalleRetencion.tarifaMarginal)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Tarifa Efectiva:</span><span>{formatPct(resultado.detalleRetencion.tarifaEfectiva)}</span></div>
                  <hr className="my-1" />
                  <div className="flex justify-between font-bold"><span>Retención:</span><span className="text-red-600">{formatCOP(resultado.detalleRetencion.retencion)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: SEGURIDAD SOCIAL */}
      {activeTab === 'seguridad' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Salud */}
            <div className="card border-l-4 border-l-blue-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Heart className="h-5 w-5 text-blue-600" />
                Salud (EPS)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Empleado ({formatPct(resultado.detalleSeguridadSocial.salud.tasaEmpleado)}):</span><span>{formatCOP(resultado.detalleSeguridadSocial.salud.empleado)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Empleador ({formatPct(resultado.detalleSeguridadSocial.salud.tasaEmpleador)}):</span><span>{formatCOP(resultado.detalleSeguridadSocial.salud.empleador)}</span></div>
              </div>
            </div>

            {/* Pensión */}
            <div className="card border-l-4 border-l-green-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Shield className="h-5 w-5 text-green-600" />
                Pensión (AFP)
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Empleado ({formatPct(resultado.detalleSeguridadSocial.pension.tasaEmpleado)}):</span><span>{formatCOP(resultado.detalleSeguridadSocial.pension.empleado)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Empleador ({formatPct(resultado.detalleSeguridadSocial.pension.tasaEmpleador)}):</span><span>{formatCOP(resultado.detalleSeguridadSocial.pension.empleador)}</span></div>
              </div>
            </div>

            {/* ARL */}
            <div className="card border-l-4 border-l-orange-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Building2 className="h-5 w-5 text-orange-600" />
                ARL (Nivel {resultado.detalleSeguridadSocial.arl.nivel})
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Tasa:</span><span>{formatPct(resultado.detalleSeguridadSocial.arl.tasa)}</span></div>
                <div className="flex justify-between font-semibold"><span>Empleador:</span><span className="text-orange-600">{formatCOP(resultado.detalleSeguridadSocial.arl.empleador)}</span></div>
              </div>
            </div>

            {/* Caja + Parafiscales */}
            <div className="card border-l-4 border-l-purple-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Users className="h-5 w-5 text-purple-600" />
                Caja & Parafiscales
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">CCF (4%):</span><span>{formatCOP(resultado.detalleSeguridadSocial.cajaCompensacion.empleador)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">SENA (2%):</span><span>{formatCOP(resultado.detalleParafiscales.sena)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ICBF (3%):</span><span>{formatCOP(resultado.detalleParafiscales.icbf)}</span></div>
              </div>
            </div>
          </div>

          {/* Summary totals */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="card bg-blue-50">
              <h3 className="mb-3 font-semibold text-blue-900">Total Empleado</h3>
              <p className="text-2xl font-bold text-blue-700">{formatCOP(resultado.detalleSeguridadSocial.totalEmpleado)}</p>
              <p className="mt-1 text-sm text-blue-600">Salud + Pensión = {formatPct(0.08)} del IBC</p>
            </div>
            <div className="card bg-emerald-50">
              <h3 className="mb-3 font-semibold text-emerald-900">Total Empleador</h3>
              <p className="text-2xl font-bold text-emerald-700">{formatCOP(resultado.detalleSeguridadSocial.totalEmpleador + resultado.detalleParafiscales.total)}</p>
              <p className="mt-1 text-sm text-emerald-600">Seg. Social + Parafiscales</p>
            </div>
          </div>

          {/* Employer total cost with pie */}
          <div className="card">
            <h3 className="mb-3 font-semibold text-gray-900">Costo Total Empleador (Mensual)</h3>
            <div className="grid gap-6 lg:grid-cols-2">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={costoEmpleadorPie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {costoEmpleadorPie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCOP(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-2 text-sm">
                {costoEmpleadorPie.map((d, i) => (
                  <div key={d.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-gray-600">{d.name}</span>
                    </div>
                    <span className="font-medium">{formatCOP(d.value)}</span>
                  </div>
                ))}
                <hr />
                <div className="flex justify-between font-bold text-lg">
                  <span>TOTAL</span>
                  <span className="text-primary-600">{formatCOP(resultado.costoEmpleador.totalCosto)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: PRESTACIONES */}
      {activeTab === 'prestaciones' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Prima */}
            <div className="card border-l-4 border-l-green-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <DollarSign className="h-5 w-5 text-green-600" />
                Prima de Servicios
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Base:</span><span>{resultado.detallePrestaciones.prima.diasBase} días/año</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Por semestre:</span><span>{formatCOP(resultado.detallePrestaciones.prima.montoPorPeriodo)}</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Anual:</span><span className="text-green-600">{formatCOP(resultado.detallePrestaciones.prima.montoAnual)}</span></div>
              </div>
            </div>

            {/* Cesantías */}
            <div className="card border-l-4 border-l-blue-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Shield className="h-5 w-5 text-blue-600" />
                Cesantías
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Monto Anual:</span><span>{formatCOP(resultado.detallePrestaciones.cesantias.montoAnual)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tasa Intereses:</span><span>{(resultado.detallePrestaciones.cesantias.tasaIntereses * 100)}%</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Intereses:</span><span className="text-blue-600">{formatCOP(resultado.detallePrestaciones.cesantias.intereses)}</span></div>
              </div>
            </div>

            {/* Vacaciones */}
            <div className="card border-l-4 border-l-purple-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Users className="h-5 w-5 text-purple-600" />
                Vacaciones
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Días Hábiles:</span><span className="text-xl font-bold text-purple-600">{resultado.detallePrestaciones.vacaciones.diasHabiles}</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Valor Anual:</span><span className="text-purple-600">{formatCOP(resultado.detallePrestaciones.vacaciones.montoAnual)}</span></div>
              </div>
            </div>
          </div>

          {resultado.detallePrestaciones.dotacion.aplica && (
            <div className="card border-l-4 border-l-cyan-500">
              <h3 className="mb-2 font-semibold text-gray-900">Dotación</h3>
              <p className="text-sm text-gray-500">Aplica porque el salario es ≤ 2 SMMLV. Estimado anual: <span className="font-semibold text-cyan-600">{formatCOP(resultado.detallePrestaciones.dotacion.montoEstimado)}</span></p>
            </div>
          )}

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">Referencia Legal Colombia:</p>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs">
              <li>Prima de Servicios: Art. 306-308 CST — 1 mes de salario/año, pagado en 2 cuotas</li>
              <li>Cesantías: Art. 249-258 CST — 1 mes de salario/año, consignación a fondo antes del 14 de febrero</li>
              <li>Intereses sobre Cesantías: Ley 52 de 1975 — 12% anual, pago antes del 31 de enero</li>
              <li>Vacaciones: Art. 186-192 CST — 15 días hábiles/año</li>
              <li>Dotación: Art. 230-234 CST — 3 entregas/año si salario ≤ 2 SMMLV</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function PayRow({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: string }) {
  const textClass = highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold' : ''}`}>
      <span className="text-gray-500">{label}</span>
      <span className={textClass}>{formatCOP(value)}</span>
    </div>
  );
}
