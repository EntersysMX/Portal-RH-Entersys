import { useState, useMemo } from 'react';
import {
  Plus, Trash2, FileSpreadsheet, Users, DollarSign, TrendingUp, Percent, ChevronDown, ChevronUp, Building2, Calendar,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import type { CorridaEmpleado, CargoExtra, CorridaConfig, VistaPeriodo } from '@/lib/excel/corridaFinanciera';
import { downloadCorridaFinancieraExcel, calcularVistaPeriodos } from '@/lib/excel/corridaFinanciera';

const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

const PERIODO_LABELS: Record<VistaPeriodo, string> = {
  quincenal: 'Quincenal',
  mensual: 'Mensual',
  semestral: 'Semestral',
  anual: 'Anual',
};

const formatMXN = (v: number) =>
  new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

const emptyEmpleado = (): CorridaEmpleado => ({
  id: Date.now(),
  apellido_paterno: '',
  apellido_materno: '',
  nombre: '',
  sueldo_quincenal: 0,
  banco: '',
  numero_cuenta: '',
  clabe: '',
  activo_desde_mes: null,
  dias_primera_quincena: null,
});

const emptyCargo = (): CargoExtra => ({
  id: Date.now(),
  nombre: '',
  tipo: 'porcentaje',
  valor: 0,
});

export default function CorridaFinanciera() {
  const [empresa, setEmpresa] = useState('ENTERSYS CONSULTORES');
  const [año, setAño] = useState(new Date().getFullYear());
  const [vistaPeriodo, setVistaPeriodo] = useState<VistaPeriodo>('mensual');
  const [empleados, setEmpleados] = useState<CorridaEmpleado[]>([
    { id: 1, apellido_paterno: 'PÉREZ', apellido_materno: 'GARCÍA', nombre: 'JUAN CARLOS', sueldo_quincenal: 7500, banco: 'BBVA', numero_cuenta: '', clabe: '', activo_desde_mes: null, dias_primera_quincena: null },
    { id: 2, apellido_paterno: 'LÓPEZ', apellido_materno: 'HERNÁNDEZ', nombre: 'MARÍA', sueldo_quincenal: 5000, banco: 'SANTANDER', numero_cuenta: '', clabe: '', activo_desde_mes: null, dias_primera_quincena: null },
  ]);
  const [cargosExtras, setCargosExtras] = useState<CargoExtra[]>([
    { id: 1, nombre: 'Costo Social', tipo: 'porcentaje', valor: 8 },
  ]);
  const [mesesPagados, setMesesPagados] = useState(0);
  const [excluirEmpIds, setExcluirEmpIds] = useState<number[]>([]);
  const [excluirCargoIds, setExcluirCargoIds] = useState<number[]>([]);
  const [showEmpleados, setShowEmpleados] = useState(true);
  const [showCargos, setShowCargos] = useState(true);
  const [showConfig, setShowConfig] = useState(false);

  const config: CorridaConfig = useMemo(() => ({
    empresa,
    año,
    empleados,
    cargos_extras: cargosExtras,
    meses_pagados: mesesPagados,
    empleados_excluidos_meses_pagados: excluirEmpIds,
    cargos_excluidos_meses_pagados: excluirCargoIds,
  }), [empresa, año, empleados, cargosExtras, mesesPagados, excluirEmpIds, excluirCargoIds]);

  // Cálculos
  const nominaEmpleadosQ = empleados.reduce((s, e) => s + e.sueldo_quincenal, 0);

  const totalQuincenal = useMemo(() => {
    const totalCargos = cargosExtras.reduce((s, c) => {
      if (c.tipo === 'porcentaje') return s + round2(nominaEmpleadosQ * c.valor / 100);
      return s + c.valor;
    }, 0);
    return round2(nominaEmpleadosQ + totalCargos);
  }, [nominaEmpleadosQ, cargosExtras]);

  const totalMensual = round2(totalQuincenal * 2);
  const totalSemestral = round2(totalMensual * 6);
  const totalAnualEstimado = round2(totalMensual * 12);

  // Datos calculados por periodo
  const periodoData = useMemo(() => calcularVistaPeriodos(config), [config]);
  const vistaActual = periodoData[vistaPeriodo];

  // Chart data
  const chartData = useMemo(() => {
    return vistaActual.map((p) => ({
      periodo: p.label,
      nomina: p.nomina_empleados,
      cargos: round2(p.total - p.nomina_empleados),
    }));
  }, [vistaActual]);

  // CRUD empleados
  const addEmpleado = () => setEmpleados([...empleados, emptyEmpleado()]);
  const removeEmpleado = (id: number) => setEmpleados(empleados.filter((e) => e.id !== id));
  const updateEmpleado = (id: number, field: keyof CorridaEmpleado, value: string | number | null) => {
    setEmpleados(empleados.map((e) => (e.id === id ? { ...e, [field]: value } : e)));
  };

  // CRUD cargos
  const addCargo = () => setCargosExtras([...cargosExtras, emptyCargo()]);
  const removeCargo = (id: number) => setCargosExtras(cargosExtras.filter((c) => c.id !== id));
  const updateCargo = (id: number, field: keyof CargoExtra, value: string | number) => {
    setCargosExtras(cargosExtras.map((c) => (c.id === id ? { ...c, [field]: value } : c)));
  };

  // Toggle exclusión
  const toggleExcluirEmp = (id: number) => {
    setExcluirEmpIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };
  const toggleExcluirCargo = (id: number) => {
    setExcluirCargoIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);
  };

  // Descargar Excel
  const handleDescargar = () => {
    downloadCorridaFinancieraExcel(config, vistaPeriodo);
  };

  // KPI values by period
  const kpiValues = {
    quincenal: { label: 'Quincenal', value: totalQuincenal },
    mensual: { label: 'Mensual', value: totalMensual },
    semestral: { label: 'Semestral', value: totalSemestral },
    anual: { label: 'Anual', value: totalAnualEstimado },
  };

  const grandTotal = vistaActual[vistaActual.length - 1]?.acumulado ?? 0;

  return (
    <div className="space-y-6">
      {/* Period selector */}
      <div className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-gray-400" />
        <span className="text-sm font-medium text-gray-600">Vista:</span>
        <div className="flex rounded-lg border border-gray-200 bg-white p-0.5">
          {(['quincenal', 'mensual', 'semestral', 'anual'] as VistaPeriodo[]).map((p) => (
            <button
              key={p}
              onClick={() => setVistaPeriodo(p)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${
                vistaPeriodo === p
                  ? 'bg-primary-600 text-white shadow-sm'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {PERIODO_LABELS[p]}
            </button>
          ))}
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
        <StatsCard title="Empleados" value={empleados.length} icon={Users} color="blue" />
        <StatsCard title="Total Quincenal" value={formatMXN(totalQuincenal)} icon={DollarSign} color="green" />
        <StatsCard title="Total Mensual" value={formatMXN(totalMensual)} icon={DollarSign} color="purple" />
        <StatsCard title={`Total ${kpiValues[vistaPeriodo].label}`} value={formatMXN(kpiValues[vistaPeriodo].value)} icon={DollarSign} color="cyan" />
        <StatsCard title="Gran Total Anual" value={formatMXN(grandTotal)} icon={TrendingUp} color="orange" />
      </div>

      {/* Configuración general */}
      <div className="card">
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Building2 className="h-5 w-5 text-gray-400" />
            Configuración General
          </h3>
          {showConfig ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>
        {showConfig && (
          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Empresa</label>
              <input className="input" value={empresa} onChange={(e) => setEmpresa(e.target.value)} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Año</label>
              <input type="number" className="input" value={año} onChange={(e) => setAño(Number(e.target.value))} />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">Meses ya pagados</label>
              <input type="number" min={0} max={12} className="input" value={mesesPagados}
                onChange={(e) => setMesesPagados(Number(e.target.value))} />
            </div>
            <div className="flex items-end">
              <p className="text-xs text-gray-500">
                Si ya pagaste meses anteriores, marca cuántos. Podrás excluir empleados/cargos que no estaban en esos meses.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Empleados */}
      <div className="card">
        <button
          onClick={() => setShowEmpleados(!showEmpleados)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Users className="h-5 w-5 text-gray-400" />
            Empleados ({empleados.length})
          </h3>
          {showEmpleados ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>

        {showEmpleados && (
          <div className="mt-4 space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-xs text-gray-500">
                    <th className="px-2 py-2 text-left">Apellido Paterno</th>
                    <th className="px-2 py-2 text-left">Apellido Materno</th>
                    <th className="px-2 py-2 text-left">Nombre</th>
                    <th className="px-2 py-2 text-right">Sueldo Quincenal</th>
                    <th className="px-2 py-2 text-left">Banco</th>
                    <th className="px-2 py-2 text-left">No. Cuenta</th>
                    <th className="px-2 py-2 text-left">CLABE</th>
                    <th className="px-2 py-2 text-center">Desde Mes</th>
                    <th className="px-2 py-2 text-center">Días 1ra Qna</th>
                    {mesesPagados > 0 && <th className="px-2 py-2 text-center">Excluir Pagados</th>}
                    <th className="px-2 py-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {empleados.map((emp) => (
                    <tr key={emp.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-2 py-1.5">
                        <input className="input py-1 text-sm" value={emp.apellido_paterno}
                          onChange={(e) => updateEmpleado(emp.id, 'apellido_paterno', e.target.value)} placeholder="Apellido" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input py-1 text-sm" value={emp.apellido_materno}
                          onChange={(e) => updateEmpleado(emp.id, 'apellido_materno', e.target.value)} placeholder="Apellido" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input py-1 text-sm" value={emp.nombre}
                          onChange={(e) => updateEmpleado(emp.id, 'nombre', e.target.value)} placeholder="Nombre" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" className="input w-28 py-1 text-right text-sm" value={emp.sueldo_quincenal}
                          onChange={(e) => updateEmpleado(emp.id, 'sueldo_quincenal', Number(e.target.value))} />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input w-24 py-1 text-sm" value={emp.banco}
                          onChange={(e) => updateEmpleado(emp.id, 'banco', e.target.value)} placeholder="Banco" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input w-28 py-1 text-sm" value={emp.numero_cuenta}
                          onChange={(e) => updateEmpleado(emp.id, 'numero_cuenta', e.target.value)} placeholder="Cuenta" />
                      </td>
                      <td className="px-2 py-1.5">
                        <input className="input w-36 py-1 text-sm" value={emp.clabe}
                          onChange={(e) => updateEmpleado(emp.id, 'clabe', e.target.value)} placeholder="CLABE 18 dígitos" />
                      </td>
                      <td className="px-2 py-1.5">
                        <select className="input w-20 py-1 text-center text-sm"
                          value={emp.activo_desde_mes ?? ''}
                          onChange={(e) => updateEmpleado(emp.id, 'activo_desde_mes', e.target.value ? Number(e.target.value) : null)}>
                          <option value="">Inicio</option>
                          {MESES.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
                        </select>
                      </td>
                      <td className="px-2 py-1.5">
                        <input type="number" min={1} max={15} className="input w-16 py-1 text-center text-sm"
                          value={emp.dias_primera_quincena ?? ''}
                          onChange={(e) => updateEmpleado(emp.id, 'dias_primera_quincena', e.target.value ? Number(e.target.value) : null)}
                          placeholder="15" />
                      </td>
                      {mesesPagados > 0 && (
                        <td className="px-2 py-1.5 text-center">
                          <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600"
                            checked={excluirEmpIds.includes(emp.id)}
                            onChange={() => toggleExcluirEmp(emp.id)} />
                        </td>
                      )}
                      <td className="px-2 py-1.5">
                        <button onClick={() => removeEmpleado(emp.id)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center justify-between">
              <button onClick={addEmpleado} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
                <Plus className="h-4 w-4" /> Agregar Empleado
              </button>
              <p className="text-sm text-gray-500">
                Nómina Empleados: <span className="font-bold text-gray-900">{formatMXN(nominaEmpleadosQ)}</span> / quincena
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Cargos Extras */}
      <div className="card">
        <button
          onClick={() => setShowCargos(!showCargos)}
          className="flex w-full items-center justify-between text-left"
        >
          <h3 className="flex items-center gap-2 font-semibold text-gray-900">
            <Percent className="h-5 w-5 text-gray-400" />
            Cargos Extras ({cargosExtras.length})
          </h3>
          {showCargos ? <ChevronUp className="h-5 w-5 text-gray-400" /> : <ChevronDown className="h-5 w-5 text-gray-400" />}
        </button>

        {showCargos && (
          <div className="mt-4 space-y-3">
            {cargosExtras.map((cargo) => (
              <div key={cargo.id} className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
                <input className="input flex-1 py-1.5 text-sm" value={cargo.nombre}
                  onChange={(e) => updateCargo(cargo.id, 'nombre', e.target.value)} placeholder="Nombre del cargo" />
                <select className="input w-36 py-1.5 text-sm" value={cargo.tipo}
                  onChange={(e) => updateCargo(cargo.id, 'tipo', e.target.value)}>
                  <option value="porcentaje">Porcentaje %</option>
                  <option value="fijo">Monto Fijo</option>
                </select>
                <div className="relative">
                  <input type="number" className="input w-28 py-1.5 text-right text-sm" value={cargo.valor}
                    onChange={(e) => updateCargo(cargo.id, 'valor', Number(e.target.value))} />
                  {cargo.tipo === 'porcentaje' && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">%</span>
                  )}
                </div>
                <span className="w-28 text-right text-sm font-medium text-gray-700">
                  {cargo.tipo === 'porcentaje'
                    ? formatMXN(round2(nominaEmpleadosQ * cargo.valor / 100))
                    : formatMXN(cargo.valor)
                  }
                  <span className="text-xs text-gray-400"> /qna</span>
                </span>
                {mesesPagados > 0 && (
                  <label className="flex items-center gap-1 text-xs text-gray-500">
                    <input type="checkbox" className="h-3.5 w-3.5 rounded border-gray-300 text-primary-600"
                      checked={excluirCargoIds.includes(cargo.id)}
                      onChange={() => toggleExcluirCargo(cargo.id)} />
                    Excluir pagados
                  </label>
                )}
                <button onClick={() => removeCargo(cargo.id)} className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
            <button onClick={addCargo} className="flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700">
              <Plus className="h-4 w-4" /> Agregar Cargo Extra
            </button>
          </div>
        )}
      </div>

      {/* Gráfica */}
      <div className="card">
        <h3 className="mb-4 font-semibold text-gray-900">Proyección {PERIODO_LABELS[vistaPeriodo]}</h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="periodo" tick={{ fontSize: vistaPeriodo === 'quincenal' ? 8 : 11 }} stroke="#94a3b8" angle={vistaPeriodo === 'quincenal' ? -45 : 0} textAnchor={vistaPeriodo === 'quincenal' ? 'end' : 'middle'} height={vistaPeriodo === 'quincenal' ? 60 : 30} />
            <YAxis tick={{ fontSize: 10 }} stroke="#94a3b8" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(v: number) => formatMXN(v)} />
            <Legend />
            <Bar dataKey="nomina" name="Nómina Empleados" fill="#3b82f6" radius={[4, 4, 0, 0]} />
            <Bar dataKey="cargos" name="Cargos Extras" fill="#f59e0b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Tabla resumen por periodo */}
      <div className="card overflow-x-auto">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Resumen {PERIODO_LABELS[vistaPeriodo]}</h3>
          <span className="text-sm text-gray-500">{vistaActual.length} {vistaPeriodo === 'quincenal' ? 'quincenas' : vistaPeriodo === 'mensual' ? 'meses' : vistaPeriodo === 'semestral' ? 'semestres' : 'periodo'}</span>
        </div>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b-2 border-primary-600 text-xs text-gray-500">
              <th className="px-3 py-2 text-left">Periodo</th>
              <th className="px-3 py-2 text-right">Nómina Empleados</th>
              {cargosExtras.map((c) => (
                <th key={c.id} className="px-3 py-2 text-right">{c.nombre || 'Cargo'}</th>
              ))}
              <th className="px-3 py-2 text-right font-bold">Total</th>
              <th className="px-3 py-2 text-right">Acumulado</th>
            </tr>
          </thead>
          <tbody>
            {vistaActual.map((row, idx) => (
              <tr key={row.label} className={`border-b border-gray-100 ${idx % 2 === 1 ? 'bg-gray-50' : ''}`}>
                <td className="px-3 py-2 font-medium text-gray-900">{row.label}</td>
                <td className="px-3 py-2 text-right">{formatMXN(row.nomina_empleados)}</td>
                {row.cargos.map((c, ci) => (
                  <td key={ci} className="px-3 py-2 text-right text-gray-600">{formatMXN(c.monto)}</td>
                ))}
                <td className="px-3 py-2 text-right font-bold text-gray-900">{formatMXN(row.total)}</td>
                <td className="px-3 py-2 text-right text-purple-600">{formatMXN(row.acumulado)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-primary-600 bg-primary-50">
              <td className="px-3 py-2 font-bold text-primary-700">GRAN TOTAL</td>
              <td className="px-3 py-2 text-right font-bold text-primary-700">
                {formatMXN(vistaActual.reduce((s, r) => s + r.nomina_empleados, 0))}
              </td>
              {cargosExtras.map((c, ci) => (
                <td key={c.id} className="px-3 py-2 text-right font-bold text-primary-700">
                  {formatMXN(vistaActual.reduce((s, r) => s + (r.cargos[ci]?.monto ?? 0), 0))}
                </td>
              ))}
              <td className="px-3 py-2 text-right font-bold text-primary-700">{formatMXN(grandTotal)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Botón descargar */}
      <div className="flex justify-center gap-3">
        <button
          onClick={handleDescargar}
          disabled={empleados.length === 0}
          className="btn-primary px-8 py-3 text-base"
        >
          <FileSpreadsheet className="h-5 w-5" />
          Descargar Excel — Vista {PERIODO_LABELS[vistaPeriodo]}
        </button>
      </div>
    </div>
  );
}
