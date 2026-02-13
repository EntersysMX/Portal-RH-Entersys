// ============================================
// CALCULADORA DE PRESTACIONES DE LEY
// Aguinaldo, Prima Vacacional, PTU, Vacaciones
// ============================================

import type { PrestacionesAnuales } from '../types';
import {
  getDiasVacaciones,
  DIAS_AGUINALDO_MINIMO,
  PRIMA_VACACIONAL_MINIMA,
  UMA_DIARIO,
} from './tablas-sat';
import { calcularISRExtraordinario } from './calculadora-isr';

/**
 * Calcula todas las prestaciones anuales de un empleado.
 *
 * @param salarioDiario - Salario diario
 * @param salarioMensual - Salario mensual (para cálculo de ISR)
 * @param fechaIngreso - Fecha de ingreso
 * @param diasAguinaldo - Días de aguinaldo (min. 15 LFT)
 * @param primaVacPct - Prima vacacional % (min. 25% LFT)
 * @param utilidadRepartible - Utilidad de la empresa para PTU (opcional)
 * @param totalTrabajadores - Total de trabajadores (para PTU)
 * @param totalDiasTrabajados - Total de días trabajados por todos (para PTU)
 * @param totalSalariosDevengados - Total de salarios de todos (para PTU)
 */
export function calcularPrestaciones(params: {
  salarioDiario: number;
  salarioMensual: number;
  fechaIngreso: string;
  diasTrabajadosAnio?: number;
  diasAguinaldo?: number;
  primaVacPct?: number;
  utilidadRepartible?: number;
  totalTrabajadores?: number;
  totalDiasTrabajadosEmpresa?: number;
  totalSalariosDevengados?: number;
}): PrestacionesAnuales {
  const {
    salarioDiario,
    salarioMensual,
    fechaIngreso,
    diasTrabajadosAnio = 365,
    diasAguinaldo = DIAS_AGUINALDO_MINIMO,
    primaVacPct = PRIMA_VACACIONAL_MINIMA,
    utilidadRepartible = 0,
    totalDiasTrabajadosEmpresa = 1,
    totalSalariosDevengados = 1,
  } = params;

  // Antigüedad
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const antiguedad = Math.max(1, Math.floor(
    (hoy.getTime() - ingreso.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  ));

  // ================================
  // AGUINALDO (Art. 87 LFT)
  // ================================
  // Mínimo 15 días de salario. Proporcional si no trabajó el año completo.
  const aguinaldoProporcional = (diasAguinaldo * diasTrabajadosAnio) / 365;
  const aguinaldoBruto = round2(salarioDiario * aguinaldoProporcional);

  // Exención: 30 UMA diarias (Art. 93 fracción XIV LISR)
  const aguinaldoExento = round2(Math.min(aguinaldoBruto, UMA_DIARIO * 30));
  const aguinaldoGravado = round2(Math.max(0, aguinaldoBruto - aguinaldoExento));

  const isrAguinaldo = calcularISRExtraordinario(aguinaldoGravado, salarioMensual);

  // ================================
  // PRIMA VACACIONAL (Art. 80 LFT)
  // ================================
  const diasVacaciones = getDiasVacaciones(antiguedad);
  const primaVacBruto = round2(salarioDiario * diasVacaciones * primaVacPct);

  // Exención: 15 UMA diarias (Art. 93 fracción XIV LISR)
  const primaVacExento = round2(Math.min(primaVacBruto, UMA_DIARIO * 15));
  const primaVacGravado = round2(Math.max(0, primaVacBruto - primaVacExento));

  const isrPrimaVac = calcularISRExtraordinario(primaVacGravado, salarioMensual);

  // ================================
  // PTU (Art. 117-131 LFT)
  // ================================
  // 10% de utilidades se reparte: 50% por días trabajados + 50% por salarios
  let ptuEstimado = 0;
  if (utilidadRepartible > 0) {
    const ptuTotal = utilidadRepartible * 0.10;
    const mitadDias = ptuTotal * 0.50;
    const mitadSalarios = ptuTotal * 0.50;

    const porDias = (mitadDias * diasTrabajadosAnio) / totalDiasTrabajadosEmpresa;
    const porSalarios = (mitadSalarios * (salarioDiario * diasTrabajadosAnio)) / totalSalariosDevengados;

    ptuEstimado = round2(porDias + porSalarios);

    // Tope: 3 meses de salario del trabajador
    const topePTU = salarioMensual * 3;
    ptuEstimado = Math.min(ptuEstimado, topePTU);
  }

  // Exención PTU: 15 UMA diarias
  const ptuExento = round2(Math.min(ptuEstimado, UMA_DIARIO * 15));
  const ptuGravado = round2(Math.max(0, ptuEstimado - ptuExento));

  const isrPTU = calcularISRExtraordinario(ptuGravado, salarioMensual);

  // ================================
  // VACACIONES
  // ================================
  return {
    aguinaldo: {
      dias: round2(aguinaldoProporcional),
      monto_bruto: aguinaldoBruto,
      parte_exenta: aguinaldoExento,
      parte_gravada: aguinaldoGravado,
      isr: isrAguinaldo.isr,
      neto: round2(aguinaldoBruto - isrAguinaldo.isr),
    },
    prima_vacacional: {
      dias_vacaciones: diasVacaciones,
      tasa: primaVacPct,
      monto_bruto: primaVacBruto,
      parte_exenta: primaVacExento,
      parte_gravada: primaVacGravado,
      isr: isrPrimaVac.isr,
      neto: round2(primaVacBruto - isrPrimaVac.isr),
    },
    ptu: {
      dias_trabajados_anio: diasTrabajadosAnio,
      salario_topado: round2(salarioMensual * 3),
      monto_estimado: ptuEstimado,
      parte_exenta: ptuExento,
      parte_gravada: ptuGravado,
      isr: isrPTU.isr,
      neto: round2(ptuEstimado - isrPTU.isr),
    },
    vacaciones: {
      dias_correspondientes: diasVacaciones,
      dias_pendientes: diasVacaciones, // Se actualiza con datos reales
      monto_por_dia: salarioDiario,
    },
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
