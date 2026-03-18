// Types for Colombian Payroll (Nomina Colombia)

export type TipoContratoCOL = 'indefinido' | 'fijo' | 'obra_labor' | 'prestacion_servicios';

export type NivelRiesgoARL = 'I' | 'II' | 'III' | 'IV' | 'V';

export interface EmpleadoCOL {
  id: string;
  nombre: string;
  salarioMensual: number;
  tipoContrato: TipoContratoCOL;
  nivelRiesgoARL: NivelRiesgoARL;
  fondoPension: string;
  fondoSalud: string;
  tieneHorasExtras: boolean;
  horasExtrasDiurnas: number;
  horasExtrasNocturnas: number;
}

export interface RetencionFuenteResult {
  ingresoMensual: number;
  ingresoEnUVT: number;
  uvtValor: number;
  rangoUVT: string;
  tarifaMarginal: number;
  retencion: number;
  tarifaEfectiva: number;
}

export interface SeguridadSocialResult {
  salud: {
    empleado: number;
    empleador: number;
    tasaEmpleado: number;
    tasaEmpleador: number;
  };
  pension: {
    empleado: number;
    empleador: number;
    tasaEmpleado: number;
    tasaEmpleador: number;
  };
  arl: {
    empleador: number;
    tasa: number;
    nivel: NivelRiesgoARL;
  };
  cajaCompensacion: {
    empleador: number;
    tasa: number;
  };
  totalEmpleado: number;
  totalEmpleador: number;
}

export interface ParafiscalesResult {
  sena: number;
  icbf: number;
  total: number;
}

export interface PrestacionesCOLResult {
  prima: {
    diasBase: number;
    montoPorPeriodo: number; // semestral
    montoAnual: number;
  };
  cesantias: {
    montoAnual: number;
    intereses: number;
    tasaIntereses: number;
  };
  vacaciones: {
    diasHabiles: number;
    montoAnual: number;
  };
  dotacion: {
    aplica: boolean;
    montoEstimado: number;
  };
}

export interface NominaCOLResult {
  empleado: EmpleadoCOL;
  salarioBruto: number;
  horasExtras: number;
  totalDevengado: number;
  deducciones: {
    salud: number;
    pension: number;
    retencionFuente: number;
    totalDeducciones: number;
  };
  netoAPagar: number;
  costoEmpleador: {
    salarioBruto: number;
    saludEmpleador: number;
    pensionEmpleador: number;
    arl: number;
    cajaCompensacion: number;
    sena: number;
    icbf: number;
    prima: number;
    cesantias: number;
    interesesCesantias: number;
    vacaciones: number;
    totalCosto: number;
  };
  detalleRetencion: RetencionFuenteResult;
  detalleSeguridadSocial: SeguridadSocialResult;
  detalleParafiscales: ParafiscalesResult;
  detallePrestaciones: PrestacionesCOLResult;
}
