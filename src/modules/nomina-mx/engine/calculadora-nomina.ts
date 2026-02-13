// ============================================
// CALCULADORA PRINCIPAL DE NÓMINA MEXICANA
// Une ISR + IMSS + SDI + ISN en un recibo completo
// ============================================

import type { EmpleadoNomina, PeriodoPago, ReciboNomina, ISNResult } from '../types';
import { calcularISR } from './calculadora-isr';
import { calcularIMSS } from './calculadora-imss';
import { calcularSDI } from './calculadora-sdi';
import { TASAS_ISN } from './tablas-sat';

interface CalculoNominaParams {
  empleado: EmpleadoNomina;
  periodo: PeriodoPago;
  fechaInicio: string;
  fechaFin: string;
  diasTrabajados?: number;
  horasExtraDobles?: number;
  horasExtraTriples?: number;
  premioPuntualidad?: number;
  premioAsistencia?: number;
  comisiones?: number;
  otrasPercepciones?: number;
  otrasDeducciones?: number;
  prestamos?: number;
  primaRiesgoTrabajo?: number;
}

function diasDelPeriodo(tipo: PeriodoPago): number {
  switch (tipo) {
    case 'mensual': return 30;
    case 'quincenal': return 15;
    case 'semanal': return 7;
  }
}

/**
 * Calcula un recibo de nómina completo para un empleado.
 * Incluye ISR, IMSS, INFONAVIT, ISN, y costo total empresa.
 */
export function calcularNomina(params: CalculoNominaParams): ReciboNomina {
  const {
    empleado,
    periodo,
    fechaInicio,
    fechaFin,
    horasExtraDobles = 0,
    horasExtraTriples = 0,
    premioPuntualidad = 0,
    premioAsistencia = 0,
    comisiones = 0,
    otrasPercepciones = 0,
    otrasDeducciones = 0,
    prestamos = 0,
    primaRiesgoTrabajo = 0.005,
  } = params;

  const diasPeriodo = diasDelPeriodo(periodo);
  const diasTrabajados = params.diasTrabajados ?? diasPeriodo;

  // ================================
  // 1. SALARIO DEL PERIODO
  // ================================
  const salarioPeriodo = round2(empleado.salario_diario * diasTrabajados);

  // ================================
  // 2. HORAS EXTRAS
  // ================================
  const valorHora = empleado.salario_diario / 8;
  // Primeras 9 hrs semanales al doble
  const horasExtrasDoblesMonto = round2(horasExtraDobles * valorHora * 2);
  // A partir de ahí al triple
  const horasExtrasTriplesMonto = round2(horasExtraTriples * valorHora * 3);

  // Exención horas extras: primeras 9 semanales, 50% exento
  const heExentas = round2(Math.min(horasExtraDobles * valorHora, horasExtraDobles * valorHora));

  // ================================
  // 3. TOTAL PERCEPCIONES
  // ================================
  const totalPercepciones = round2(
    salarioPeriodo +
    horasExtrasDoblesMonto +
    horasExtrasTriplesMonto +
    premioPuntualidad +
    premioAsistencia +
    comisiones +
    otrasPercepciones
  );

  // Parte gravada vs exenta
  const totalExento = round2(heExentas * 0.5);
  const totalGravado = round2(totalPercepciones - totalExento);

  // ================================
  // 4. ISR
  // ================================
  const isrResult = calcularISR(totalGravado, periodo);

  // ================================
  // 5. SDI e IMSS
  // ================================
  const sdiResult = calcularSDI(empleado.salario_diario, empleado.fecha_ingreso);
  const imssResult = calcularIMSS(sdiResult.sdi, diasPeriodo, primaRiesgoTrabajo);

  // ================================
  // 6. INFONAVIT (descuento al trabajador)
  // ================================
  let infonavitDescuento = 0;
  if (empleado.tiene_infonavit && empleado.valor_descuento_infonavit) {
    switch (empleado.tipo_descuento_infonavit) {
      case 'porcentaje':
        infonavitDescuento = round2(salarioPeriodo * (empleado.valor_descuento_infonavit / 100));
        break;
      case 'cuota_fija':
        infonavitDescuento = empleado.valor_descuento_infonavit;
        break;
      case 'vsm':
        // VSM = Veces Salario Mínimo
        infonavitDescuento = round2(empleado.valor_descuento_infonavit * empleado.salario_diario);
        break;
    }
  }

  // ================================
  // 7. FONACOT
  // ================================
  const fonacotDescuento = empleado.tiene_credito_fonacot ? (empleado.descuento_fonacot ?? 0) : 0;

  // ================================
  // 8. TOTAL DEDUCCIONES
  // ================================
  const totalDeducciones = round2(
    isrResult.isr_a_retener +
    imssResult.total_empleado +
    infonavitDescuento +
    fonacotDescuento +
    prestamos +
    otrasDeducciones
  );

  // ================================
  // 9. NETO A PAGAR
  // ================================
  const netoAPagar = round2(
    totalPercepciones - totalDeducciones + isrResult.subsidio_a_entregar
  );

  // ================================
  // 10. ISN (Impuesto Sobre Nómina - costo patronal)
  // ================================
  const tasaISN = TASAS_ISN[empleado.estado] ?? 0.03;
  const isn = round2(totalPercepciones * tasaISN);

  // ================================
  // 11. COSTO TOTAL EMPRESA
  // ================================
  const costoEmpresa = round2(
    totalPercepciones +
    imssResult.total_empresa +
    isn
  );

  return {
    empleado,
    periodo: {
      tipo: periodo,
      fecha_inicio: fechaInicio,
      fecha_fin: fechaFin,
      dias_periodo: diasPeriodo,
      dias_trabajados: diasTrabajados,
    },
    percepciones: {
      salario: salarioPeriodo,
      horas_extras_dobles: horasExtrasDoblesMonto,
      horas_extras_triples: horasExtrasTriplesMonto,
      premio_puntualidad: premioPuntualidad,
      premio_asistencia: premioAsistencia,
      comisiones,
      otros: otrasPercepciones,
      total_gravado: totalGravado,
      total_exento: totalExento,
      total_percepciones: totalPercepciones,
    },
    deducciones: {
      isr: isrResult.isr_a_retener,
      imss_trabajador: imssResult.total_empleado,
      infonavit: infonavitDescuento,
      fonacot: fonacotDescuento,
      prestamos,
      otros: otrasDeducciones,
      total_deducciones: totalDeducciones,
    },
    subsidio_al_empleo: isrResult.subsidio_a_entregar,
    neto_a_pagar: netoAPagar,
    costo_empresa: {
      salario_bruto: totalPercepciones,
      imss_patron: imssResult.total_empresa,
      infonavit_patron: imssResult.patron.infonavit,
      isn,
      total_costo: costoEmpresa,
    },
    detalle_isr: isrResult,
    detalle_imss: imssResult,
    detalle_sdi: sdiResult,
  };
}

/**
 * Calcula ISN (Impuesto Sobre Nómina) estatal.
 */
export function calcularISN(estado: string, baseGravable: number): ISNResult {
  const tasa = TASAS_ISN[estado] ?? 0.03;
  return {
    estado,
    tasa,
    base: baseGravable,
    impuesto: round2(baseGravable * tasa),
  };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
