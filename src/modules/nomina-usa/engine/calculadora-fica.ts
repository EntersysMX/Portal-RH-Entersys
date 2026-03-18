import type { FICAResult } from '../types';

// 2024 FICA rates
const SS_RATE = 0.062; // Social Security employee rate
const SS_WAGE_BASE = 168_600; // 2024 wage base
const MEDICARE_RATE = 0.0145;
const ADDITIONAL_MEDICARE_THRESHOLD = 200_000; // single filer
const ADDITIONAL_MEDICARE_RATE = 0.009;

export function calcularFICA(grossAnnual: number, _preTaxDeductions: number = 0): FICAResult {
  // FICA is calculated on gross wages (pre-tax deductions like 401k don't reduce FICA base)
  // However, health insurance (cafeteria plan) does reduce FICA base
  // For simplicity: FICA base = grossAnnual (401k does NOT reduce FICA)
  const ficaBase = grossAnnual;

  // Social Security
  const ssBase = Math.min(ficaBase, SS_WAGE_BASE);
  const socialSecurity = Math.round(ssBase * SS_RATE * 100) / 100;

  // Medicare
  const medicare = Math.round(ficaBase * MEDICARE_RATE * 100) / 100;

  // Additional Medicare (employee-only, no employer match)
  const additionalMedicare = ficaBase > ADDITIONAL_MEDICARE_THRESHOLD
    ? Math.round((ficaBase - ADDITIONAL_MEDICARE_THRESHOLD) * ADDITIONAL_MEDICARE_RATE * 100) / 100
    : 0;

  const totalFICA = socialSecurity + medicare + additionalMedicare;

  // Employer match (no additional medicare)
  const employerSS = Math.round(ssBase * SS_RATE * 100) / 100;
  const employerMedicare = Math.round(ficaBase * MEDICARE_RATE * 100) / 100;
  const employerMatch = employerSS + employerMedicare;

  return {
    socialSecurity,
    socialSecurityRate: SS_RATE,
    socialSecurityBase: ssBase,
    medicare,
    medicareRate: MEDICARE_RATE,
    additionalMedicare,
    totalFICA,
    employerMatch,
  };
}
