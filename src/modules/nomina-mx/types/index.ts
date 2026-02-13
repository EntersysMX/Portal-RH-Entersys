// ============================================
// TIPOS PARA NÓMINA MEXICANA
// ============================================

/** Periodo de pago */
export type PeriodoPago = 'semanal' | 'quincenal' | 'mensual';

/** Datos del empleado para cálculo de nómina */
export interface EmpleadoNomina {
  id: string;
  nombre: string;
  rfc?: string;
  curp?: string;
  nss?: string; // Número de Seguro Social
  fecha_ingreso: string;
  fecha_nacimiento?: string;
  salario_diario: number;
  departamento?: string;
  puesto?: string;
  tipo_contrato: 'Indeterminado' | 'Determinado' | 'Temporal' | 'Prueba' | 'Capacitacion';
  tipo_jornada: 'Diurna' | 'Nocturna' | 'Mixta' | 'Reducida';
  estado: string; // Estado de la república (para ISN)
  tiene_infonavit: boolean;
  tipo_descuento_infonavit?: 'porcentaje' | 'cuota_fija' | 'vsm';
  valor_descuento_infonavit?: number;
  tiene_credito_fonacot?: boolean;
  descuento_fonacot?: number;
}

/** Salario Diario Integrado */
export interface SDIResult {
  salario_diario: number;
  factor_integracion: number;
  sdi: number;
  antiguedad_anios: number;
  dias_aguinaldo: number;
  dias_vacaciones: number;
  prima_vacacional_pct: number;
}

/** Resultado de cálculo de ISR */
export interface ISRResult {
  base_gravable: number;
  limite_inferior: number;
  excedente: number;
  tasa_sobre_excedente: number;
  impuesto_marginal: number;
  cuota_fija: number;
  isr_antes_subsidio: number;
  subsidio_al_empleo: number;
  isr_a_retener: number;
  subsidio_a_entregar: number;
}

/** Cuotas IMSS desglosadas */
export interface IMSSResult {
  // Cuotas patronales
  patron: {
    enf_mat_especie_fija: number;
    enf_mat_especie_excedente: number;
    enf_mat_dinero: number;
    enf_mat_gastos_medicos: number;
    invalidez_vida: number;
    cesantia_vejez: number;
    retiro: number;
    riesgo_trabajo: number;
    guarderia: number;
    infonavit: number;
    total: number;
  };
  // Cuotas del trabajador
  trabajador: {
    enf_mat_especie_excedente: number;
    enf_mat_dinero: number;
    invalidez_vida: number;
    cesantia_vejez: number;
    total: number;
  };
  total_empresa: number;
  total_empleado: number;
}

/** Resultado de ISN (Impuesto Sobre Nómina estatal) */
export interface ISNResult {
  estado: string;
  tasa: number;
  base: number;
  impuesto: number;
}

/** Resultado completo de nómina por empleado */
export interface ReciboNomina {
  empleado: EmpleadoNomina;
  periodo: {
    tipo: PeriodoPago;
    fecha_inicio: string;
    fecha_fin: string;
    dias_periodo: number;
    dias_trabajados: number;
  };
  percepciones: {
    salario: number;
    horas_extras_dobles: number;
    horas_extras_triples: number;
    premio_puntualidad: number;
    premio_asistencia: number;
    comisiones: number;
    otros: number;
    total_gravado: number;
    total_exento: number;
    total_percepciones: number;
  };
  deducciones: {
    isr: number;
    imss_trabajador: number;
    infonavit: number;
    fonacot: number;
    prestamos: number;
    otros: number;
    total_deducciones: number;
  };
  subsidio_al_empleo: number;
  neto_a_pagar: number;
  costo_empresa: {
    salario_bruto: number;
    imss_patron: number;
    infonavit_patron: number;
    isn: number;
    total_costo: number;
  };
  detalle_isr: ISRResult;
  detalle_imss: IMSSResult;
  detalle_sdi: SDIResult;
}

/** Prestaciones anuales */
export interface PrestacionesAnuales {
  aguinaldo: {
    dias: number;
    monto_bruto: number;
    parte_exenta: number;
    parte_gravada: number;
    isr: number;
    neto: number;
  };
  prima_vacacional: {
    dias_vacaciones: number;
    tasa: number;
    monto_bruto: number;
    parte_exenta: number;
    parte_gravada: number;
    isr: number;
    neto: number;
  };
  ptu: {
    dias_trabajados_anio: number;
    salario_topado: number;
    monto_estimado: number;
    parte_exenta: number;
    parte_gravada: number;
    isr: number;
    neto: number;
  };
  vacaciones: {
    dias_correspondientes: number;
    dias_pendientes: number;
    monto_por_dia: number;
  };
}

/** Proyección de nómina */
export interface ProyeccionNomina {
  mes: string;
  total_percepciones: number;
  total_isr: number;
  total_imss_empleado: number;
  total_imss_patron: number;
  total_infonavit: number;
  total_isn: number;
  total_neto: number;
  total_costo_empresa: number;
  headcount: number;
}

/** Configuración de CFDI */
export interface CFDINomina {
  version: '4.0';
  complemento_version: '1.2';
  tipo_nomina: 'O' | 'E'; // Ordinaria | Extraordinaria
  fecha_pago: string;
  fecha_inicio_pago: string;
  fecha_fin_pago: string;
  num_dias_pagados: number;
  total_percepciones: number;
  total_deducciones: number;
  total_otros_pagos: number;
}
