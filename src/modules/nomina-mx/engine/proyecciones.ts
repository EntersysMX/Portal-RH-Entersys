// ============================================
// MOTOR DE PROYECCIONES DE NÓMINA
// Forecasting, simulación de escenarios, presupuesto
// ============================================

import type { EmpleadoNomina, ProyeccionNomina } from '../types';
import { calcularNomina } from './calculadora-nomina';

interface ProyeccionParams {
  empleados: EmpleadoNomina[];
  mesesProyeccion?: number; // Default 12
  incrementoSalarialPct?: number; // Ej: 5 = 5% de aumento
  mesIncrementoSalarial?: number; // 1-12, en qué mes aplica el aumento
  nuevasContrataciones?: { mes: number; cantidad: number; salarioDiarioPromedio: number }[];
  bajasEstimadas?: { mes: number; cantidad: number }[];
  primaRiesgoTrabajo?: number;
}

/**
 * Proyecta el costo total de nómina a futuro.
 * Permite simular aumentos, contrataciones y bajas.
 */
export function proyectarNomina(params: ProyeccionParams): ProyeccionNomina[] {
  const {
    empleados: empleadosBase,
    mesesProyeccion = 12,
    incrementoSalarialPct = 0,
    mesIncrementoSalarial = 1,
    nuevasContrataciones = [],
    bajasEstimadas = [],
    primaRiesgoTrabajo = 0.005,
  } = params;

  const proyeccion: ProyeccionNomina[] = [];
  const ahora = new Date();
  let headcountActual = empleadosBase.length;

  for (let mes = 1; mes <= mesesProyeccion; mes++) {
    const fecha = new Date(ahora.getFullYear(), ahora.getMonth() + mes - 1, 1);
    const mesLabel = fecha.toLocaleDateString('es-MX', { month: 'short', year: 'numeric' });
    const fechaInicio = fecha.toISOString().split('T')[0];
    const fechaFin = new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0)
      .toISOString()
      .split('T')[0];

    // Aplicar incremento salarial si aplica
    const factorIncremento = mes >= mesIncrementoSalarial ? 1 + incrementoSalarialPct / 100 : 1;

    // Nuevas contrataciones en este mes
    const nuevas = nuevasContrataciones.find((n) => n.mes === mes);
    if (nuevas) headcountActual += nuevas.cantidad;

    // Bajas en este mes
    const bajas = bajasEstimadas.find((b) => b.mes === mes);
    if (bajas) headcountActual = Math.max(0, headcountActual - bajas.cantidad);

    // Calcular nómina por cada empleado existente
    let totalPercepciones = 0;
    let totalISR = 0;
    let totalIMSSEmpleado = 0;
    let totalIMSSPatron = 0;
    let totalInfonavit = 0;
    let totalISN = 0;
    let totalNeto = 0;
    let totalCostoEmpresa = 0;

    // Procesar empleados base
    for (const emp of empleadosBase) {
      const empAjustado = {
        ...emp,
        salario_diario: round2(emp.salario_diario * factorIncremento),
      };

      const recibo = calcularNomina({
        empleado: empAjustado,
        periodo: 'mensual',
        fechaInicio,
        fechaFin,
        primaRiesgoTrabajo,
      });

      totalPercepciones += recibo.percepciones.total_percepciones;
      totalISR += recibo.deducciones.isr;
      totalIMSSEmpleado += recibo.deducciones.imss_trabajador;
      totalIMSSPatron += recibo.costo_empresa.imss_patron;
      totalInfonavit += recibo.costo_empresa.infonavit_patron;
      totalISN += recibo.costo_empresa.isn;
      totalNeto += recibo.neto_a_pagar;
      totalCostoEmpresa += recibo.costo_empresa.total_costo;
    }

    // Agregar nuevas contrataciones como costo promedio
    if (nuevas) {
      for (let i = 0; i < nuevas.cantidad; i++) {
        const empNuevo: EmpleadoNomina = {
          id: `nuevo-${mes}-${i}`,
          nombre: `Contratación Proyectada ${mes}`,
          fecha_ingreso: fechaInicio,
          salario_diario: nuevas.salarioDiarioPromedio * factorIncremento,
          tipo_contrato: 'Indeterminado',
          tipo_jornada: 'Diurna',
          estado: 'Ciudad de México',
          tiene_infonavit: false,
        };

        const recibo = calcularNomina({
          empleado: empNuevo,
          periodo: 'mensual',
          fechaInicio,
          fechaFin,
          primaRiesgoTrabajo,
        });

        totalPercepciones += recibo.percepciones.total_percepciones;
        totalISR += recibo.deducciones.isr;
        totalIMSSEmpleado += recibo.deducciones.imss_trabajador;
        totalIMSSPatron += recibo.costo_empresa.imss_patron;
        totalInfonavit += recibo.costo_empresa.infonavit_patron;
        totalISN += recibo.costo_empresa.isn;
        totalNeto += recibo.neto_a_pagar;
        totalCostoEmpresa += recibo.costo_empresa.total_costo;
      }
    }

    proyeccion.push({
      mes: mesLabel,
      total_percepciones: round2(totalPercepciones),
      total_isr: round2(totalISR),
      total_imss_empleado: round2(totalIMSSEmpleado),
      total_imss_patron: round2(totalIMSSPatron),
      total_infonavit: round2(totalInfonavit),
      total_isn: round2(totalISN),
      total_neto: round2(totalNeto),
      total_costo_empresa: round2(totalCostoEmpresa),
      headcount: headcountActual,
    });
  }

  return proyeccion;
}

