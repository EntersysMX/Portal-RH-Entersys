import type { EmpleadoCOL, NominaCOLResult, PrestacionesCOLResult } from '../types';
import { calcularRetencionFuente } from './calculadora-retencion';
import { calcularSeguridadSocial, calcularParafiscales } from './calculadora-seguridad-social';

// SMMLV 2024 (for dotacion and rules)
const SMMLV_2024 = 1_300_000;

function calcularHorasExtras(salarioMensual: number, diurnas: number, nocturnas: number): number {
  // Valor hora ordinaria = salario / 240
  const valorHora = salarioMensual / 240;
  // HE diurna: 125% del valor hora
  const heDiurna = diurnas * valorHora * 1.25;
  // HE nocturna: 175% del valor hora
  const heNocturna = nocturnas * valorHora * 1.75;
  return Math.round(heDiurna + heNocturna);
}

function calcularPrestacionesCOL(salarioMensual: number): PrestacionesCOLResult {
  // Prima de servicios: 1 mes por anio (pagado en 2 partes semestrales)
  const primaAnual = salarioMensual;
  const primaSemestral = Math.round(primaAnual / 2);

  // Cesantias: 1 mes de salario por anio
  const cesantiasAnual = salarioMensual;
  // Intereses sobre cesantias: 12% anual
  const interesesCesantias = Math.round(cesantiasAnual * 0.12);

  // Vacaciones: 15 dias habiles por anio = medio mes de salario
  const vacacionesAnual = Math.round(salarioMensual / 2);

  // Dotacion: aplica si salario <= 2 SMMLV, 3 veces al anio
  const aplicaDotacion = salarioMensual <= SMMLV_2024 * 2;
  const dotacionEstimada = aplicaDotacion ? 150_000 * 3 : 0; // estimado 3 entregas/anio

  return {
    prima: {
      diasBase: 30,
      montoPorPeriodo: primaSemestral,
      montoAnual: primaAnual,
    },
    cesantias: {
      montoAnual: cesantiasAnual,
      intereses: interesesCesantias,
      tasaIntereses: 0.12,
    },
    vacaciones: {
      diasHabiles: 15,
      montoAnual: vacacionesAnual,
    },
    dotacion: {
      aplica: aplicaDotacion,
      montoEstimado: dotacionEstimada,
    },
  };
}

export function calcularNominaCOL(empleado: EmpleadoCOL): NominaCOLResult {
  const salario = empleado.salarioMensual;

  // Horas extras
  const horasExtras = empleado.tieneHorasExtras
    ? calcularHorasExtras(salario, empleado.horasExtrasDiurnas, empleado.horasExtrasNocturnas)
    : 0;

  const totalDevengado = salario + horasExtras;

  // Seguridad social (empleado + empleador)
  const segSocial = calcularSeguridadSocial(salario, empleado.nivelRiesgoARL);

  // Parafiscales (empleador)
  const parafiscales = calcularParafiscales(salario);

  // Retencion en la fuente
  const retencion = calcularRetencionFuente(totalDevengado);

  // Prestaciones sociales (provision mensual del empleador)
  const prestaciones = calcularPrestacionesCOL(salario);

  // Deducciones empleado
  const totalDeducciones = segSocial.totalEmpleado + retencion.retencion;
  const netoAPagar = Math.round(totalDevengado - totalDeducciones);

  // Provision mensual de prestaciones para costo empleador
  const provisionPrimaMensual = Math.round(prestaciones.prima.montoAnual / 12);
  const provisionCesantiasMensual = Math.round(prestaciones.cesantias.montoAnual / 12);
  const provisionInteresesMensual = Math.round(prestaciones.cesantias.intereses / 12);
  const provisionVacacionesMensual = Math.round(prestaciones.vacaciones.montoAnual / 12);

  const totalCostoEmpleador =
    salario +
    segSocial.totalEmpleador +
    parafiscales.total +
    provisionPrimaMensual +
    provisionCesantiasMensual +
    provisionInteresesMensual +
    provisionVacacionesMensual;

  return {
    empleado,
    salarioBruto: salario,
    horasExtras,
    totalDevengado,
    deducciones: {
      salud: segSocial.salud.empleado,
      pension: segSocial.pension.empleado,
      retencionFuente: retencion.retencion,
      totalDeducciones,
    },
    netoAPagar,
    costoEmpleador: {
      salarioBruto: salario,
      saludEmpleador: segSocial.salud.empleador,
      pensionEmpleador: segSocial.pension.empleador,
      arl: segSocial.arl.empleador,
      cajaCompensacion: segSocial.cajaCompensacion.empleador,
      sena: parafiscales.sena,
      icbf: parafiscales.icbf,
      prima: provisionPrimaMensual,
      cesantias: provisionCesantiasMensual,
      interesesCesantias: provisionInteresesMensual,
      vacaciones: provisionVacacionesMensual,
      totalCosto: totalCostoEmpleador,
    },
    detalleRetencion: retencion,
    detalleSeguridadSocial: segSocial,
    detalleParafiscales: parafiscales,
    detallePrestaciones: prestaciones,
  };
}
