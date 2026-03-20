import { useState } from 'react';
import { Plane, Plus, MapPin, Calendar, DollarSign } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { toast } from '@/components/ui/Toast';
import { useTravelRequests, useCreateTravelRequest } from '@/hooks/useFrappe';
import type { TravelRequest } from '@/types/frappe';

const statusStyles: Record<TravelRequest['status'], string> = {
  Draft: 'bg-gray-100 text-gray-600',
  'Pending Approval': 'bg-yellow-100 text-yellow-700',
  Approved: 'bg-green-100 text-green-700',
  Rejected: 'bg-red-100 text-red-700',
  Cancelled: 'bg-gray-100 text-gray-500',
};

const travelTypeBadge: Record<TravelRequest['travel_type'], string> = {
  Domestic: 'bg-blue-100 text-blue-700',
  International: 'bg-purple-100 text-purple-700',
};

const initialForm = {
  employee: '',
  travel_type: 'Domestic' as TravelRequest['travel_type'],
  purpose_of_travel: '',
  departure_date: '',
  return_date: '',
  total_cost: '',
  description: '',
  company: '',
};

export default function Travel() {
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState(initialForm);

  const { data: requests, isLoading, isError, refetch } = useTravelRequests();
  const createMutation = useCreateTravelRequest();

  const totalCount = requests?.length ?? 0;
  const pendingCount = requests?.filter((r) => r.status === 'Pending Approval').length ?? 0;
  const approvedCount = requests?.filter((r) => r.status === 'Approved').length ?? 0;
  const approvedCost = requests
    ?.filter((r) => r.status === 'Approved')
    .reduce((sum, r) => sum + (r.total_cost ?? 0), 0) ?? 0;

  const formatCurrency = (v: number) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(v);

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...form,
        total_cost: form.total_cost ? Number(form.total_cost) : undefined,
      });
      toast.success('Solicitud creada', 'La solicitud de viáticos se registró correctamente.');
      setShowModal(false);
      setForm(initialForm);
    } catch (err) {
      toast.fromError(err);
    }
  };

  const columns: Column<TravelRequest>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (r) => (
        <div>
          <p className="font-medium text-gray-900">{r.employee_name}</p>
          <p className="text-xs text-gray-400">{r.employee}</p>
        </div>
      ),
    },
    {
      key: 'travel_type',
      header: 'Tipo',
      render: (r) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${travelTypeBadge[r.travel_type]}`}>
          {r.travel_type === 'Domestic' ? 'Nacional' : 'Internacional'}
        </span>
      ),
    },
    {
      key: 'purpose_of_travel',
      header: 'Motivo',
      render: (r) => (
        <span className="line-clamp-1 max-w-[200px]">{r.purpose_of_travel}</span>
      ),
    },
    { key: 'departure_date', header: 'Salida' },
    { key: 'return_date', header: 'Regreso' },
    {
      key: 'total_cost',
      header: 'Costo',
      render: (r) => (
        <span className="font-medium">{r.total_cost != null ? formatCurrency(r.total_cost) : '—'}</span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      render: (r) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[r.status]}`}>
          {r.status === 'Pending Approval' ? 'Pendiente' : r.status === 'Approved' ? 'Aprobado' : r.status === 'Rejected' ? 'Rechazado' : r.status === 'Cancelled' ? 'Cancelado' : 'Borrador'}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Viaticos</h1>
          <p className="mt-1 text-gray-500">Solicitudes de viaje y viaticos</p>
        </div>
        <RoleGuard section="travel" action="create">
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nueva Solicitud
          </button>
        </RoleGuard>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Total Solicitudes" value={totalCount} icon={Plane} color="blue" />
        <StatsCard title="Pendientes" value={pendingCount} icon={Calendar} color="orange" />
        <StatsCard title="Aprobadas" value={approvedCount} icon={MapPin} color="green" />
        <StatsCard title="Costo Total Aprobado" value={formatCurrency(approvedCost)} icon={DollarSign} color="purple" />
      </div>

      {/* DataTable */}
      <DataTable
        columns={columns}
        data={requests ?? []}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay solicitudes de viaticos"
      />

      {/* New Request Modal */}
      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Nueva Solicitud de Viaticos"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowModal(false)} className="btn-secondary">
              Cancelar
            </button>
            <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creando...' : 'Crear Solicitud'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empleado</label>
              <input
                className="input"
                placeholder="ID del empleado"
                value={form.employee}
                onChange={(e) => setForm({ ...form, employee: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo de Viaje</label>
              <select
                className="input"
                value={form.travel_type}
                onChange={(e) => setForm({ ...form, travel_type: e.target.value as TravelRequest['travel_type'] })}
              >
                <option value="Domestic">Nacional</option>
                <option value="International">Internacional</option>
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Motivo del Viaje</label>
              <input
                className="input"
                placeholder="Motivo del viaje"
                value={form.purpose_of_travel}
                onChange={(e) => setForm({ ...form, purpose_of_travel: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de Salida</label>
              <input
                type="date"
                className="input"
                value={form.departure_date}
                onChange={(e) => setForm({ ...form, departure_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de Regreso</label>
              <input
                type="date"
                className="input"
                value={form.return_date}
                onChange={(e) => setForm({ ...form, return_date: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Costo Estimado</label>
              <input
                type="number"
                className="input"
                placeholder="0.00"
                value={form.total_cost}
                onChange={(e) => setForm({ ...form, total_cost: e.target.value })}
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Empresa</label>
              <input
                className="input"
                placeholder="Empresa"
                value={form.company}
                onChange={(e) => setForm({ ...form, company: e.target.value })}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripcion</label>
            <textarea
              className="input min-h-[100px]"
              placeholder="Detalles adicionales del viaje"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
        </div>
      </Modal>
    </div>
  );
}
