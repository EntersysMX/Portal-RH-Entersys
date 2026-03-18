import { useState } from 'react';
import { Bell, Plus, AlertTriangle, Info, CheckCircle, AlertCircle, Trash2, Edit } from 'lucide-react';
import { clsx } from 'clsx';
import StatsCard from '@/components/ui/StatsCard';
import DataTable, { Column } from '@/components/ui/DataTable';
import Modal from '@/components/ui/Modal';
import RoleGuard from '@/components/auth/RoleGuard';
import { useNotices, useCreateNotice } from '@/hooks/useFrappe';
import { toast } from '@/components/ui/Toast';
import type { Notice } from '@/types/frappe';

const TYPE_STYLES: Record<Notice['type'], { bg: string; text: string; icon: React.ComponentType<{className?: string}> }> = {
  info: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Info },
  warning: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertTriangle },
  success: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
  urgent: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
};

function TypeBadge({ type }: { type: Notice['type'] }) {
  const style = TYPE_STYLES[type];
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium', style.bg, style.text)}>
      <style.icon className="h-3 w-3" />
      {type.charAt(0).toUpperCase() + type.slice(1)}
    </span>
  );
}

export default function Notices() {
  const { data: notices, isLoading } = useNotices();
  const createMutation = useCreateNotice();
  const [showNewModal, setShowNewModal] = useState(false);
  const [newNotice, setNewNotice] = useState({
    title: '',
    content: '',
    type: 'info' as Notice['type'],
    target_audience: 'all',
    expiry_date: '',
  });

  const activeNotices = notices?.filter((n) => n.status === 'Active') || [];
  const urgentCount = activeNotices.filter((n) => n.type === 'urgent').length;

  const columns: Column<Notice>[] = [
    {
      key: 'title',
      header: 'Título',
      render: (n) => <p className="font-medium text-gray-900">{n.title}</p>,
    },
    {
      key: 'type',
      header: 'Tipo',
      render: (n) => <TypeBadge type={n.type} />,
    },
    { key: 'posted_date', header: 'Fecha' },
    { key: 'target_audience', header: 'Audiencia', render: (n) => <span className="capitalize">{n.target_audience}</span> },
    {
      key: 'status',
      header: 'Estado',
      render: (n) => (
        <span className={clsx(
          'rounded-full px-2 py-0.5 text-xs font-medium',
          n.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'
        )}>
          {n.status}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acciones',
      render: () => (
        <div className="flex gap-1">
          <button className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"><Edit className="h-4 w-4" /></button>
          <button className="rounded p-1 text-gray-400 hover:bg-red-50 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
        </div>
      ),
    },
  ];

  const handleCreate = async () => {
    try {
      await createMutation.mutateAsync({
        ...newNotice,
        author: 'Admin',
        posted_date: new Date().toISOString().split('T')[0],
        status: 'Active',
      } as Partial<Notice>);
      toast.success('Aviso publicado', 'El aviso se creó correctamente.');
      setShowNewModal(false);
      setNewNotice({ title: '', content: '', type: 'info', target_audience: 'all', expiry_date: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Avisos</h1>
          <p className="mt-1 text-gray-500">Gestión de comunicados y avisos internos</p>
        </div>
        <RoleGuard section="notices" action="create">
          <button onClick={() => setShowNewModal(true)} className="btn-primary">
            <Plus className="h-4 w-4" />
            Nuevo Aviso
          </button>
        </RoleGuard>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <StatsCard title="Total Avisos" value={notices?.length ?? 0} icon={Bell} color="blue" />
        <StatsCard title="Activos" value={activeNotices.length} icon={CheckCircle} color="green" />
        <StatsCard title="Urgentes" value={urgentCount} icon={AlertCircle} color="red" />
        <StatsCard title="Este Mes" value={activeNotices.filter((n) => n.posted_date >= new Date().toISOString().substring(0, 7)).length} icon={Info} color="purple" />
      </div>

      <DataTable
        columns={columns}
        data={notices ?? []}
        isLoading={isLoading}
        emptyMessage="No hay avisos. Crea el primero desde el botón 'Nuevo Aviso'."
      />

      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nuevo Aviso"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending || !newNotice.title} className="btn-primary">
              {createMutation.isPending ? 'Creando...' : 'Publicar Aviso'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Título</label>
            <input className="input" value={newNotice.title} onChange={(e) => setNewNotice({ ...newNotice, title: e.target.value })} placeholder="Título del aviso" />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Contenido</label>
            <textarea className="input min-h-[100px]" value={newNotice.content} onChange={(e) => setNewNotice({ ...newNotice, content: e.target.value })} placeholder="Escribe el contenido del aviso..." />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Tipo</label>
              <select className="input" value={newNotice.type} onChange={(e) => setNewNotice({ ...newNotice, type: e.target.value as Notice['type'] })}>
                <option value="info">Informativo</option>
                <option value="warning">Advertencia</option>
                <option value="success">Positivo</option>
                <option value="urgent">Urgente</option>
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Audiencia</label>
              <select className="input" value={newNotice.target_audience} onChange={(e) => setNewNotice({ ...newNotice, target_audience: e.target.value })}>
                <option value="all">Todos</option>
                <option value="Tecnología">Tecnología</option>
                <option value="Ventas">Ventas</option>
                <option value="Operaciones">Operaciones</option>
                <option value="RRHH">RRHH</option>
              </select>
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Fecha de expiración (opcional)</label>
            <input type="date" className="input" value={newNotice.expiry_date} onChange={(e) => setNewNotice({ ...newNotice, expiry_date: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
