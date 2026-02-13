// ============================================
// TABLAS DEL SAT PARA ISR 2024-2026
// ============================================
// Fuente: DOF - Anexo 8 de la Resolución Miscelánea Fiscal
// Estas tablas se actualizan anualmente. Aquí están las vigentes.

/** Rango de la tabla de ISR */
export interface RangoISR {
  limite_inferior: number;
  limite_superior: number;
  cuota_fija: number;
  tasa_excedente: number; // Porcentaje (0.0192 = 1.92%)
}

/** Rango de subsidio al empleo */
export interface RangoSubsidio {
  desde: number;
  hasta: number;
  subsidio: number;
}

// ============================================
// TABLA MENSUAL DE ISR (Art. 96 LISR)
// ============================================
export const TABLA_ISR_MENSUAL: RangoISR[] = [
  { limite_inferior: 0.01,      limite_superior: 746.04,     cuota_fija: 0,        tasa_excedente: 0.0192 },
  { limite_inferior: 746.05,    limite_superior: 6332.05,    cuota_fija: 14.32,    tasa_excedente: 0.0640 },
  { limite_inferior: 6332.06,   limite_superior: 11128.01,   cuota_fija: 371.83,   tasa_excedente: 0.1088 },
  { limite_inferior: 11128.02,  limite_superior: 12935.82,   cuota_fija: 893.63,   tasa_excedente: 0.16 },
  { limite_inferior: 12935.83,  limite_superior: 15487.71,   cuota_fija: 1182.88,  tasa_excedente: 0.1792 },
  { limite_inferior: 15487.72,  limite_superior: 31236.49,   cuota_fija: 1640.18,  tasa_excedente: 0.2136 },
  { limite_inferior: 31236.50,  limite_superior: 49233.00,   cuota_fija: 5004.12,  tasa_excedente: 0.2352 },
  { limite_inferior: 49233.01,  limite_superior: 93993.90,   cuota_fija: 9236.89,  tasa_excedente: 0.30 },
  { limite_inferior: 93993.91,  limite_superior: 125325.20,  cuota_fija: 22665.17, tasa_excedente: 0.32 },
  { limite_inferior: 125325.21, limite_superior: 375975.61,  cuota_fija: 32691.18, tasa_excedente: 0.34 },
  { limite_inferior: 375975.62, limite_superior: Infinity,   cuota_fija: 117912.32,tasa_excedente: 0.35 },
];

// ============================================
// TABLA QUINCENAL DE ISR
// ============================================
export const TABLA_ISR_QUINCENAL: RangoISR[] = [
  { limite_inferior: 0.01,      limite_superior: 368.10,     cuota_fija: 0,        tasa_excedente: 0.0192 },
  { limite_inferior: 368.11,    limite_superior: 3124.35,    cuota_fija: 7.05,     tasa_excedente: 0.0640 },
  { limite_inferior: 3124.36,   limite_superior: 5490.75,    cuota_fija: 183.45,   tasa_excedente: 0.1088 },
  { limite_inferior: 5490.76,   limite_superior: 6382.80,    cuota_fija: 441.00,   tasa_excedente: 0.16 },
  { limite_inferior: 6382.81,   limite_superior: 7641.90,    cuota_fija: 583.65,   tasa_excedente: 0.1792 },
  { limite_inferior: 7641.91,   limite_superior: 15412.50,   cuota_fija: 809.25,   tasa_excedente: 0.2136 },
  { limite_inferior: 15412.51,  limite_superior: 24290.25,   cuota_fija: 2469.15,  tasa_excedente: 0.2352 },
  { limite_inferior: 24290.26,  limite_superior: 46378.50,   cuota_fija: 4557.00,  tasa_excedente: 0.30 },
  { limite_inferior: 46378.51,  limite_superior: 61837.65,   cuota_fija: 11183.55, tasa_excedente: 0.32 },
  { limite_inferior: 61837.66,  limite_superior: 185512.95,  cuota_fija: 16130.40, tasa_excedente: 0.34 },
  { limite_inferior: 185512.96, limite_superior: Infinity,   cuota_fija: 58180.20, tasa_excedente: 0.35 },
];

