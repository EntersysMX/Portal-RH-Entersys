import type { FederalTaxResult, FilingStatus } from '../types';

// 2024 Federal Income Tax Brackets
const BRACKETS: Record<FilingStatus, { min: number; max: number; rate: number }[]> = {
  single: [
    { min: 0, max: 11_600, rate: 0.10 },
    { min: 11_600, max: 47_150, rate: 0.12 },
    { min: 47_150, max: 100_525, rate: 0.22 },
    { min: 100_525, max: 191_950, rate: 0.24 },
    { min: 191_950, max: 243_725, rate: 0.32 },
    { min: 243_725, max: 609_350, rate: 0.35 },
    { min: 609_350, max: Infinity, rate: 0.37 },
  ],
  married_jointly: [
    { min: 0, max: 23_200, rate: 0.10 },
    { min: 23_200, max: 94_300, rate: 0.12 },
    { min: 94_300, max: 201_050, rate: 0.22 },
    { min: 201_050, max: 383_900, rate: 0.24 },
    { min: 383_900, max: 487_450, rate: 0.32 },
    { min: 487_450, max: 731_200, rate: 0.35 },
    { min: 731_200, max: Infinity, rate: 0.37 },
  ],
  married_separately: [
    { min: 0, max: 11_600, rate: 0.10 },
    { min: 11_600, max: 47_150, rate: 0.12 },
    { min: 47_150, max: 100_525, rate: 0.22 },
    { min: 100_525, max: 191_950, rate: 0.24 },
    { min: 191_950, max: 243_725, rate: 0.32 },
    { min: 243_725, max: 365_600, rate: 0.35 },
    { min: 365_600, max: Infinity, rate: 0.37 },
  ],
  head_of_household: [
    { min: 0, max: 16_550, rate: 0.10 },
    { min: 16_550, max: 63_100, rate: 0.12 },
    { min: 63_100, max: 100_500, rate: 0.22 },
    { min: 100_500, max: 191_950, rate: 0.24 },
    { min: 191_950, max: 243_700, rate: 0.32 },
    { min: 243_700, max: 609_350, rate: 0.35 },
    { min: 609_350, max: Infinity, rate: 0.37 },
  ],
};

// Standard deduction 2024
const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 14_600,
  married_jointly: 29_200,
  married_separately: 14_600,
  head_of_household: 21_900,
};

export function calcularFederalTax(
  grossAnnual: number,
  filingStatus: FilingStatus,
  preTaxDeductions: number = 0,
): FederalTaxResult {
  const standardDed = STANDARD_DEDUCTION[filingStatus];
  const taxableIncome = Math.max(0, grossAnnual - preTaxDeductions - standardDed);
  const brackets = BRACKETS[filingStatus];

  let totalTax = 0;
  let marginalRate = 0;
  const bracketDetails: { range: string; rate: number; tax: number }[] = [];

  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    const taxInBracket = taxableInBracket * bracket.rate;
    totalTax += taxInBracket;
    marginalRate = bracket.rate;
    const maxLabel = bracket.max === Infinity ? '+' : `$${bracket.max.toLocaleString()}`;
    bracketDetails.push({
      range: `$${bracket.min.toLocaleString()} – ${maxLabel}`,
      rate: bracket.rate,
      tax: Math.round(taxInBracket * 100) / 100,
    });
  }

  return {
    grossAnnual,
    taxableIncome: Math.round(taxableIncome * 100) / 100,
    federalTax: Math.round(totalTax * 100) / 100,
    effectiveRate: grossAnnual > 0 ? Math.round((totalTax / grossAnnual) * 10000) / 10000 : 0,
    marginalRate,
    brackets: bracketDetails,
  };
}
