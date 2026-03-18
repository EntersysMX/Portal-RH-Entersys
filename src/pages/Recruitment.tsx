import { useState } from 'react';
import { Plus, Briefcase, Users, Clock, CheckCircle2, MapPin, Building2, X } from 'lucide-react';
import StatsCard from '@/components/ui/StatsCard';
import StatusBadge from '@/components/ui/StatusBadge';
import Modal from '@/components/ui/Modal';
import ComboSelect from '@/components/ui/ComboSelect';
import { useJobOpenings, useJobApplicants, useCreateJobOpening, useDepartments, useDesignations, useCompanies } from '@/hooks/useFrappe';
import { catalogService } from '@/api/services';
import { toast } from '@/components/ui/Toast';
import type { JobOpening, JobApplicant } from '@/types/frappe';

/** Strip HTML tags for plain-text preview */
function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, '').trim();
}

export default function Recruitment() {
  const [activeTab, setActiveTab] = useState<'openings' | 'applicants'>('openings');
  const [showNewModal, setShowNewModal] = useState(false);
  const [selectedOpening, setSelectedOpening] = useState<JobOpening | null>(null);
  const [applicantFilter, setApplicantFilter] = useState<string>('');
  const [newOpening, setNewOpening] = useState({
    job_title: '',
    designation: '',
    department: '',
    company: '',
    description: '',
    location: '',
  });

  const { data: openings, isLoading: loadingOpenings } = useJobOpenings();
  const { data: applicants, isLoading: loadingApplicants } = useJobApplicants();
  const { data: departments } = useDepartments();
  const { data: designations } = useDesignations();
  const { data: companies } = useCompanies();
  const createMutation = useCreateJobOpening();

  const departmentOptions = (departments ?? []).map((d) => ({
    value: d.name,
    label: d.department_name || d.name,
  }));
  const designationOptions = (designations ?? []).map((d) => ({
    value: d.name,
    label: d.designation || d.name,
  }));
  const companyOptions = (companies ?? []).map((c) => ({
    value: c.name,
    label: c.company_name || c.name,
  }));

  const openCount = openings?.filter((o) => o.status === 'Open').length ?? 0;
  const totalApplicants = applicants?.length ?? 0;
  const acceptedCount = applicants?.filter((a) => a.status === 'Accepted').length ?? 0;

  const handleCreate = async () => {
    try {
      // Pre-create catalog entries that don't exist
      const promises: Promise<void>[] = [];

      if (newOpening.company && !companyOptions.some((o) => o.value === newOpening.company)) {
        promises.push(
          catalogService.ensureExists('Company', {
            company_name: newOpening.company,
            abbr: newOpening.company.substring(0, 5).toUpperCase(),
            default_currency: 'MXN',
            country: 'Mexico',
          })
        );
      }
      if (newOpening.designation && !designationOptions.some((o) => o.value === newOpening.designation)) {
        promises.push(
          catalogService.ensureExists('Designation', { designation: newOpening.designation })
        );
      }
      if (newOpening.department && !departmentOptions.some((o) => o.value === newOpening.department)) {
        promises.push(
          catalogService.ensureExists('Department', {
            department_name: newOpening.department,
            company: newOpening.company || undefined,
          })
        );
      }

      if (promises.length > 0) {
        await Promise.all(promises);
      }

      await createMutation.mutateAsync(newOpening);
      toast.success('Vacante creada', 'La vacante se publicó correctamente.');
      setShowNewModal(false);
      setNewOpening({ job_title: '', designation: '', department: '', company: '', description: '', location: '' });
    } catch (err) {
      toast.fromError(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Reclutamiento</h1>
          <p className="mt-1 text-gray-500">Gestión de vacantes y candidatos</p>
        </div>
        <button onClick={() => setShowNewModal(true)} className="btn-primary">
          <Plus className="h-4 w-4" />
          Nueva Vacante
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-4">
        <StatsCard title="Vacantes Abiertas" value={openCount} icon={Briefcase} color="blue" />
        <StatsCard title="Total Candidatos" value={totalApplicants} icon={Users} color="purple" />
        <StatsCard title="En Proceso" value={totalApplicants - acceptedCount} icon={Clock} color="orange" />
        <StatsCard title="Contratados" value={acceptedCount} icon={CheckCircle2} color="green" />
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex gap-8">
          {[
            { id: 'openings' as const, label: 'Vacantes' },
            { id: 'applicants' as const, label: 'Candidatos' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`border-b-2 pb-3 text-sm font-medium transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {activeTab === 'openings' && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {loadingOpenings ? (
            <div className="col-span-3 flex h-40 items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            </div>
          ) : openings?.length === 0 ? (
            <div className="col-span-3 py-12 text-center text-gray-400">
              No hay vacantes. Crea una nueva desde el botón 'Nueva Vacante'.
            </div>
          ) : (
            openings?.map((opening: JobOpening) => (
              <div key={opening.name} className="card transition-shadow hover:shadow-md">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="font-semibold text-gray-900">{opening.job_title}</h3>
                  <StatusBadge status={opening.status} />
                </div>
                <div className="space-y-2 text-sm text-gray-500">
                  <p>{opening.department}</p>
                  {opening.location && <p>{opening.location}</p>}
                  {opening.designation && <p>{opening.designation}</p>}
                </div>
                {opening.description && (
                  <p className="mt-3 line-clamp-2 text-sm text-gray-400">
                    {stripHtml(opening.description)}
                  </p>
                )}
                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setSelectedOpening(opening)}
                    className="btn-secondary flex-1 text-xs"
                  >
                    Ver Detalle
                  </button>
                  <button
                    onClick={() => {
                      setApplicantFilter(opening.name);
                      setActiveTab('applicants');
                    }}
                    className="btn-primary flex-1 text-xs"
                  >
                    Candidatos
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'applicants' && (() => {
        const filtered = applicantFilter
          ? applicants?.filter((a) => a.job_title === applicantFilter || a.name === applicantFilter)
          : applicants;
        return (
          <div className="space-y-3">
            {applicantFilter && (
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Filtrando por vacante:</span>
                <span className="inline-flex items-center gap-1 rounded-full bg-primary-100 px-3 py-1 text-sm font-medium text-primary-700">
                  {applicantFilter}
                  <button onClick={() => setApplicantFilter('')} className="ml-1 rounded-full p-0.5 hover:bg-primary-200">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              </div>
            )}
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Candidato</th>
                    <th>Vacante</th>
                    <th>Email</th>
                    <th>Estado</th>
                    <th>Rating</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loadingApplicants ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center">
                        <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
                      </td>
                    </tr>
                  ) : !filtered || filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-gray-400">
                        {applicantFilter ? 'No hay candidatos para esta vacante' : 'No hay candidatos registrados'}
                      </td>
                    </tr>
                  ) : (
                    filtered.map((app: JobApplicant) => (
                      <tr key={app.name}>
                        <td className="font-medium text-gray-900">{app.applicant_name}</td>
                        <td>{app.job_title}</td>
                        <td>{app.email_id}</td>
                        <td>
                          <StatusBadge status={app.status} />
                        </td>
                        <td>
                          <div className="flex gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <span
                                key={star}
                                className={star <= (app.rating ?? 0) ? 'text-yellow-400' : 'text-gray-200'}
                              >
                                ★
                              </span>
                            ))}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        );
      })()}

      {/* Detail Modal */}
      <Modal
        isOpen={!!selectedOpening}
        onClose={() => setSelectedOpening(null)}
        title={selectedOpening?.job_title || 'Detalle de Vacante'}
        size="lg"
        footer={
          <>
            <button onClick={() => setSelectedOpening(null)} className="btn-secondary">Cerrar</button>
            <button
              onClick={() => {
                if (selectedOpening) {
                  setApplicantFilter(selectedOpening.name);
                  setActiveTab('applicants');
                  setSelectedOpening(null);
                }
              }}
              className="btn-primary"
            >
              Ver Candidatos
            </button>
          </>
        }
      >
        {selectedOpening && (
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <StatusBadge status={selectedOpening.status} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              {selectedOpening.department && (
                <div className="flex items-center gap-2 text-sm">
                  <Building2 className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Departamento:</span>
                  <span className="font-medium text-gray-900">{selectedOpening.department}</span>
                </div>
              )}
              {selectedOpening.designation && (
                <div className="flex items-center gap-2 text-sm">
                  <Briefcase className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Puesto:</span>
                  <span className="font-medium text-gray-900">{selectedOpening.designation}</span>
                </div>
              )}
              {selectedOpening.location && (
                <div className="flex items-center gap-2 text-sm">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <span className="text-gray-500">Ubicación:</span>
                  <span className="font-medium text-gray-900">{selectedOpening.location}</span>
                </div>
              )}
            </div>
            {selectedOpening.description && (
              <div>
                <h4 className="mb-2 text-sm font-semibold text-gray-700">Descripción</h4>
                <div
                  className="prose prose-sm max-w-none text-gray-600"
                  dangerouslySetInnerHTML={{ __html: selectedOpening.description }}
                />
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* New Opening Modal */}
      <Modal
        isOpen={showNewModal}
        onClose={() => setShowNewModal(false)}
        title="Nueva Vacante"
        size="lg"
        footer={
          <>
            <button onClick={() => setShowNewModal(false)} className="btn-secondary">Cancelar</button>
            <button onClick={handleCreate} disabled={createMutation.isPending} className="btn-primary">
              {createMutation.isPending ? 'Creando...' : 'Publicar Vacante'}
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Título del puesto</label>
              <input className="input" value={newOpening.job_title} onChange={(e) => setNewOpening({ ...newOpening, job_title: e.target.value })} />
            </div>
            <div>
              <ComboSelect
                label="Designación"
                options={designationOptions}
                value={newOpening.designation}
                onChange={(val) => setNewOpening({ ...newOpening, designation: val })}
                placeholder="Seleccionar o crear puesto"
              />
            </div>
            <div>
              <ComboSelect
                label="Departamento"
                options={departmentOptions}
                value={newOpening.department}
                onChange={(val) => setNewOpening({ ...newOpening, department: val })}
                placeholder="Seleccionar o crear departamento"
              />
            </div>
            <div>
              <ComboSelect
                label="Empresa"
                options={companyOptions}
                value={newOpening.company}
                onChange={(val) => setNewOpening({ ...newOpening, company: val })}
                placeholder="Seleccionar o crear empresa"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Ubicación</label>
              <input className="input" value={newOpening.location} onChange={(e) => setNewOpening({ ...newOpening, location: e.target.value })} />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Descripción</label>
            <textarea className="input min-h-[100px]" value={newOpening.description} onChange={(e) => setNewOpening({ ...newOpening, description: e.target.value })} />
          </div>
        </div>
      </Modal>
    </div>
  );
}
