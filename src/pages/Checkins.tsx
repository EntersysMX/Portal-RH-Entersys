import { useState } from 'react';
import { Fingerprint, LogIn, LogOut, Users } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import { useCheckins } from '@/hooks/useFrappe';
import type { EmployeeCheckin } from '@/types/frappe';

export default function Checkins() {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { data: checkinData, isLoading, isError, refetch } = useCheckins();

  const filteredData = (checkinData ?? []).filter((c) =>
    c.time.startsWith(selectedDate)
  );

  const totalCount = filteredData.length;
  const inCount = filteredData.filter((c) => c.log_type === 'IN').length;
  const outCount = filteredData.filter((c) => c.log_type === 'OUT').length;
  const uniqueEmployees = new Set(filteredData.map((c) => c.employee)).size;

  const columns: Column<EmployeeCheckin>[] = [
    {
      key: 'employee_name',
      header: 'Empleado',
      render: (c) => (
        <div>
          <p className="font-medium text-gray-900">{c.employee_name}</p>
          <p className="text-xs text-gray-400">{c.employee}</p>
        </div>
      ),
    },
    {
      key: 'log_type',
      header: 'Tipo',
      render: (c) =>
        c.log_type === 'IN' ? (
          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
            Entrada
          </span>
        ) : (
          <span className="inline-flex items-center rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
            Salida
          </span>
        ),
    },
    {
      key: 'time',
      header: 'Hora',
      render: (c) => new Date(c.time).toLocaleString('es-MX'),
    },
    {
      key: 'device_id',
      header: 'Dispositivo',
      render: (c) => c.device_id || <span className="text-gray-300">—</span>,
    },
    {
      key: 'shift',
      header: 'Turno',
      render: (c) => c.shift || <span className="text-gray-300">—</span>,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Checadas</h1>
          <p className="mt-1 text-gray-500">Registro de entradas y salidas de empleados</p>
        </div>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
          className="input w-auto"
        />
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Total Checadas" value={totalCount} icon={Fingerprint} color="blue" />
        <StatsCard title="Entradas" value={inCount} icon={LogIn} color="green" />
        <StatsCard title="Salidas" value={outCount} icon={LogOut} color="red" />
        <StatsCard title="Empleados Únicos" value={uniqueEmployees} icon={Users} color="purple" />
      </div>

      <DataTable
        columns={columns}
        data={filteredData}
        isLoading={isLoading}
        isError={isError}
        onRetry={refetch}
        emptyMessage="No hay checadas registradas para esta fecha"
      />
    </div>
  );
}
