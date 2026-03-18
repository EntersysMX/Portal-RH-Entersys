import type { NivelRiesgoARL, SeguridadSocialResult, ParafiscalesResult } from '../types';

// Tasas de seguridad social 2024
const SALUD_EMPLEADO = 0.04;
const SALUD_EMPLEADOR = 0.085;
const PENSION_EMPLEADO = 0.04;
const PENSION_EMPLEADOR = 0.12;

const ARL_TASAS: Record<NivelRiesgoARL, number> = {
  I:   0.00522,
  II:  0.01044,
  III: 0.02436,
  IV:  0.04350,
  V:   0.06960,
};

const CAJA_COMPENSACION = 0.04;

// Parafiscales (empleador)
const SENA_TASA = 0.02;
const ICBF_TASA = 0.03;

// SMMLV 2024
const SMMLV_2024 = 1_300_000;

export function calcularSeguridadSocial(
  salarioMensual: number,
  nivelRiesgo: NivelRiesgoARL,
): SeguridadSocialResult {
  // IBC (Ingreso Base de Cotizacion) = salario mensual
  // Tope: 25 SMMLV para pension y salud
  const topeIBC = SMMLV_2024 * 25;
  const ibc = Math.min(salarioMensual, topeIBC);

  const saludEmpleado = Math.round(ibc * SALUD_EMPLEADO);
  const saludEmpleador = Math.round(ibc * SALUD_EMPLEADOR);
  const pensionEmpleado = Math.round(ibc * PENSION_EMPLEADO);
  const pensionEmpleador = Math.round(ibc * PENSION_EMPLEADOR);

  const tasaARL = ARL_TASAS[nivelRiesgo];
  const arl = Math.round(ibc * tasaARL);

  const cajaCompensacion = Math.round(ibc * CAJA_COMPENSACION);

  return {
    salud: {
      empleado: saludEmpleado,
      empleador: saludEmpleador,
      tasaEmpleado: SALUD_EMPLEADO,
      tasaEmpleador: SALUD_EMPLEADOR,
    },
    pension: {
      empleado: pensionEmpleado,
      empleador: pensionEmpleador,
      tasaEmpleado: PENSION_EMPLEADO,
      tasaEmpleador: PENSION_EMPLEADOR,
    },
    arl: {
      empleador: arl,
      tasa: tasaARL,
      nivel: nivelRiesgo,
    },
    cajaCompensacion: {
      empleador: cajaCompensacion,
      tasa: CAJA_COMPENSACION,
    },
    totalEmpleado: saludEmpleado + pensionEmpleado,
    totalEmpleador: saludEmpleador + pensionEmpleador + arl + cajaCompensacion,
  };
}

export function calcularParafiscales(salarioMensual: number): ParafiscalesResult {
  const sena = Math.round(salarioMensual * SENA_TASA);
  const icbf = Math.round(salarioMensual * ICBF_TASA);
  return { sena, icbf, total: sena + icbf };
}
