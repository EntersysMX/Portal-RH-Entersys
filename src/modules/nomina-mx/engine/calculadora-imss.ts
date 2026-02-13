// ============================================
// CALCULADORA DE CUOTAS IMSS
// Ley del Seguro Social + Reformas 2023-2026
// ============================================

import type { IMSSResult } from '../types';
import { TASAS_IMSS, UMA_DIARIO, SALARIO_MINIMO_GENERAL } from './tablas-sat';

/**
 * Calcula las cuotas obrero-patronales del IMSS.
 *
 * @param sdi - Salario Diario Integrado
 * @param diasMes - Días del periodo (30 para mensual, 15 para quincenal, 7 para semanal)
 * @param primaRiesgo - Prima de riesgo de trabajo (default 0.50% = Clase I)
 * @returns Desglose completo de cuotas IMSS
 */
export function calcularIMSS(
  sdi: number,
  diasMes: number = 30,
  primaRiesgo: number = TASAS_IMSS.riesgo_trabajo.patron
): IMSSResult {
  const r = round2;

  // Tope de cotización: 25 UMA (para todas las ramas excepto algunas)
  const topeSBC = UMA_DIARIO * TASAS_IMSS.tope_sbc;
  const sdiTopado = Math.min(sdi, topeSBC);
  const baseTotal = sdiTopado * diasMes;

  // ============================
  // CUOTAS PATRONALES
  // ============================

  // 1. Enfermedades y Maternidad - Especie (cuota fija)
  // 20.40% del salario mínimo general (NO del SBC)
  const cuotaFijaEspecie = r(
    SALARIO_MINIMO_GENERAL * TASAS_IMSS.enf_mat_especie_fija.patron * diasMes
  );

  // 2. Enfermedades y Maternidad - Especie (excedente)
  // Solo aplica si SBC > 3 UMA
  const tresUMA = UMA_DIARIO * 3;
  const excedenteSBC = Math.max(0, sdiTopado - tresUMA);
  const excedentePeriodo = excedenteSBC * diasMes;
  const patronEnfMatExcedente = r(excedentePeriodo * TASAS_IMSS.enf_mat_especie_excedente.patron);
  const trabajadorEnfMatExcedente = r(excedentePeriodo * TASAS_IMSS.enf_mat_especie_excedente.trabajador);

  // 3. Enfermedades y Maternidad - Dinero
  const patronEnfMatDinero = r(baseTotal * TASAS_IMSS.enf_mat_dinero.patron);
  const trabajadorEnfMatDinero = r(baseTotal * TASAS_IMSS.enf_mat_dinero.trabajador);

  // 4. Gastos Médicos para Pensionados
  const patronGastosMedicos = r(baseTotal * TASAS_IMSS.enf_mat_gastos_medicos.patron);

  // 5. Invalidez y Vida
  const patronInvVida = r(baseTotal * TASAS_IMSS.invalidez_vida.patron);
  const trabajadorInvVida = r(baseTotal * TASAS_IMSS.invalidez_vida.trabajador);

  // 6. Cesantía en Edad Avanzada y Vejez
  const patronCesantia = r(baseTotal * TASAS_IMSS.cesantia_vejez.patron);
  const trabajadorCesantia = r(baseTotal * TASAS_IMSS.cesantia_vejez.trabajador);

  // 7. Retiro (SAR)
  const patronRetiro = r(baseTotal * TASAS_IMSS.retiro.patron);

  // 8. Riesgo de Trabajo (varía por empresa)
  const patronRiesgo = r(baseTotal * primaRiesgo);

  // 9. Guarderías y Prestaciones Sociales
  const patronGuarderia = r(baseTotal * TASAS_IMSS.guarderia.patron);

  // 10. INFONAVIT (aportación patronal)
  const patronInfonavit = r(baseTotal * TASAS_IMSS.infonavit.patron);

  // ============================
  // TOTALES
  // ============================
  const totalPatron = r(
    cuotaFijaEspecie +
    patronEnfMatExcedente +
    patronEnfMatDinero +
    patronGastosMedicos +
    patronInvVida +
    patronCesantia +
    patronRetiro +
    patronRiesgo +
    patronGuarderia +
    patronInfonavit
  );

  const totalTrabajador = r(
    trabajadorEnfMatExcedente +
    trabajadorEnfMatDinero +
    trabajadorInvVida +
    trabajadorCesantia
  );

  return {
    patron: {
      enf_mat_especie_fija: cuotaFijaEspecie,
      enf_mat_especie_excedente: patronEnfMatExcedente,
      enf_mat_dinero: patronEnfMatDinero,
      enf_mat_gastos_medicos: patronGastosMedicos,
      invalidez_vida: patronInvVida,
      cesantia_vejez: patronCesantia,
      retiro: patronRetiro,
      riesgo_trabajo: patronRiesgo,
      guarderia: patronGuarderia,
      infonavit: patronInfonavit,
      total: totalPatron,
    },
    trabajador: {
      enf_mat_especie_excedente: trabajadorEnfMatExcedente,
      enf_mat_dinero: trabajadorEnfMatDinero,
      invalidez_vida: trabajadorInvVida,
      cesantia_vejez: trabajadorCesantia,
      total: totalTrabajador,
    },
    total_empresa: totalPatron,
    total_empleado: totalTrabajador,
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