// ============================================
// TABLA SEMANAL DE ISR
// ============================================
export const TABLA_ISR_SEMANAL: RangoISR[] = [
  { limite_inferior: 0.01,      limite_superior: 171.78,     cuota_fija: 0,        tasa_excedente: 0.0192 },
  { limite_inferior: 171.79,    limite_superior: 1458.03,    cuota_fija: 3.29,     tasa_excedente: 0.0640 },
  { limite_inferior: 1458.04,   limite_superior: 2562.35,    cuota_fija: 85.61,    tasa_excedente: 0.1088 },
  { limite_inferior: 2562.36,   limite_superior: 2978.64,    cuota_fija: 205.80,   tasa_excedente: 0.16 },
  { limite_inferior: 2978.65,   limite_superior: 3566.22,    cuota_fija: 272.37,   tasa_excedente: 0.1792 },
  { limite_inferior: 3566.23,   limite_superior: 7192.50,    cuota_fija: 377.65,   tasa_excedente: 0.2136 },
  { limite_inferior: 7192.51,   limite_superior: 11335.45,   cuota_fija: 1152.27,  tasa_excedente: 0.2352 },
  { limite_inferior: 11335.46,  limite_superior: 21643.30,   cuota_fija: 2126.60,  tasa_excedente: 0.30 },
  { limite_inferior: 21643.31,  limite_superior: 28857.57,   cuota_fija: 5218.92,  tasa_excedente: 0.32 },
  { limite_inferior: 28857.58,  limite_superior: 86572.71,   cuota_fija: 7527.52,  tasa_excedente: 0.34 },
  { limite_inferior: 86572.72,  limite_superior: Infinity,   cuota_fija: 27150.76, tasa_excedente: 0.35 },
];

// ============================================
// SUBSIDIO AL EMPLEO MENSUAL (Art. 1.12 Decreto)
// ============================================
export const SUBSIDIO_EMPLEO_MENSUAL: RangoSubsidio[] = [
  { desde: 0.01,     hasta: 1768.96,  subsidio: 407.02 },
  { desde: 1768.97,  hasta: 2653.38,  subsidio: 406.83 },
  { desde: 2653.39,  hasta: 3472.84,  subsidio: 406.62 },
  { desde: 3472.85,  hasta: 3537.87,  subsidio: 392.77 },
  { desde: 3537.88,  hasta: 4446.15,  subsidio: 382.46 },
  { desde: 4446.16,  hasta: 4717.18,  subsidio: 354.23 },
  { desde: 4717.19,  hasta: 5335.42,  subsidio: 324.87 },
  { desde: 5335.43,  hasta: 6224.67,  subsidio: 294.63 },
  { desde: 6224.68,  hasta: 7113.90,  subsidio: 253.54 },
  { desde: 7113.91,  hasta: 7382.33,  subsidio: 217.61 },
  { desde: 7382.34,  hasta: Infinity,  subsidio: 0 },
];

export const SUBSIDIO_EMPLEO_QUINCENAL: RangoSubsidio[] = [
  { desde: 0.01,     hasta: 872.85,   subsidio: 200.85 },
  { desde: 872.86,   hasta: 1309.20,  subsidio: 200.70 },
  { desde: 1309.21,  hasta: 1713.60,  subsidio: 200.70 },
  { desde: 1713.61,  hasta: 1745.70,  subsidio: 193.80 },
  { desde: 1745.71,  hasta: 2193.75,  subsidio: 188.70 },
  { desde: 2193.76,  hasta: 2327.55,  subsidio: 174.75 },
  { desde: 2327.56,  hasta: 2632.65,  subsidio: 160.35 },
  { desde: 2632.66,  hasta: 3071.40,  subsidio: 145.35 },
  { desde: 3071.41,  hasta: 3510.15,  subsidio: 125.10 },
  { desde: 3510.16,  hasta: 3642.60,  subsidio: 107.40 },
  { desde: 3642.61,  hasta: Infinity,  subsidio: 0 },
];