/**
 * Compara dos escenarios de nómina para análisis de impacto.
 */
export function compararEscenarios(
  escenarioA: ProyeccionNomina[],
  escenarioB: ProyeccionNomina[]
): {
  mes: string;
  costo_a: number;
  costo_b: number;
  diferencia: number;
  diferencia_pct: number;
}[] {
  return escenarioA.map((a, idx) => {
    const b = escenarioB[idx];
    const diff = b.total_costo_empresa - a.total_costo_empresa;
    return {
      mes: a.mes,
      costo_a: a.total_costo_empresa,
      costo_b: b.total_costo_empresa,
      diferencia: round2(diff),
      diferencia_pct: a.total_costo_empresa > 0 ? round2((diff / a.total_costo_empresa) * 100) : 0,
    };
  });
}

/**
 * Calcula el costo anual total de un empleado (incluye prestaciones).
 */
export function costoAnualEmpleado(empleado: EmpleadoNomina): {
  nomina_anual: number;
  aguinaldo: number;
  prima_vacacional: number;
  imss_patron_anual: number;
  infonavit_anual: number;
  isn_anual: number;
  costo_total_anual: number;
} {
  const recibo = calcularNomina({
    empleado,
    periodo: 'mensual',
    fechaInicio: '2026-01-01',
    fechaFin: '2026-01-31',
  });

  const nominaAnual = round2(recibo.percepciones.total_percepciones * 12);
  const aguinaldo = round2(empleado.salario_diario * 15);
  const primaVac = round2(empleado.salario_diario * 12 * 0.25); // Aprox 1 año
  const imssPatronAnual = round2(recibo.costo_empresa.imss_patron * 12);
  const infonavitAnual = round2(recibo.costo_empresa.infonavit_patron * 12);
  const isnAnual = round2(recibo.costo_empresa.isn * 12);

  return {
    nomina_anual: nominaAnual,
    aguinaldo,
    prima_vacacional: primaVac,
    imss_patron_anual: imssPatronAnual,
    infonavit_anual: infonavitAnual,
    isn_anual: isnAnual,
    costo_total_anual: round2(nominaAnual + aguinaldo + primaVac + imssPatronAnual + infonavitAnual + isnAnual),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
