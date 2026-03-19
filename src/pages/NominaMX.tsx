import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  FileText,
  Users,
  BarChart3,
  Download,
  Shield,
  FileSpreadsheet,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, Legend, PieChart, Pie, Cell,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import { calcularNomina, calcularPrestaciones, proyectarNomina, costoAnualEmpleado, generarCFDINomina } from '@/modules/nomina-mx/engine';
import { downloadProyeccionExcel, downloadSimulacionNominaExcel, downloadPrestacionesExcel } from '@/lib/excel/excelGenerator';
import CorridaFinanciera from '@/components/nomina/CorridaFinanciera';
import type { EmpleadoNomina, PeriodoPago, ReciboNomina } from '@/modules/nomina-mx/types';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const ESTADOS_MX = [
  'Aguascalientes','Baja California','Baja California Sur','Campeche','Chiapas',
  'Chihuahua','Ciudad de México','Coahuila','Colima','Durango','Estado de México',
  'Guanajuato','Guerrero','Hidalgo','Jalisco','Michoacán','Morelos','Nayarit',
  'Nuevo León','Oaxaca','Puebla','Querétaro','Quintana Roo','San Luis Potosí',
  'Sinaloa','Sonora','Tabasco','Tamaulipas','Tlaxcala','Veracruz','Yucatán','Zacatecas',
];

const formatMXN = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

