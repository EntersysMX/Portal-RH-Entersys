// ============================================
// CALCULADORA DE SDI (Salario Diario Integrado)
// Art. 27 y 30 de la Ley del Seguro Social
// ============================================

import type { SDIResult } from '../types';
import {
  getDiasVacaciones,
  DIAS_AGUINALDO_MINIMO,
  PRIMA_VACACIONAL_MINIMA,
} from './tablas-sat';

/**
 * Calcula el Salario Diario Integrado (SDI/SBC).
 *
 * El SDI se usa para calcular cuotas IMSS e INFONAVIT.
 * Integra: salario diario + aguinaldo proporcional + prima vacacional proporcional
 *
 * Fórmula del factor de integración:
 * FI = 1 + (aguinaldo/365) + (vacaciones × prima_vac / 365)
 * SDI = Salario Diario × Factor de Integración
 *
 * @param salarioDiario - Salario diario del trabajador
 * @param fechaIngreso - Fecha de ingreso (ISO string)
 * @param diasAguinaldo - Días de aguinaldo (mínimo 15 LFT)
 * @param primaVacacionalPct - Prima vacacional % (mínimo 25% LFT)
 */
export function calcularSDI(
  salarioDiario: number,
  fechaIngreso: string,
  diasAguinaldo: number = DIAS_AGUINALDO_MINIMO,
  primaVacacionalPct: number = PRIMA_VACACIONAL_MINIMA
): SDIResult {
  // Calcular antigüedad
  const ingreso = new Date(fechaIngreso);
  const hoy = new Date();
  const diffMs = hoy.getTime() - ingreso.getTime();
  const antiguedadAnios = diffMs / (365.25 * 24 * 60 * 60 * 1000);

  // Días de vacaciones según antigüedad
  const diasVacaciones = getDiasVacaciones(Math.max(1, Math.floor(antiguedadAnios)));

  // Factor de integración
  // FI = 1 + (días_aguinaldo / 365) + (días_vacaciones × prima_vacacional / 365)
  const propAguinaldo = diasAguinaldo / 365;
  const propPrimaVac = (diasVacaciones * primaVacacionalPct) / 365;
  const factorIntegracion = round4(1 + propAguinaldo + propPrimaVac);

  // SDI
  const sdi = round2(salarioDiario * factorIntegracion);

  return {
    salario_diario: salarioDiario,
    factor_integracion: factorIntegracion,
    sdi,
    antiguedad_anios: round2(antiguedadAnios),
    dias_aguinaldo: diasAguinaldo,
    dias_vacaciones: diasVacaciones,
    prima_vacacional_pct: primaVacacionalPct,
  };
}

/**
 * Factores de integración rápidos por antigüedad.
 * Útil para tabla de referencia.
 */
export function getFactoresIntegracion(
  diasAguinaldo: number = 15,
  primaVac: number = 0.25
): { anios: number; dias_vac: number; factor: number }[] {
  const factores = [];
  for (let a = 1; a <= 30; a++) {
    const diasVac = getDiasVacaciones(a);
    const factor = round4(1 + diasAguinaldo / 365 + (diasVac * primaVac) / 365);
    factores.push({ anios: a, dias_vac: diasVac, factor });
  }
  return factores;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
