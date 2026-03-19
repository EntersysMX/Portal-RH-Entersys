import { Receipt, DollarSign, Clock, CheckCircle2 } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import ErrorState from '@/components/ui/ErrorState';
import { useExpenseClaims } from '@/hooks/useFrappe';
import type { ExpenseClaim } from '@/types/frappe';

export default function Expenses() {
  const { data: claims, isLoading, isError, refetch } = useExpenseClaims();

  const totalClaimed = claims?.reduce((s, c) => s + (c.total_claimed_amount ?? 0), 0) ?? 0;
  const pendingCount = claims?.filter((c) => c.approval_status === 'Draft').length ?? 0;
  const approvedCount = claims?.filter((c) => c.approval_status === 'Approved').length ?? 0;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Gastos</h1>
        <p className="mt-1 text-gray-500">Reembolsos y solicitudes de gastos</p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Total Solicitudes" value={claims?.length ?? 0} icon={Receipt} color="blue" />
        <StatsCard title="Monto Total" value={formatCurrency(totalClaimed)} icon={DollarSign} color="green" />
        <StatsCard title="Pendientes" value={pendingCount} icon={Clock} color="orange" />
        <StatsCard title="Aprobados" value={approvedCount} icon={CheckCircle2} color="purple" />
      </div>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
        </div>
      ) : isError ? (
        <ErrorState onRetry={refetch} compact />
      ) : claims?.length === 0 ? (
        <div className="card py-12 text-center text-gray-400">
          No hay solicitudes de gastos
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {claims?.map((claim: ExpenseClaim) => (
            <div key={claim.name} className="card transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-gray-900">{claim.employee_name}</p>
                  <p className="text-xs text-gray-400">{claim.expense_date}</p>
                </div>
                <StatusBadge status={claim.approval_status} />
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Solicitado:</span>
                  <span className="font-medium">{formatCurrency(claim.total_claimed_amount)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Aprobado:</span>
                  <span className="font-medium text-green-600">
                    {formatCurrency(claim.total_sanctioned_amount)}
                  </span>
                </div>
              </div>
              {claim.expenses?.length > 0 && (
                <div className="mt-3 border-t border-gray-100 pt-3">
                  <p className="mb-1 text-xs font-medium text-gray-500">Conceptos:</p>
                  {claim.expenses.slice(0, 3).map((exp, idx) => (
                    <p key={idx} className="text-xs text-gray-400">
                      {exp.expense_type}: {formatCurrency(exp.amount)}
                    </p>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
