// Types for US Payroll (Nómina USA)

export type PayFrequency = 'weekly' | 'biweekly' | 'semimonthly' | 'monthly';

export type FilingStatus = 'single' | 'married_jointly' | 'married_separately' | 'head_of_household';

export interface USEmployee {
  id: string;
  name: string;
  annualSalary: number;
  payFrequency: PayFrequency;
  filingStatus: FilingStatus;
  stateCode: string;
  stateTaxRate: number; // manual override, default 0
  allowances: number; // W-4 allowances
  additionalWithholding: number;
  preTax401k: number; // annual 401k contribution
  preTaxHealthInsurance: number; // annual health insurance
}

export interface FederalTaxResult {
  grossAnnual: number;
  taxableIncome: number;
  federalTax: number;
  effectiveRate: number;
  marginalRate: number;
  brackets: { range: string; rate: number; tax: number }[];
}

export interface FICAResult {
  socialSecurity: number;
  socialSecurityRate: number;
  socialSecurityBase: number;
  medicare: number;
  medicareRate: number;
  additionalMedicare: number;
  totalFICA: number;
  employerMatch: number;
}

export interface StateTaxResult {
  stateCode: string;
  taxableIncome: number;
  stateTax: number;
  effectiveRate: number;
}

export interface USPaystub {
  employee: USEmployee;
  period: {
    frequency: PayFrequency;
    periodsPerYear: number;
  };
  grossPay: number;
  preTaxDeductions: {
    retirement401k: number;
    healthInsurance: number;
    totalPreTax: number;
  };
  taxes: {
    federalIncomeTax: number;
    socialSecurity: number;
    medicare: number;
    additionalMedicare: number;
    stateTax: number;
    totalTaxes: number;
  };
  netPay: number;
  annualProjection: {
    grossAnnual: number;
    totalTaxesAnnual: number;
    totalDeductionsAnnual: number;
    netAnnual: number;
  };
  detailFederal: FederalTaxResult;
  detailFICA: FICAResult;
  detailState: StateTaxResult;
}