export default function NominaMX() {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'proyecciones' | 'prestaciones' | 'corrida'>('calculadora');

  // ================================
  // STATE: Simulador de nómina
  // ================================
  const [empForm, setEmpForm] = useState({
    salarioDiario: 500,
    fechaIngreso: '2023-01-15',
    periodo: 'quincenal' as PeriodoPago,
    estado: 'Ciudad de México',
    tieneInfonavit: false,
    tipoDescInfonavit: 'porcentaje' as const,
    valorDescInfonavit: 0,
  });

  // ================================
  // STATE: Proyecciones
  // ================================
  const [proyForm, setProyForm] = useState({
    numEmpleados: 10,
    salarioPromedio: 500,
    incremento: 5,
    mesIncremento: 7,
    nuevasContrataciones: 2,
    mesContrataciones: 3,
  });

  // ================================
  // Cálculos
  // ================================
  const empleadoDemo: EmpleadoNomina = useMemo(() => ({
    id: 'SIM-001',
    nombre: 'Simulación',
    fecha_ingreso: empForm.fechaIngreso,
    salario_diario: empForm.salarioDiario,
    tipo_contrato: 'Indeterminado',
    tipo_jornada: 'Diurna',
    estado: empForm.estado,
    tiene_infonavit: empForm.tieneInfonavit,
    tipo_descuento_infonavit: empForm.tipoDescInfonavit,
    valor_descuento_infonavit: empForm.valorDescInfonavit,
  }), [empForm]);

  const recibo: ReciboNomina = useMemo(() =>
    calcularNomina({
      empleado: empleadoDemo,
      periodo: empForm.periodo,
      fechaInicio: '2026-01-01',
      fechaFin: empForm.periodo === 'mensual' ? '2026-01-31' : empForm.periodo === 'quincenal' ? '2026-01-15' : '2026-01-07',
    }),
    [empleadoDemo, empForm.periodo]
  );

  const prestaciones = useMemo(() =>
    calcularPrestaciones({
      salarioDiario: empForm.salarioDiario,
      salarioMensual: empForm.salarioDiario * 30,
      fechaIngreso: empForm.fechaIngreso,
    }),
    [empForm.salarioDiario, empForm.fechaIngreso]
  );

  const costoAnual = useMemo(() => costoAnualEmpleado(empleadoDemo), [empleadoDemo]);

  const proyeccion = useMemo(() => {
    const emps: EmpleadoNomina[] = Array.from({ length: proyForm.numEmpleados }, (_, i) => ({
      id: `EMP-${i}`,
      nombre: `Empleado ${i + 1}`,
      fecha_ingreso: '2023-06-01',
      salario_diario: proyForm.salarioPromedio,
      tipo_contrato: 'Indeterminado' as const,
      tipo_jornada: 'Diurna' as const,
      estado: empForm.estado,
      tiene_infonavit: false,
    }));
    return proyectarNomina({
      empleados: emps,
      mesesProyeccion: 12,
      incrementoSalarialPct: proyForm.incremento,
      mesIncrementoSalarial: proyForm.mesIncremento,
      nuevasContrataciones: [{ mes: proyForm.mesContrataciones, cantidad: proyForm.nuevasContrataciones, salarioDiarioPromedio: proyForm.salarioPromedio }],
    });
  }, [proyForm, empForm.estado]);

  // Descargar CFDI XML
  const handleDescargarCFDI = () => {
    const xml = generarCFDINomina(recibo, {
      emisor: { rfc: 'XAXX010101000', nombre: 'Mi Empresa SA de CV', regimen_fiscal: '601', lugar_expedicion: '06600' },
    });
    const blob = new Blob([xml], { type: 'application/xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cfdi-nomina-${recibo.empleado.id}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Desglose para pie chart
  const desgloseCosto = [
    { name: 'Salario Bruto', value: recibo.percepciones.total_percepciones },
    { name: 'IMSS Patrón', value: recibo.costo_empresa.imss_patron },
    { name: 'INFONAVIT Patrón', value: recibo.costo_empresa.infonavit_patron },
    { name: 'ISN', value: recibo.costo_empresa.isn },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Nómina Mexicana</h1>
          <p className="mt-1 text-gray-500">ISR, IMSS, INFONAVIT, CFDI - Cálculo completo conforme a la ley</p>
        </div>
        {activeTab !== 'corrida' && (
          <div className="flex gap-2">
            {activeTab === 'calculadora' && (
              <button
                onClick={() => downloadSimulacionNominaExcel(recibo, costoAnual)}
                className="btn-secondary"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Excel
              </button>
            )}
            {activeTab === 'proyecciones' && (
              <button
                onClick={() => downloadProyeccionExcel(proyeccion, proyForm)}
                className="btn-secondary"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Proyección Excel
              </button>
            )}
            {activeTab === 'prestaciones' && (
              <button
                onClick={() => downloadPrestacionesExcel(prestaciones, empForm.salarioDiario)}
                className="btn-secondary"
              >
                <FileSpreadsheet className="h-4 w-4" />
                Descargar Excel
              </button>
            )}
            <button onClick={handleDescargarCFDI} className="btn-primary">
              <Download className="h-4 w-4" />
              Descargar CFDI XML
            </button>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'calculadora' as const, label: 'Calculadora', icon: Calculator },
            { id: 'proyecciones' as const, label: 'Proyecciones', icon: TrendingUp },
            { id: 'prestaciones' as const, label: 'Prestaciones', icon: FileText },
            { id: 'corrida' as const, label: 'Corrida Financiera', icon: FileSpreadsheet },
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

      {/* ================================ */}
      {/* TAB: CALCULADORA */}
      {/* ================================ */}
      {activeTab === 'calculadora' && (
        <div className="space-y-6">
          {/* Controles */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Simulador de Nómina</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Salario Diario ($)</label>
                <input type="number" className="input" value={empForm.salarioDiario}
                  onChange={(e) => setEmpForm({ ...empForm, salarioDiario: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Fecha Ingreso</label>
                <input type="date" className="input" value={empForm.fechaIngreso}
                  onChange={(e) => setEmpForm({ ...empForm, fechaIngreso: e.target.value })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Periodo de Pago</label>
                <select className="input" value={empForm.periodo}
                  onChange={(e) => setEmpForm({ ...empForm, periodo: e.target.value as PeriodoPago })}>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Estado</label>
                <select className="input" value={empForm.estado}
                  onChange={(e) => setEmpForm({ ...empForm, estado: e.target.value })}>
                  {ESTADOS_MX.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Stats resumen */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatsCard title="Salario Bruto" value={formatMXN(recibo.percepciones.total_percepciones)} icon={DollarSign} color="blue" />
            <StatsCard title="ISR" value={formatMXN(recibo.deducciones.isr)} icon={Calculator} color="red" />
            <StatsCard title="IMSS Empleado" value={formatMXN(recibo.deducciones.imss_trabajador)} icon={Shield} color="orange" />
            <StatsCard title="Neto a Pagar" value={formatMXN(recibo.neto_a_pagar)} icon={DollarSign} color="green" />
            <StatsCard title="Costo Empresa" value={formatMXN(recibo.costo_empresa.total_costo)} icon={BarChart3} color="purple" />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Recibo detallado */}
            <div className="card">
              <h3 className="mb-3 font-semibold text-gray-900">Recibo de Nómina</h3>
              <div className="divide-y divide-gray-100">
                <Section title="PERCEPCIONES" color="green">
                  <Row label="Salario" value={recibo.percepciones.salario} />
                  {recibo.percepciones.horas_extras_dobles > 0 && <Row label="Hrs Extra Dobles" value={recibo.percepciones.horas_extras_dobles} />}
                  <Row label="Total Gravado" value={recibo.percepciones.total_gravado} bold />
                  <Row label="Total Exento" value={recibo.percepciones.total_exento} />
                  <Row label="Total Percepciones" value={recibo.percepciones.total_percepciones} bold highlight="green" />
                </Section>
                <Section title="DEDUCCIONES" color="red">
                  <Row label="ISR (Ret. Art. 96)" value={recibo.deducciones.isr} />
                  <Row label="IMSS Trabajador" value={recibo.deducciones.imss_trabajador} />
                  {recibo.deducciones.infonavit > 0 && <Row label="INFONAVIT" value={recibo.deducciones.infonavit} />}
                  <Row label="Total Deducciones" value={recibo.deducciones.total_deducciones} bold highlight="red" />
                </Section>
                {recibo.subsidio_al_empleo > 0 && (
                  <Section title="OTROS PAGOS" color="blue">
                    <Row label="Subsidio al Empleo" value={recibo.subsidio_al_empleo} />
                  </Section>
                )}
                <div className="py-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">NETO A PAGAR</span>
                    <span className="text-green-600">{formatMXN(recibo.neto_a_pagar)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie chart costo empresa */}
            <div className="space-y-4">
              <div className="card">
                <h3 className="mb-3 font-semibold text-gray-900">Costo Total Empresa</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={desgloseCosto} cx="50%" cy="50%" innerRadius={50} outerRadius={80} paddingAngle={3} dataKey="value">
                      {desgloseCosto.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip formatter={(v: number) => formatMXN(v)} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {desgloseCosto.map((d, i) => (
                    <div key={d.name} className="flex items-center gap-2 text-xs">
                      <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i] }} />
                      <span className="text-gray-500">{d.name}:</span>
                      <span className="font-medium">{formatMXN(d.value)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* SDI e IMSS desglose */}
              <div className="card">
                <h3 className="mb-3 font-semibold text-gray-900">SDI & Factor Integración</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Salario Diario:</span><span className="font-medium">{formatMXN(recibo.detalle_sdi.salario_diario)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Factor Integración:</span><span className="font-medium">{recibo.detalle_sdi.factor_integracion}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">SDI:</span><span className="font-bold text-primary-600">{formatMXN(recibo.detalle_sdi.sdi)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Antigüedad:</span><span>{recibo.detalle_sdi.antiguedad_anios} años</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Días Vacaciones:</span><span>{recibo.detalle_sdi.dias_vacaciones}</span></div>
                </div>
              </div>

              <div className="card">
                <h3 className="mb-3 font-semibold text-gray-900">Costo Anual del Empleado</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Nómina Anual:</span><span>{formatMXN(costoAnual.nomina_anual)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Aguinaldo:</span><span>{formatMXN(costoAnual.aguinaldo)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Prima Vacacional:</span><span>{formatMXN(costoAnual.prima_vacacional)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">IMSS Patrón:</span><span>{formatMXN(costoAnual.imss_patron_anual)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">INFONAVIT:</span><span>{formatMXN(costoAnual.infonavit_anual)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">ISN:</span><span>{formatMXN(costoAnual.isn_anual)}</span></div>
                  <hr className="my-1" />
                  <div className="flex justify-between font-bold"><span>TOTAL ANUAL:</span><span className="text-primary-600">{formatMXN(costoAnual.costo_total_anual)}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* TAB: PROYECCIONES */}
      {/* ================================ */}
      {activeTab === 'proyecciones' && (
        <div className="space-y-6">
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Configurar Proyección a 12 Meses</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Número de Empleados</label>
                <input type="number" className="input" value={proyForm.numEmpleados}
                  onChange={(e) => setProyForm({ ...proyForm, numEmpleados: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Salario Diario Promedio</label>
                <input type="number" className="input" value={proyForm.salarioPromedio}
                  onChange={(e) => setProyForm({ ...proyForm, salarioPromedio: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Incremento Salarial (%)</label>
                <input type="number" className="input" value={proyForm.incremento}
                  onChange={(e) => setProyForm({ ...proyForm, incremento: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mes del Incremento</label>
                <input type="number" min={1} max={12} className="input" value={proyForm.mesIncremento}
                  onChange={(e) => setProyForm({ ...proyForm, mesIncremento: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Nuevas Contrataciones</label>
                <input type="number" className="input" value={proyForm.nuevasContrataciones}
                  onChange={(e) => setProyForm({ ...proyForm, nuevasContrataciones: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Mes de Contratación</label>
                <input type="number" min={1} max={12} className="input" value={proyForm.mesContrataciones}
                  onChange={(e) => setProyForm({ ...proyForm, mesContrataciones: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title="Costo Anual Estimado" value={formatMXN(proyeccion.reduce((s, p) => s + p.total_costo_empresa, 0))} icon={DollarSign} color="purple" />
            <StatsCard title="Nómina Neta Anual" value={formatMXN(proyeccion.reduce((s, p) => s + p.total_neto, 0))} icon={DollarSign} color="green" />
            <StatsCard title="IMSS Patrón Anual" value={formatMXN(proyeccion.reduce((s, p) => s + p.total_imss_patron, 0))} icon={Shield} color="orange" />
            <StatsCard title="Headcount Final" value={proyeccion[proyeccion.length - 1]?.headcount ?? 0} icon={Users} color="blue" />
          </div>

          {/* Gráfica de proyección */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Proyección de Costo Mensual</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={proyeccion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMXN(v)} />
                <Legend />
                <Bar dataKey="total_neto" name="Neto Empleados" fill="#22c55e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_imss_patron" name="IMSS Patrón" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                <Bar dataKey="total_isn" name="ISN" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Evolución del Costo Total</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={proyeccion}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="mes" tick={{ fontSize: 10 }} stroke="#94a3b8" />
                <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(v: number) => formatMXN(v)} />
                <Legend />
                <Line type="monotone" dataKey="total_costo_empresa" name="Costo Total" stroke="#8b5cf6" strokeWidth={3} dot={false} />
                <Line type="monotone" dataKey="total_percepciones" name="Percepciones" stroke="#3b82f6" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* TAB: PRESTACIONES */}
      {/* ================================ */}
      {activeTab === 'prestaciones' && (
        <div className="space-y-6">
          <div className="grid gap-4 sm:grid-cols-3">
            {/* Aguinaldo */}
            <div className="card border-l-4 border-l-green-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <DollarSign className="h-5 w-5 text-green-600" />
                Aguinaldo
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Días:</span><span>{prestaciones.aguinaldo.dias}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Bruto:</span><span>{formatMXN(prestaciones.aguinaldo.monto_bruto)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Exento:</span><span className="text-green-600">{formatMXN(prestaciones.aguinaldo.parte_exenta)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Gravado:</span><span>{formatMXN(prestaciones.aguinaldo.parte_gravada)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ISR:</span><span className="text-red-600">{formatMXN(prestaciones.aguinaldo.isr)}</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Neto:</span><span className="text-green-600">{formatMXN(prestaciones.aguinaldo.neto)}</span></div>
              </div>
            </div>

            {/* Prima Vacacional */}
            <div className="card border-l-4 border-l-blue-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <FileText className="h-5 w-5 text-blue-600" />
                Prima Vacacional
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Días Vacaciones:</span><span>{prestaciones.prima_vacacional.dias_vacaciones}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Tasa:</span><span>{(prestaciones.prima_vacacional.tasa * 100)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Bruto:</span><span>{formatMXN(prestaciones.prima_vacacional.monto_bruto)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Exento:</span><span className="text-green-600">{formatMXN(prestaciones.prima_vacacional.parte_exenta)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">ISR:</span><span className="text-red-600">{formatMXN(prestaciones.prima_vacacional.isr)}</span></div>
                <hr />
                <div className="flex justify-between font-bold"><span>Neto:</span><span className="text-blue-600">{formatMXN(prestaciones.prima_vacacional.neto)}</span></div>
              </div>
            </div>

            {/* Vacaciones */}
            <div className="card border-l-4 border-l-purple-500">
              <h3 className="mb-3 flex items-center gap-2 font-semibold text-gray-900">
                <Users className="h-5 w-5 text-purple-600" />
                Vacaciones
              </h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Días Correspondientes:</span><span className="text-xl font-bold text-purple-600">{prestaciones.vacaciones.dias_correspondientes}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Valor por Día:</span><span>{formatMXN(prestaciones.vacaciones.monto_por_dia)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Total si se pagan:</span><span>{formatMXN(prestaciones.vacaciones.dias_correspondientes * prestaciones.vacaciones.monto_por_dia)}</span></div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">Referencia Legal:</p>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs">
              <li>Aguinaldo: Art. 87 LFT - Mínimo 15 días, exención 30 UMA (Art. 93 XIV LISR)</li>
              <li>Prima Vacacional: Art. 80 LFT - 25% sobre días de vacaciones, exención 15 UMA</li>
              <li>Vacaciones: Art. 76 LFT - Reforma 2023, inicia con 12 días</li>
              <li>PTU: Art. 117-131 LFT - 10% utilidades, tope 3 meses salario</li>
            </ul>
          </div>
        </div>
      )}

      {/* ================================ */}
      {/* TAB: CORRIDA FINANCIERA */}
      {/* ================================ */}
      {activeTab === 'corrida' && <CorridaFinanciera />}
    </div>
  );
}

// Componentes helper para el recibo
function Section({ title, color, children }: { title: string; color: string; children: React.ReactNode }) {
  const colorClass = color === 'green' ? 'text-green-700' : color === 'red' ? 'text-red-700' : 'text-blue-700';
  return (
    <div className="py-3">
      <p className={`mb-2 text-xs font-bold uppercase tracking-wider ${colorClass}`}>{title}</p>
      <div className="space-y-1.5">{children}</div>
    </div>
  );
}

function Row({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: string }) {
  const textClass = highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : 'text-gray-900';
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold' : ''}`}>
      <span className="text-gray-500">{label}</span>
      <span className={textClass}>{formatMXN(value)}</span>
    </div>
  );
}
