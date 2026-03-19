import { useState, useEffect } from 'react';
import { User, Mail, Phone, Building2, Briefcase, Calendar, MapPin, Save, ExternalLink, Shield } from 'lucide-react';
import { useMyEmployee, useUpdateMyProfile } from '@/hooks/useFrappe';
import ErrorState from '@/components/ui/ErrorState';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/components/ui/Toast';

interface EditableFields {
  cell_phone: string;
  personal_email: string;
  emergency_contact_name: string;
  emergency_phone: string;
  relation: string;
  linkedin_profile: string;
  bank_name: string;
  bank_ac_no: string;
  current_address: string;
}

export default function MyProfile() {
  const user = useAuthStore((s) => s.user);
  const { data: employee, isLoading, isError, refetch } = useMyEmployee();
  const updateMutation = useUpdateMyProfile();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<EditableFields>({
    cell_phone: '',
    personal_email: '',
    emergency_contact_name: '',
    emergency_phone: '',
    relation: '',
    linkedin_profile: '',
    bank_name: '',
    bank_ac_no: '',
    current_address: '',
  });

  useEffect(() => {
    if (employee) {
      setForm({
        cell_phone: employee.cell_phone || '',
        personal_email: employee.personal_email || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_phone: employee.emergency_phone || '',
        relation: employee.relation || '',
        linkedin_profile: employee.linkedin_profile || '',
        bank_name: employee.bank_name || '',
        bank_ac_no: employee.bank_ac_no || '',
        current_address: employee.current_address || '',
      });
    }
  }, [employee]);

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({ ...form } as Record<string, unknown>);
      setEditing(false);
      toast.success('Perfil actualizado', 'Tus datos se guardaron correctamente.');
    } catch (err) {
      toast.fromError(err);
    }
  };

  const handleCancel = () => {
    setEditing(false);
    if (employee) {
      setForm({
        cell_phone: employee.cell_phone || '',
        personal_email: employee.personal_email || '',
        emergency_contact_name: employee.emergency_contact_name || '',
        emergency_phone: employee.emergency_phone || '',
        relation: employee.relation || '',
        linkedin_profile: employee.linkedin_profile || '',
        bank_name: employee.bank_name || '',
        bank_ac_no: employee.bank_ac_no || '',
        current_address: employee.current_address || '',
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  if (isError) {
    return <ErrorState onRetry={refetch} message="No se pudo cargar tu perfil." />;
  }

  const emp = employee;
  const maskedBank = form.bank_ac_no ? `****${form.bank_ac_no.slice(-4)}` : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="mt-1 text-gray-500">Información personal y laboral</p>
        </div>
        <div className="flex gap-2">
          {editing && (
            <button onClick={handleCancel} className="btn-secondary">
              Cancelar
            </button>
          )}
          <button
            onClick={editing ? handleSave : () => setEditing(true)}
            disabled={updateMutation.isPending}
            className={editing ? 'btn-primary' : 'btn-secondary'}
          >
            {editing ? (
              <>
                <Save className="h-4 w-4" />
                {updateMutation.isPending ? 'Guardando...' : 'Guardar'}
              </>
            ) : (
              'Editar'
            )}
          </button>
        </div>
      </div>

      {/* Profile card */}
      <div className="card p-6">
        <div className="flex items-start gap-6">
          <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center rounded-full bg-primary-100 text-primary-600">
            {emp?.image ? (
              <img src={emp.image} alt="" className="h-20 w-20 rounded-full object-cover" />
            ) : (
              <User className="h-10 w-10" />
            )}
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">
              {emp?.employee_name || user?.full_name || 'Sin datos'}
            </h2>
            <p className="text-gray-500">{emp?.designation || 'Sin puesto asignado'}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge badge-info">{emp?.name || user?.employee_id || 'Sin ID'}</span>
              <span className="badge badge-success">{emp?.status || 'Active'}</span>
              <span className="badge badge-neutral">{emp?.employment_type || 'N/A'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Details grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        {/* Datos personales */}
        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <User className="h-5 w-5 text-gray-400" />
            Datos Personales
          </h3>
          <div className="space-y-4">
            <InfoRow label="Nombre completo" value={emp?.employee_name} />
            <InfoRow label="Género" value={emp?.gender} />
            <InfoRow label="Fecha de nacimiento" value={emp?.date_of_birth} icon={<Calendar className="h-4 w-4" />} />
            <EditableRow label="Teléfono" value={form.cell_phone} editing={editing} onChange={(v) => setForm({ ...form, cell_phone: v })} icon={<Phone className="h-4 w-4" />} />
            <EditableRow label="Email personal" value={form.personal_email} editing={editing} onChange={(v) => setForm({ ...form, personal_email: v })} icon={<Mail className="h-4 w-4" />} type="email" />
          </div>
        </div>

        {/* Datos laborales */}
        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Briefcase className="h-5 w-5 text-gray-400" />
            Datos Laborales
          </h3>
          <div className="space-y-4">
            <InfoRow label="Empresa" value={emp?.company} icon={<Building2 className="h-4 w-4" />} />
            <InfoRow label="Departamento" value={emp?.department} />
            <InfoRow label="Puesto" value={emp?.designation} />
            <InfoRow label="Sucursal" value={emp?.branch} icon={<MapPin className="h-4 w-4" />} />
            <InfoRow label="Fecha de ingreso" value={emp?.date_of_joining} icon={<Calendar className="h-4 w-4" />} />
            <InfoRow label="Email corporativo" value={emp?.company_email} icon={<Mail className="h-4 w-4" />} />
            <InfoRow label="Reporta a" value={emp?.reports_to} />
          </div>
        </div>

        {/* Contacto de emergencia */}
        <div className="card p-6">
          <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
            <Shield className="h-5 w-5 text-gray-400" />
            Contacto de Emergencia
          </h3>
          <div className="space-y-4">
            <EditableRow label="Nombre" value={form.emergency_contact_name} editing={editing} onChange={(v) => setForm({ ...form, emergency_contact_name: v })} />
            <EditableRow label="Teléfono" value={form.emergency_phone} editing={editing} onChange={(v) => setForm({ ...form, emergency_phone: v })} icon={<Phone className="h-4 w-4" />} />
            <EditableRow label="Relación" value={form.relation} editing={editing} onChange={(v) => setForm({ ...form, relation: v })} />
          </div>
        </div>

        {/* LinkedIn + Banco */}
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <ExternalLink className="h-5 w-5 text-gray-400" />
              LinkedIn
            </h3>
            <EditableRow label="Perfil LinkedIn" value={form.linkedin_profile} editing={editing} onChange={(v) => setForm({ ...form, linkedin_profile: v })} placeholder="https://linkedin.com/in/tu-perfil" />
            {!editing && form.linkedin_profile && (
              <a href={form.linkedin_profile} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-primary-600 hover:underline">
                Ver perfil <ExternalLink className="h-3 w-3" />
              </a>
            )}
          </div>
          <div className="card p-6">
            <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
              <Building2 className="h-5 w-5 text-gray-400" />
              Información Bancaria
            </h3>
            <div className="space-y-4">
              <EditableRow label="Banco" value={form.bank_name} editing={editing} onChange={(v) => setForm({ ...form, bank_name: v })} />
              {editing ? (
                <EditableRow label="No. Cuenta" value={form.bank_ac_no} editing={editing} onChange={(v) => setForm({ ...form, bank_ac_no: v })} />
              ) : (
                <InfoRow label="No. Cuenta" value={maskedBank} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Address */}
      <div className="card p-6">
        <h3 className="mb-4 flex items-center gap-2 font-semibold text-gray-900">
          <MapPin className="h-5 w-5 text-gray-400" />
          Dirección
        </h3>
        <EditableRow label="Dirección actual" value={form.current_address} editing={editing} onChange={(v) => setForm({ ...form, current_address: v })} />
      </div>

      {/* No data message for demo */}
      {!emp && (
        <div className="card p-8 text-center">
          <User className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-semibold text-gray-700">Sin datos de empleado</h3>
          <p className="mt-2 text-gray-500">
            Tu cuenta no está vinculada a un registro de empleado.
            Contacta al departamento de RH para vincular tu perfil.
          </p>
        </div>
      )}
    </div>
  );
}

function InfoRow({ label, value, icon }: { label: string; value?: string | null; icon?: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center gap-2 text-sm text-gray-500">
        {icon}
        {label}
      </div>
      <p className="text-sm font-medium text-gray-900">{value || '—'}</p>
    </div>
  );
}

function EditableRow({
  label,
  value,
  editing,
  onChange,
  icon,
  type = 'text',
  placeholder,
}: {
  label: string;
  value: string;
  editing: boolean;
  onChange: (v: string) => void;
  icon?: React.ReactNode;
  type?: string;
  placeholder?: string;
}) {
  if (!editing) {
    return <InfoRow label={label} value={value || undefined} icon={icon} />;
  }
  return (
    <div className="flex items-start justify-between gap-4">
      <div className="flex items-center gap-2 text-sm text-gray-500 pt-2">
        {icon}
        {label}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder || label}
        className="input w-60 text-sm"
      />
    </div>
  );
}
