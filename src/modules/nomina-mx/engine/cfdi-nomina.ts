// ============================================
// GENERADOR DE CFDI NÓMINA (Complemento 1.2)
// Estructura XML según especificaciones del SAT
// ============================================
// NOTA: Esto genera la ESTRUCTURA del XML.
// El timbrado (sello digital) requiere un PAC (Proveedor Autorizado de Certificación)
// como Finkok, Digisat, SW SmarterWeb, etc.

import type { ReciboNomina } from '../types';

interface CFDIConfig {
  emisor: {
    rfc: string;
    nombre: string;
    regimen_fiscal: string; // Ej: "601" = General de Ley PM
    lugar_expedicion: string; // CP
  };
  serie?: string;
  folio?: string;
}

/**
 * Genera el XML de CFDI 4.0 con Complemento de Nómina 1.2
 */
export function generarCFDINomina(recibo: ReciboNomina, config: CFDIConfig): string {
  const emp = recibo.empleado;
  const per = recibo.periodo;

  const tipoNomina = 'O'; // O = Ordinaria, E = Extraordinaria
  const totalOtrosPagos = recibo.subsidio_al_empleo;

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<cfdi:Comprobante
  xmlns:cfdi="http://www.sat.gob.mx/cfd/4"
  xmlns:nomina12="http://www.sat.gob.mx/nomina12"
  xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
  xsi:schemaLocation="http://www.sat.gob.mx/cfd/4 http://www.sat.gob.mx/sitio_internet/cfd/4/cfdv40.xsd http://www.sat.gob.mx/nomina12 http://www.sat.gob.mx/sitio_internet/cfd/nomina/nomina12.xsd"
  Version="4.0"
  Serie="${config.serie || 'NOM'}"
  Folio="${config.folio || '001'}"
  Fecha="${new Date().toISOString().replace('Z', '')}"
  SubTotal="${recibo.percepciones.total_percepciones.toFixed(2)}"
  Descuento="${recibo.deducciones.total_deducciones.toFixed(2)}"
  Moneda="MXN"
  Total="${recibo.neto_a_pagar.toFixed(2)}"
  TipoDeComprobante="N"
  Exportacion="01"
  MetodoPago="PUE"
  FormaPago="99"
  LugarExpedicion="${config.emisor.lugar_expedicion}">

  <cfdi:Emisor
    Rfc="${config.emisor.rfc}"
    Nombre="${config.emisor.nombre}"
    RegimenFiscal="${config.emisor.regimen_fiscal}" />

  <cfdi:Receptor
    Rfc="${emp.rfc || 'XAXX010101000'}"
    Nombre="${emp.nombre}"
    DomicilioFiscalReceptor="${config.emisor.lugar_expedicion}"
    RegimenFiscalReceptor="605"
    UsoCFDI="CN01" />

  <cfdi:Conceptos>
    <cfdi:Concepto
      ClaveProdServ="84111505"
      Cantidad="1"
      ClaveUnidad="ACT"
      Descripcion="Pago de nómina"
      ValorUnitario="${recibo.percepciones.total_percepciones.toFixed(2)}"
      Importe="${recibo.percepciones.total_percepciones.toFixed(2)}"
      Descuento="${recibo.deducciones.total_deducciones.toFixed(2)}"
      ObjetoImp="01" />
  </cfdi:Conceptos>

  <cfdi:Complemento>
    <nomina12:Nomina
      Version="1.2"
      TipoNomina="${tipoNomina}"
      FechaPago="${per.fecha_fin}"
      FechaInicialPago="${per.fecha_inicio}"
      FechaFinalPago="${per.fecha_fin}"
      NumDiasPagados="${per.dias_trabajados.toFixed(3)}"
      TotalPercepciones="${recibo.percepciones.total_percepciones.toFixed(2)}"
      TotalDeducciones="${recibo.deducciones.total_deducciones.toFixed(2)}"
      ${totalOtrosPagos > 0 ? `TotalOtrosPagos="${totalOtrosPagos.toFixed(2)}"` : ''}>

      <nomina12:Emisor
        RegistroPatronal="${emp.nss ? emp.nss.substring(0, 11) : ''}" />

      <nomina12:Receptor
        Curp="${emp.curp || ''}"
        NumSeguridadSocial="${emp.nss || ''}"
        FechaInicioRelLaboral="${emp.fecha_ingreso}"
        Antigüedad="P${Math.floor(recibo.detalle_sdi.antiguedad_anios * 52)}W"
        TipoContrato="${mapTipoContrato(emp.tipo_contrato)}"
        TipoJornada="${mapTipoJornada(emp.tipo_jornada)}"
        TipoRegimen="02"
        NumEmpleado="${emp.id}"
        Departamento="${emp.departamento || ''}"
        Puesto="${emp.puesto || ''}"
        PeriodicidadPago="${mapPeriodicidad(per.tipo)}"
        SalarioBaseCotApor="${recibo.detalle_sdi.sdi.toFixed(2)}"
        SalarioDiarioIntegrado="${recibo.detalle_sdi.sdi.toFixed(2)}"
        ClaveEntFed="${emp.estado ? getClaveEntidad(emp.estado) : 'DIF'}" />

      <nomina12:Percepciones
        TotalSueldos="${recibo.percepciones.total_percepciones.toFixed(2)}"
        TotalGravado="${recibo.percepciones.total_gravado.toFixed(2)}"
        TotalExento="${recibo.percepciones.total_exento.toFixed(2)}">

        <nomina12:Percepcion
          TipoPercepcion="001"
          Clave="001"
          Concepto="Sueldo"
          ImporteGravado="${recibo.percepciones.salario.toFixed(2)}"
          ImporteExento="0.00" />

        ${recibo.percepciones.horas_extras_dobles > 0 ? `
        <nomina12:Percepcion
          TipoPercepcion="019"
          Clave="019"
          Concepto="Horas Extra Dobles"
          ImporteGravado="${(recibo.percepciones.horas_extras_dobles * 0.5).toFixed(2)}"
          ImporteExento="${(recibo.percepciones.horas_extras_dobles * 0.5).toFixed(2)}" />` : ''}

        ${recibo.percepciones.premio_puntualidad > 0 ? `
        <nomina12:Percepcion
          TipoPercepcion="010"
          Clave="010"
          Concepto="Premio por puntualidad"
          ImporteGravado="${recibo.percepciones.premio_puntualidad.toFixed(2)}"
          ImporteExento="0.00" />` : ''}

        ${recibo.percepciones.premio_asistencia > 0 ? `
        <nomina12:Percepcion
          TipoPercepcion="010"
          Clave="011"
          Concepto="Premio por asistencia"
          ImporteGravado="${recibo.percepciones.premio_asistencia.toFixed(2)}"
          ImporteExento="0.00" />` : ''}
      </nomina12:Percepciones>

      <nomina12:Deducciones
        TotalOtrasDeducciones="${recibo.deducciones.total_deducciones.toFixed(2)}"
        TotalImpuestosRetenidos="${recibo.deducciones.isr.toFixed(2)}">

        <nomina12:Deduccion
          TipoDeduccion="002"
          Clave="002"
          Concepto="ISR"
          Importe="${recibo.deducciones.isr.toFixed(2)}" />

        <nomina12:Deduccion
          TipoDeduccion="001"
          Clave="001"
          Concepto="Seguridad Social (IMSS Trabajador)"
          Importe="${recibo.deducciones.imss_trabajador.toFixed(2)}" />

        ${recibo.deducciones.infonavit > 0 ? `
        <nomina12:Deduccion
          TipoDeduccion="010"
          Clave="010"
          Concepto="Descuento INFONAVIT"
          Importe="${recibo.deducciones.infonavit.toFixed(2)}" />` : ''}

        ${recibo.deducciones.fonacot > 0 ? `
        <nomina12:Deduccion
          TipoDeduccion="011"
          Clave="011"
          Concepto="Descuento FONACOT"
          Importe="${recibo.deducciones.fonacot.toFixed(2)}" />` : ''}
      </nomina12:Deducciones>

      ${totalOtrosPagos > 0 ? `
      <nomina12:OtrosPagos>
        <nomina12:OtroPago
          TipoOtroPago="002"
          Clave="002"
          Concepto="Subsidio para el empleo"
          Importe="${totalOtrosPagos.toFixed(2)}">
          <nomina12:SubsidioAlEmpleo SubsidioCausado="${totalOtrosPagos.toFixed(2)}" />
        </nomina12:OtroPago>
      </nomina12:OtrosPagos>` : ''}

    </nomina12:Nomina>
  </cfdi:Complemento>
</cfdi:Comprobante>`;

  return xml;
}

// Mapeos de catálogos SAT
function mapTipoContrato(tipo: string): string {
  const map: Record<string, string> = {
    'Indeterminado': '01',
    'Determinado': '02',
    'Temporal': '03',
    'Prueba': '04',
    'Capacitacion': '05',
  };
  return map[tipo] || '01';
}

function mapTipoJornada(tipo: string): string {
  const map: Record<string, string> = {
    'Diurna': '01',
    'Nocturna': '02',
    'Mixta': '03',
    'Reducida': '99',
  };
  return map[tipo] || '01';
}

function mapPeriodicidad(tipo: string): string {
  const map: Record<string, string> = {
    'semanal': '02',
    'quincenal': '04',
    'mensual': '05',
  };
  return map[tipo] || '04';
}

function getClaveEntidad(estado: string): string {
  const map: Record<string, string> = {
    'Aguascalientes': 'AGU', 'Baja California': 'BCN', 'Baja California Sur': 'BCS',
    'Campeche': 'CAM', 'Chiapas': 'CHP', 'Chihuahua': 'CHH',
    'Ciudad de México': 'DIF', 'Coahuila': 'COA', 'Colima': 'COL',
    'Durango': 'DUR', 'Estado de México': 'MEX', 'Guanajuato': 'GUA',
    'Guerrero': 'GRO', 'Hidalgo': 'HID', 'Jalisco': 'JAL',
    'Michoacán': 'MIC', 'Morelos': 'MOR', 'Nayarit': 'NAY',
    'Nuevo León': 'NLE', 'Oaxaca': 'OAX', 'Puebla': 'PUE',
    'Querétaro': 'QUE', 'Quintana Roo': 'ROO', 'San Luis Potosí': 'SLP',
    'Sinaloa': 'SIN', 'Sonora': 'SON', 'Tabasco': 'TAB',
    'Tamaulipas': 'TAM', 'Tlaxcala': 'TLA', 'Veracruz': 'VER',
    'Yucatán': 'YUC', 'Zacatecas': 'ZAC',
  };
  return map[estado] || 'DIF';
}