export const SUBSIDIO_EMPLEO_SEMANAL: RangoSubsidio[] = [
  { desde: 0.01,     hasta: 407.33,   subsidio: 93.73 },
  { desde: 407.34,   hasta: 610.96,   subsidio: 93.66 },
  { desde: 610.97,   hasta: 799.68,   subsidio: 93.66 },
  { desde: 799.69,   hasta: 814.66,   subsidio: 90.44 },
  { desde: 814.67,   hasta: 1023.75,  subsidio: 88.06 },
  { desde: 1023.76,  hasta: 1086.19,  subsidio: 81.55 },
  { desde: 1086.20,  hasta: 1228.57,  subsidio: 74.83 },
  { desde: 1228.58,  hasta: 1433.32,  subsidio: 67.83 },
  { desde: 1433.33,  hasta: 1638.07,  subsidio: 58.38 },
  { desde: 1638.08,  hasta: 1699.87,  subsidio: 50.12 },
  { desde: 1699.88,  hasta: Infinity,  subsidio: 0 },
];

// ============================================
// UMA (Unidad de Medida y Actualización) 2026
// ============================================
export const UMA_DIARIO = 113.14;  // Actualizar con valor oficial 2026
export const UMA_MENSUAL = UMA_DIARIO * 30.4;
export const UMA_ANUAL = UMA_DIARIO * 365;

// ============================================
// SALARIO MÍNIMO 2026
// ============================================
export const SALARIO_MINIMO_GENERAL = 278.80; // Diario - Actualizar con valor oficial
export const SALARIO_MINIMO_FRONTERA = 419.88; // Zona Libre Frontera Norte

// ============================================
// TASAS IMSS 2026 (Ley del Seguro Social)
// ============================================
export const TASAS_IMSS = {
  // Enfermedades y Maternidad - Prestaciones en especie
  enf_mat_especie_fija: {
    patron: 0.204, // 20.40% del salario mínimo (cuota fija)
  },
  enf_mat_especie_excedente: {
    // Sobre la diferencia de SBC y 3 UMA
    patron: 0.011, // 1.10%
    trabajador: 0.004, // 0.40%
  },
  // Enfermedades y Maternidad - Prestaciones en dinero
  enf_mat_dinero: {
    patron: 0.0070, // 0.70%
    trabajador: 0.0025, // 0.25%
  },
  // Gastos médicos para pensionados
  enf_mat_gastos_medicos: {
    patron: 0.0105, // 1.05%
    trabajador: 0.00375, // 0.375%
  },
  // Invalidez y Vida
  invalidez_vida: {
    patron: 0.0175, // 1.75%
    trabajador: 0.00625, // 0.625%
  },
  // Cesantía en Edad Avanzada y Vejez
  cesantia_vejez: {
    patron: 0.03150, // 3.150% (incluye incremento gradual)
    trabajador: 0.01125, // 1.125%
  },
  // Retiro (SAR)
  retiro: {
    patron: 0.02, // 2.00%
  },
  // Riesgo de Trabajo (varía por empresa, clase I por defecto)
  riesgo_trabajo: {
    patron: 0.005, // 0.50% (Clase I - riesgo bajo, rango: 0.50% a 7.59%)
  },
  // Guarderías y Prestaciones Sociales
  guarderia: {
    patron: 0.01, // 1.00%
  },
  // INFONAVIT
  infonavit: {
    patron: 0.05, // 5.00%
  },
  // Tope de cotización
  tope_sbc: 25, // 25 UMA diarios
};

