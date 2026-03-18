import type { RetencionFuenteResult } from '../types';

// UVT 2024
const UVT_2024 = 47_065;

// Tabla Art. 383 ET — Retencion en la fuente para empleados
const TABLA_RETENCION: { minUVT: number; maxUVT: number; tarifa: number; adicionalUVT: number; baseUVT: number }[] = [
  { minUVT: 0,    maxUVT: 95,   tarifa: 0,    adicionalUVT: 0,   baseUVT: 0 },
  { minUVT: 95,   maxUVT: 150,  tarifa: 0.19, adicionalUVT: 0,   baseUVT: 95 },
  { minUVT: 150,  maxUVT: 360,  tarifa: 0.28, adicionalUVT: 10,  baseUVT: 150 },
  { minUVT: 360,  maxUVT: 640,  tarifa: 0.33, adicionalUVT: 69,  baseUVT: 360 },
  { minUVT: 640,  maxUVT: 945,  tarifa: 0.35, adicionalUVT: 162, baseUVT: 640 },
  { minUVT: 945,  maxUVT: 2300, tarifa: 0.37, adicionalUVT: 268, baseUVT: 945 },
  { minUVT: 2300, maxUVT: Infinity, tarifa: 0.39, adicionalUVT: 770, baseUVT: 2300 },
];

export function calcularRetencionFuente(ingresoMensual: number): RetencionFuenteResult {
  const ingresoEnUVT = ingresoMensual / UVT_2024;

  let retencionUVT = 0;
  let tarifaMarginal = 0;
  let rangoUVT = '0 – 95 UVT';

  for (const rango of TABLA_RETENCION) {
    if (ingresoEnUVT > rango.minUVT) {
      if (ingresoEnUVT <= rango.maxUVT || rango.maxUVT === Infinity) {
        const excedente = ingresoEnUVT - rango.baseUVT;
        retencionUVT = rango.adicionalUVT + excedente * rango.tarifa;
        tarifaMarginal = rango.tarifa;
        const maxLabel = rango.maxUVT === Infinity ? '+' : rango.maxUVT;
        rangoUVT = `${rango.minUVT} – ${maxLabel} UVT`;
        break;
      }
    }
  }

  // Si el ingreso esta en el primer rango (0-95 UVT), retencion es 0
  if (ingresoEnUVT <= 95) {
    retencionUVT = 0;
    tarifaMarginal = 0;
    rangoUVT = '0 – 95 UVT';
  }

  const retencion = Math.round(retencionUVT * UVT_2024 * 100) / 100;
  const tarifaEfectiva = ingresoMensual > 0 ? Math.round((retencion / ingresoMensual) * 10000) / 10000 : 0;

  return {
    ingresoMensual,
    ingresoEnUVT: Math.round(ingresoEnUVT * 100) / 100,
    uvtValor: UVT_2024,
    rangoUVT,
    tarifaMarginal,
    retencion,
    tarifaEfectiva,
  };
}
