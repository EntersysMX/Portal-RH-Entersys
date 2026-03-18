import type { USEmployee, USPaystub, StateTaxResult } from '../types';
import { calcularFederalTax } from './calculadora-federal';
import { calcularFICA } from './calculadora-fica';

const PERIODS_PER_YEAR: Record<string, number> = {
  weekly: 52,
  biweekly: 26,
  semimonthly: 24,
  monthly: 12,
};

function calcularStateTax(employee: USEmployee, preTaxDeductions: number): StateTaxResult {
  const taxableIncome = Math.max(0, employee.annualSalary - preTaxDeductions);
  const stateTax = Math.round(taxableIncome * employee.stateTaxRate * 100) / 100;
  return {
    stateCode: employee.stateCode,
    taxableIncome,
    stateTax,
    effectiveRate: employee.stateTaxRate,
  };
}

export function calcularNominaUSA(employee: USEmployee): USPaystub {
  const periodsPerYear = PERIODS_PER_YEAR[employee.payFrequency] || 24;

  // Pre-tax deductions (annual)
  const annual401k = employee.preTax401k ?? 0;
  const annualHealth = employee.preTaxHealthInsurance ?? 0;
  const totalPreTaxAnnual = annual401k + annualHealth;

  // Federal tax
  const federal = calcularFederalTax(employee.annualSalary, employee.filingStatus, totalPreTaxAnnual);

  // FICA (not reduced by 401k)
  const fica = calcularFICA(employee.annualSalary);

  // State tax
  const state = calcularStateTax(employee, totalPreTaxAnnual);

  // Per-period amounts
  const grossPay = Math.round((employee.annualSalary / periodsPerYear) * 100) / 100;
  const preTax401kPeriod = Math.round((annual401k / periodsPerYear) * 100) / 100;
  const preTaxHealthPeriod = Math.round((annualHealth / periodsPerYear) * 100) / 100;
  const totalPreTaxPeriod = preTax401kPeriod + preTaxHealthPeriod;

  const federalTaxPeriod = Math.round((federal.federalTax / periodsPerYear) * 100) / 100;
  const ssPeriod = Math.round((fica.socialSecurity / periodsPerYear) * 100) / 100;
  const medicarePeriod = Math.round((fica.medicare / periodsPerYear) * 100) / 100;
  const additionalMedicarePeriod = Math.round((fica.additionalMedicare / periodsPerYear) * 100) / 100;
  const stateTaxPeriod = Math.round((state.stateTax / periodsPerYear) * 100) / 100;
  const totalTaxesPeriod = federalTaxPeriod + ssPeriod + medicarePeriod + additionalMedicarePeriod + stateTaxPeriod;

  const netPay = Math.round((grossPay - totalPreTaxPeriod - totalTaxesPeriod) * 100) / 100;

  const totalTaxesAnnual = federal.federalTax + fica.totalFICA + state.stateTax;
  const netAnnual = Math.round((employee.annualSalary - totalPreTaxAnnual - totalTaxesAnnual) * 100) / 100;

  return {
    employee,
    period: {
      frequency: employee.payFrequency,
      periodsPerYear,
    },
    grossPay,
    preTaxDeductions: {
      retirement401k: preTax401kPeriod,
      healthInsurance: preTaxHealthPeriod,
      totalPreTax: totalPreTaxPeriod,
    },
    taxes: {
      federalIncomeTax: federalTaxPeriod,
      socialSecurity: ssPeriod,
      medicare: medicarePeriod,
      additionalMedicare: additionalMedicarePeriod,
      stateTax: stateTaxPeriod,
      totalTaxes: totalTaxesPeriod,
    },
    netPay,
    annualProjection: {
      grossAnnual: employee.annualSalary,
      totalTaxesAnnual,
      totalDeductionsAnnual: totalPreTaxAnnual,
      netAnnual,
    },
    detailFederal: federal,
    detailFICA: fica,
    detailState: state,
  };
}
