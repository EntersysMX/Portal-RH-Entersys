// ============================================
// CALCULADORA DE ISR (Impuesto Sobre la Renta)
// Art. 96 LISR + Subsidio al Empleo
// ============================================

import type { ISRResult } from '../types';
import type { PeriodoPago } from '../types';
import {
  TABLA_ISR_MENSUAL,
  TABLA_ISR_QUINCENAL,
  TABLA_ISR_SEMANAL,
  SUBSIDIO_EMPLEO_MENSUAL,
  SUBSIDIO_EMPLEO_QUINCENAL,
  SUBSIDIO_EMPLEO_SEMANAL,
  type RangoISR,
  type RangoSubsidio,
} from './tablas-sat';

function getTablaISR(periodo: PeriodoPago): RangoISR[] {
  switch (periodo) {
    case 'mensual': return TABLA_ISR_MENSUAL;
    case 'quincenal': return TABLA_ISR_QUINCENAL;
    case 'semanal': return TABLA_ISR_SEMANAL;
  }
}

function getTablaSubsidio(periodo: PeriodoPago): RangoSubsidio[] {
  switch (periodo) {
    case 'mensual': return SUBSIDIO_EMPLEO_MENSUAL;
    case 'quincenal': return SUBSIDIO_EMPLEO_QUINCENAL;
    case 'semanal': return SUBSIDIO_EMPLEO_SEMANAL;
  }
}

/**
 * Calcula el ISR de un periodo dado la base gravable.
 *
 * Procedimiento (Art. 96 LISR):
 * 1. Ubicar el rango en la tabla de ISR
 * 2. Restar el límite inferior a la base gravable = excedente
 * 3. Multiplicar excedente × tasa sobre excedente = impuesto marginal
 * 4. Sumar cuota fija = ISR antes de subsidio
 * 5. Comparar con subsidio al empleo
 * 6. Si ISR > subsidio → retener la diferencia
 *    Si subsidio > ISR → entregar la diferencia al trabajador
 */
export function calcularISR(baseGravable: number, periodo: PeriodoPago): ISRResult {
  const tablaISR = getTablaISR(periodo);
  const tablaSubsidio = getTablaSubsidio(periodo);

  // Buscar el rango correspondiente
  const rango = tablaISR.find(
    (r) => baseGravable >= r.limite_inferior && baseGravable <= r.limite_superior
  );

  if (!rango || baseGravable <= 0) {
    return {
      base_gravable: baseGravable,
      limite_inferior: 0,
      excedente: 0,
      tasa_sobre_excedente: 0,
      impuesto_marginal: 0,
      cuota_fija: 0,
      isr_antes_subsidio: 0,
      subsidio_al_empleo: 0,
      isr_a_retener: 0,
      subsidio_a_entregar: 0,
    };
  }

  // Paso 1-4: Cálculo del ISR
  const excedente = baseGravable - rango.limite_inferior;
  const impuestoMarginal = round2(excedente * rango.tasa_excedente);
  const isrAntesSubsidio = round2(impuestoMarginal + rango.cuota_fija);

  // Paso 5: Buscar subsidio al empleo
  const rangoSubsidio = tablaSubsidio.find(
    (r) => baseGravable >= r.desde && baseGravable <= r.hasta
  );
  const subsidio = rangoSubsidio?.subsidio ?? 0;

  // Paso 6: Determinar retención o entrega
  let isrARetener = 0;
  let subsidioAEntregar = 0;

  if (isrAntesSubsidio >= subsidio) {
    isrARetener = round2(isrAntesSubsidio - subsidio);
  } else {
    subsidioAEntregar = round2(subsidio - isrAntesSubsidio);
  }

  return {
    base_gravable: baseGravable,
    limite_inferior: rango.limite_inferior,
    excedente: round2(excedente),
    tasa_sobre_excedente: rango.tasa_excedente,
    impuesto_marginal: impuestoMarginal,
    cuota_fija: rango.cuota_fija,
    isr_antes_subsidio: isrAntesSubsidio,
    subsidio_al_empleo: subsidio,
    isr_a_retener: isrARetener,
    subsidio_a_entregar: subsidioAEntregar,
  };
}

/**
 * Calcula ISR sobre ingresos extraordinarios (aguinaldo, PTU, prima vacacional)
 * Procedimiento Art. 174 RLISR:
 * 1. Determinar la parte gravada del ingreso extraordinario
 * 2. Dividir entre 365 y multiplicar por 30.4 = ingreso mensual adicional
 * 3. Sumar al salario mensual ordinario
 * 4. Calcular ISR del total y del salario solo
 * 5. La diferencia es la tasa aplicable al extraordinario
 */
export function calcularISRExtraordinario(
  montoGravado: number,
  salarioMensualOrdinario: number
): { tasa_efectiva: number; isr: number } {
  if (montoGravado <= 0) return { tasa_efectiva: 0, isr: 0 };

  // Proporción mensual del ingreso extraordinario
  const proporcionMensual = round2((montoGravado / 365) * 30.4);

  // ISR con el ingreso extraordinario
  const isrConExtra = calcularISR(
    salarioMensualOrdinario + proporcionMensual,
    'mensual'
  );

  // ISR sin el ingreso extraordinario
  const isrSinExtra = calcularISR(salarioMensualOrdinario, 'mensual');

  // Tasa efectiva
  const diferencia = isrConExtra.isr_a_retener - isrSinExtra.isr_a_retener;
  const tasaEfectiva = proporcionMensual > 0 ? diferencia / proporcionMensual : 0;

  // Aplicar tasa al monto total gravado
  const isr = round2(montoGravado * tasaEfectiva);

  return { tasa_efectiva: round4(tasaEfectiva), isr: Math.max(0, isr) };
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function round4(n: number): number {
  return Math.round(n * 10000) / 10000;
}