// ============================================
// IMPUESTO SOBRE NÓMINA (ISN) POR ESTADO
// ============================================
export const TASAS_ISN: Record<string, number> = {
  'Aguascalientes': 0.03,
  'Baja California': 0.0335,
  'Baja California Sur': 0.025,
  'Campeche': 0.03,
  'Chiapas': 0.02,
  'Chihuahua': 0.03,
  'Ciudad de México': 0.03,
  'Coahuila': 0.03,
  'Colima': 0.02,
  'Durango': 0.02,
  'Estado de México': 0.03,
  'Guanajuato': 0.03,
  'Guerrero': 0.02,
  'Hidalgo': 0.03,
  'Jalisco': 0.03,
  'Michoacán': 0.03,
  'Morelos': 0.02,
  'Nayarit': 0.02,
  'Nuevo León': 0.03,
  'Oaxaca': 0.03,
  'Puebla': 0.03,
  'Querétaro': 0.03,
  'Quintana Roo': 0.03,
  'San Luis Potosí': 0.03,
  'Sinaloa': 0.03,
  'Sonora': 0.03,
  'Tabasco': 0.03,
  'Tamaulipas': 0.03,
  'Tlaxcala': 0.03,
  'Veracruz': 0.03,
  'Yucatán': 0.03,
  'Zacatecas': 0.03,
};

// ============================================
// TABLA DE VACACIONES LFT (Art. 76, reforma 2023)
// ============================================
export const DIAS_VACACIONES_LFT: { anios: number; dias: number }[] = [
  { anios: 1, dias: 12 },
  { anios: 2, dias: 14 },
  { anios: 3, dias: 16 },
  { anios: 4, dias: 18 },
  { anios: 5, dias: 20 },
  // De 6 a 10: se agregan 2 días por cada 5 años
  { anios: 6, dias: 22 },
  { anios: 7, dias: 22 },
  { anios: 8, dias: 22 },
  { anios: 9, dias: 22 },
  { anios: 10, dias: 22 },
  { anios: 11, dias: 24 },
  { anios: 12, dias: 24 },
  { anios: 13, dias: 24 },
  { anios: 14, dias: 24 },
  { anios: 15, dias: 24 },
  // De 16 a 20: 26 días
  { anios: 16, dias: 26 },
  { anios: 17, dias: 26 },
  { anios: 18, dias: 26 },
  { anios: 19, dias: 26 },
  { anios: 20, dias: 26 },
  // De 21 a 25: 28 días
  { anios: 21, dias: 28 },
  { anios: 22, dias: 28 },
  { anios: 23, dias: 28 },
  { anios: 24, dias: 28 },
  { anios: 25, dias: 28 },
  // De 26 a 30: 30 días
  { anios: 26, dias: 30 },
  { anios: 27, dias: 30 },
  { anios: 28, dias: 30 },
  { anios: 29, dias: 30 },
  { anios: 30, dias: 30 },
  // De 31 a 35: 32 días
  { anios: 31, dias: 32 },
];

/** Obtener días de vacaciones por antigüedad */
export function getDiasVacaciones(aniosAntiguedad: number): number {
  if (aniosAntiguedad < 1) return 0;
  const entry = DIAS_VACACIONES_LFT.find((d) => d.anios === Math.floor(aniosAntiguedad));
  if (entry) return entry.dias;
  // Para más de 31 años: 32 + 2 por cada 5 años adicionales
  const extra = Math.floor((aniosAntiguedad - 31) / 5);
  return 32 + extra * 2;
}

// Constantes de prestaciones
export const DIAS_AGUINALDO_MINIMO = 15; // Art. 87 LFT
export const PRIMA_VACACIONAL_MINIMA = 0.25; // 25% Art. 80 LFT
export const PTU_PORCENTAJE = 0.10; // 10% Art. 117-131 LFT
export const PTU_TOPE_MESES = 3; // Tope: 3 meses de salario o promedio últimos 3 años
