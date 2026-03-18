import { useState, useMemo } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  BarChart3,
  Building2,
  PieChart as PieChartIcon,
} from 'lucide-react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend,
} from 'recharts';
import StatsCard from '@/components/ui/StatsCard';
import { calcularNominaUSA } from '@/modules/nomina-usa/engine';
import type { PayFrequency, FilingStatus } from '@/modules/nomina-usa/types';

const COLORS = ['#3b82f6', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];

const formatUSD = (v: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(v);

const formatPct = (v: number) => `${(v * 100).toFixed(2)}%`;

const US_STATES = [
  { code: 'TX', name: 'Texas', rate: 0 },
  { code: 'FL', name: 'Florida', rate: 0 },
  { code: 'CA', name: 'California', rate: 0.0725 },
  { code: 'NY', name: 'New York', rate: 0.0685 },
  { code: 'IL', name: 'Illinois', rate: 0.0495 },
  { code: 'PA', name: 'Pennsylvania', rate: 0.0307 },
  { code: 'OH', name: 'Ohio', rate: 0.04 },
  { code: 'GA', name: 'Georgia', rate: 0.055 },
  { code: 'NC', name: 'North Carolina', rate: 0.0475 },
  { code: 'NJ', name: 'New Jersey', rate: 0.0637 },
  { code: 'WA', name: 'Washington', rate: 0 },
  { code: 'NV', name: 'Nevada', rate: 0 },
  { code: 'TN', name: 'Tennessee', rate: 0 },
  { code: 'AZ', name: 'Arizona', rate: 0.025 },
  { code: 'CO', name: 'Colorado', rate: 0.044 },
  { code: 'MA', name: 'Massachusetts', rate: 0.05 },
  { code: 'OTHER', name: 'Otro (tasa manual)', rate: 0 },
];

export default function NominaUSA() {
  const [activeTab, setActiveTab] = useState<'calculadora' | 'desglose' | 'proyeccion'>('calculadora');

  const [form, setForm] = useState({
    annualSalary: 75_000,
    payFrequency: 'biweekly' as PayFrequency,
    filingStatus: 'single' as FilingStatus,
    stateCode: 'TX',
    stateTaxRate: 0,
    preTax401k: 6_000,
    preTaxHealth: 3_600,
  });

  const selectedState = US_STATES.find((s) => s.code === form.stateCode);
  const effectiveStateRate = form.stateCode === 'OTHER' ? form.stateTaxRate : (selectedState?.rate ?? 0);

  const paystub = useMemo(() => calcularNominaUSA({
    id: 'SIM-001',
    name: 'Simulation',
    annualSalary: form.annualSalary,
    payFrequency: form.payFrequency,
    filingStatus: form.filingStatus,
    stateCode: form.stateCode,
    stateTaxRate: effectiveStateRate,
    allowances: 0,
    additionalWithholding: 0,
    preTax401k: form.preTax401k,
    preTaxHealthInsurance: form.preTaxHealth,
  }), [form, effectiveStateRate]);

  // Data for pie chart
  const desglosePie = [
    { name: 'Net Pay', value: paystub.netPay },
    { name: 'Federal Tax', value: paystub.taxes.federalIncomeTax },
    { name: 'Social Security', value: paystub.taxes.socialSecurity },
    { name: 'Medicare', value: paystub.taxes.medicare + paystub.taxes.additionalMedicare },
    { name: 'State Tax', value: paystub.taxes.stateTax },
    { name: 'Pre-tax Deductions', value: paystub.preTaxDeductions.totalPreTax },
  ].filter((d) => d.value > 0);

  // Annual bar chart data
  const annualBarData = [
    { name: 'Federal Tax', value: paystub.detailFederal.federalTax },
    { name: 'Social Security', value: paystub.detailFICA.socialSecurity },
    { name: 'Medicare', value: paystub.detailFICA.medicare + paystub.detailFICA.additionalMedicare },
    { name: 'State Tax', value: paystub.detailState.stateTax },
    { name: '401(k)', value: form.preTax401k },
    { name: 'Health Ins.', value: form.preTaxHealth },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">US Payroll Calculator</h1>
        <p className="mt-1 text-gray-500">Federal Income Tax, FICA (Social Security + Medicare), State Tax — 2024 rates</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'calculadora' as const, label: 'Calculator', icon: Calculator },
            { id: 'desglose' as const, label: 'Breakdown', icon: PieChartIcon },
            { id: 'proyeccion' as const, label: 'Annual Projection', icon: TrendingUp },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB: CALCULATOR */}
      {activeTab === 'calculadora' && (
        <div className="space-y-6">
          {/* Form */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Payroll Simulator</h3>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Annual Salary ($)</label>
                <input type="number" className="input" value={form.annualSalary}
                  onChange={(e) => setForm({ ...form, annualSalary: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Pay Frequency</label>
                <select className="input" value={form.payFrequency}
                  onChange={(e) => setForm({ ...form, payFrequency: e.target.value as PayFrequency })}>
                  <option value="weekly">Weekly</option>
                  <option value="biweekly">Biweekly</option>
                  <option value="semimonthly">Semimonthly</option>
                  <option value="monthly">Monthly</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Filing Status</label>
                <select className="input" value={form.filingStatus}
                  onChange={(e) => setForm({ ...form, filingStatus: e.target.value as FilingStatus })}>
                  <option value="single">Single</option>
                  <option value="married_jointly">Married Filing Jointly</option>
                  <option value="married_separately">Married Filing Separately</option>
                  <option value="head_of_household">Head of Household</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">State</label>
                <select className="input" value={form.stateCode}
                  onChange={(e) => setForm({ ...form, stateCode: e.target.value })}>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>
                      {s.name} {s.rate > 0 ? `(${(s.rate * 100).toFixed(1)}%)` : s.code !== 'OTHER' ? '(0%)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {form.stateCode === 'OTHER' && (
              <div className="mt-4 w-48">
                <label className="mb-1 block text-xs font-medium text-gray-600">Custom State Tax Rate (%)</label>
                <input type="number" step="0.01" className="input" value={form.stateTaxRate * 100}
                  onChange={(e) => setForm({ ...form, stateTaxRate: Number(e.target.value) / 100 })} />
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">401(k) Annual ($)</label>
                <input type="number" className="input" value={form.preTax401k}
                  onChange={(e) => setForm({ ...form, preTax401k: Number(e.target.value) })} />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-600">Health Insurance Annual ($)</label>
                <input type="number" className="input" value={form.preTaxHealth}
                  onChange={(e) => setForm({ ...form, preTaxHealth: Number(e.target.value) })} />
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
            <StatsCard title="Gross Pay" value={formatUSD(paystub.grossPay)} icon={DollarSign} color="blue" />
            <StatsCard title="Federal Tax" value={formatUSD(paystub.taxes.federalIncomeTax)} icon={Calculator} color="red" />
            <StatsCard title="FICA" value={formatUSD(paystub.taxes.socialSecurity + paystub.taxes.medicare + paystub.taxes.additionalMedicare)} icon={Building2} color="orange" />
            <StatsCard title="State Tax" value={formatUSD(paystub.taxes.stateTax)} icon={BarChart3} color="purple" />
            <StatsCard title="Net Pay" value={formatUSD(paystub.netPay)} icon={DollarSign} color="green" />
          </div>

          {/* Paystub detail */}
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="card">
              <h3 className="mb-3 font-semibold text-gray-900">Paystub</h3>
              <div className="divide-y divide-gray-100">
                <div className="py-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-green-700">EARNINGS</p>
                  <div className="space-y-1.5">
                    <PayRow label="Gross Pay" value={paystub.grossPay} />
                  </div>
                </div>
                {paystub.preTaxDeductions.totalPreTax > 0 && (
                  <div className="py-3">
                    <p className="mb-2 text-xs font-bold uppercase tracking-wider text-blue-700">PRE-TAX DEDUCTIONS</p>
                    <div className="space-y-1.5">
                      {paystub.preTaxDeductions.retirement401k > 0 && <PayRow label="401(k)" value={paystub.preTaxDeductions.retirement401k} />}
                      {paystub.preTaxDeductions.healthInsurance > 0 && <PayRow label="Health Insurance" value={paystub.preTaxDeductions.healthInsurance} />}
                      <PayRow label="Total Pre-Tax" value={paystub.preTaxDeductions.totalPreTax} bold highlight="blue" />
                    </div>
                  </div>
                )}
                <div className="py-3">
                  <p className="mb-2 text-xs font-bold uppercase tracking-wider text-red-700">TAXES</p>
                  <div className="space-y-1.5">
                    <PayRow label="Federal Income Tax" value={paystub.taxes.federalIncomeTax} />
                    <PayRow label="Social Security" value={paystub.taxes.socialSecurity} />
                    <PayRow label="Medicare" value={paystub.taxes.medicare} />
                    {paystub.taxes.additionalMedicare > 0 && <PayRow label="Additional Medicare" value={paystub.taxes.additionalMedicare} />}
                    {paystub.taxes.stateTax > 0 && <PayRow label={`State Tax (${form.stateCode})`} value={paystub.taxes.stateTax} />}
                    <PayRow label="Total Taxes" value={paystub.taxes.totalTaxes} bold highlight="red" />
                  </div>
                </div>
                <div className="py-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-gray-900">NET PAY</span>
                    <span className="text-green-600">{formatUSD(paystub.netPay)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Pie chart */}
            <div className="card">
              <h3 className="mb-3 font-semibold text-gray-900">Pay Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={desglosePie} cx="50%" cy="50%" innerRadius={55} outerRadius={90} paddingAngle={3} dataKey="value">
                    {desglosePie.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatUSD(v)} />
                </PieChart>
              </ResponsiveContainer>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {desglosePie.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2 text-xs">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-gray-500">{d.name}:</span>
                    <span className="font-medium">{formatUSD(d.value)}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: BREAKDOWN */}
      {activeTab === 'desglose' && (
        <div className="space-y-6">
          {/* Federal Tax Brackets */}
          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Federal Tax Bracket Breakdown</h3>
            <div className="mb-2 text-sm text-gray-500">
              Taxable Income: {formatUSD(paystub.detailFederal.taxableIncome)} | Effective Rate: {formatPct(paystub.detailFederal.effectiveRate)} | Marginal Rate: {formatPct(paystub.detailFederal.marginalRate)}
            </div>
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left font-medium text-gray-600">Bracket</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Rate</th>
                    <th className="px-4 py-2 text-right font-medium text-gray-600">Tax</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paystub.detailFederal.brackets.map((b, i) => (
                    <tr key={i}>
                      <td className="px-4 py-2 text-gray-700">{b.range}</td>
                      <td className="px-4 py-2 text-right text-gray-700">{(b.rate * 100).toFixed(0)}%</td>
                      <td className="px-4 py-2 text-right font-medium text-gray-900">{formatUSD(b.tax)}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td className="px-4 py-2 font-semibold text-gray-900">Total Federal Tax</td>
                    <td />
                    <td className="px-4 py-2 text-right font-bold text-red-600">{formatUSD(paystub.detailFederal.federalTax)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* FICA Detail */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="card border-l-4 border-l-blue-400">
              <h3 className="mb-3 font-semibold text-gray-900">Social Security</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Rate:</span><span>{(paystub.detailFICA.socialSecurityRate * 100).toFixed(1)}%</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Wage Base:</span><span>{formatUSD(paystub.detailFICA.socialSecurityBase)}</span></div>
                <div className="flex justify-between font-semibold"><span>Employee:</span><span className="text-blue-600">{formatUSD(paystub.detailFICA.socialSecurity)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Employer Match:</span><span>{formatUSD(paystub.detailFICA.socialSecurity)}</span></div>
              </div>
            </div>
            <div className="card border-l-4 border-l-emerald-400">
              <h3 className="mb-3 font-semibold text-gray-900">Medicare</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Rate:</span><span>{(paystub.detailFICA.medicareRate * 100).toFixed(2)}%</span></div>
                <div className="flex justify-between font-semibold"><span>Employee:</span><span className="text-emerald-600">{formatUSD(paystub.detailFICA.medicare)}</span></div>
                {paystub.detailFICA.additionalMedicare > 0 && (
                  <div className="flex justify-between"><span className="text-gray-500">Additional (0.9%):</span><span className="text-red-600">{formatUSD(paystub.detailFICA.additionalMedicare)}</span></div>
                )}
                <div className="flex justify-between"><span className="text-gray-500">Employer Match:</span><span>{formatUSD(paystub.detailFICA.medicare)}</span></div>
              </div>
            </div>
          </div>

          {/* Employer cost */}
          <div className="card">
            <h3 className="mb-3 font-semibold text-gray-900">Total Employer Cost (Annual)</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-gray-500">Gross Salary:</span><span>{formatUSD(form.annualSalary)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Employer SS:</span><span>{formatUSD(paystub.detailFICA.socialSecurity)}</span></div>
              <div className="flex justify-between"><span className="text-gray-500">Employer Medicare:</span><span>{formatUSD(paystub.detailFICA.medicare)}</span></div>
              <hr className="my-1" />
              <div className="flex justify-between font-bold"><span>TOTAL:</span><span className="text-primary-600">{formatUSD(form.annualSalary + paystub.detailFICA.employerMatch)}</span></div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: ANNUAL PROJECTION */}
      {activeTab === 'proyeccion' && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatsCard title="Gross Annual" value={formatUSD(paystub.annualProjection.grossAnnual)} icon={DollarSign} color="blue" />
            <StatsCard title="Total Taxes" value={formatUSD(paystub.annualProjection.totalTaxesAnnual)} icon={Calculator} color="red" />
            <StatsCard title="Total Deductions" value={formatUSD(paystub.annualProjection.totalDeductionsAnnual)} icon={Building2} color="orange" />
            <StatsCard title="Net Annual" value={formatUSD(paystub.annualProjection.netAnnual)} icon={DollarSign} color="green" />
          </div>

          <div className="card">
            <h3 className="mb-4 font-semibold text-gray-900">Annual Deduction Breakdown</h3>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={annualBarData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis type="number" tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} stroke="#94a3b8" />
                <YAxis type="category" dataKey="name" width={120} tick={{ fontSize: 12 }} stroke="#94a3b8" />
                <Tooltip formatter={(v: number) => formatUSD(v)} />
                <Legend />
                <Bar dataKey="value" name="Amount" fill="#3b82f6" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
            <p className="font-medium">Reference — 2024 Rates:</p>
            <ul className="mt-1 ml-4 list-disc space-y-0.5 text-xs">
              <li>Federal Income Tax: 7 progressive brackets (10% – 37%)</li>
              <li>Social Security: 6.2% employee + 6.2% employer (wage base $168,600)</li>
              <li>Medicare: 1.45% each + 0.9% additional employee above $200k</li>
              <li>Standard Deduction: $14,600 (single), $29,200 (married jointly)</li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function PayRow({ label, value, bold, highlight }: { label: string; value: number; bold?: boolean; highlight?: string }) {
  const textClass = highlight === 'green' ? 'text-green-600' : highlight === 'red' ? 'text-red-600' : highlight === 'blue' ? 'text-blue-600' : 'text-gray-900';
  return (
    <div className={`flex justify-between text-sm ${bold ? 'font-semibold' : ''}`}>
      <span className="text-gray-500">{label}</span>
      <span className={textClass}>{formatUSD(value)}</span>
    </div>
  );
}
