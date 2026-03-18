import { useState, useRef } from 'react';
import { Upload, Trash2, Building2, Save } from 'lucide-react';
import { useModuleStore } from '@/store/moduleStore';
import { frappeUploadFile } from '@/api/client';
import { toast } from '@/components/ui/Toast';
import BrandedLogo from '@/components/ui/BrandedLogo';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml'];

export default function BrandingSection() {
  const { branding, setBranding } = useModuleStore();
  const [companyName, setCompanyName] = useState(branding.companyName ?? '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast.error('Formato no soportado', 'Solo se permiten archivos PNG, JPG o SVG');
      return;
    }
    if (file.size > MAX_FILE_SIZE) {
      toast.error('Archivo muy grande', 'El logo no puede exceder 2MB');
      return;
    }

    setUploading(true);
    try {
      const result = await frappeUploadFile({ file, is_private: false });
      await setBranding({ ...branding, companyLogoUrl: result.file_url });
      toast.success('Logo actualizado', 'El logo se ha subido correctamente');
    } catch {
      toast.error('Error al subir', 'No se pudo subir el logo. Inténtalo de nuevo.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRemoveLogo = async () => {
    await setBranding({ ...branding, companyLogoUrl: null });
    toast.success('Logo eliminado', 'Se ha vuelto al icono por defecto');
  };

  const handleSaveName = async () => {
    setSaving(true);
    try {
      await setBranding({ ...branding, companyName: companyName.trim() || null });
      toast.success('Nombre actualizado', 'El nombre de empresa se ha guardado');
    } catch {
      toast.error('Error', 'No se pudo guardar el nombre');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-2">
        <Building2 className="h-5 w-5 text-primary-600" />
        <h2 className="text-lg font-semibold text-gray-900">Branding de Empresa</h2>
      </div>

      <div className="rounded-xl border border-gray-200 p-5 space-y-6">
        {/* Logo section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Logo de la empresa</label>
          <div className="flex items-center gap-4">
            {/* Preview */}
            <div className="flex h-16 w-16 items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 overflow-hidden">
              {branding.companyLogoUrl ? (
                <BrandedLogo src={branding.companyLogoUrl} size="lg" className="rounded-xl" />
              ) : (
                <Building2 className="h-8 w-8 text-gray-300" />
              )}
            </div>

            <div className="space-y-2">
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="btn-secondary text-sm"
                >
                  <Upload className="h-4 w-4" />
                  {uploading ? 'Subiendo...' : 'Subir logo'}
                </button>
                {branding.companyLogoUrl && (
                  <button
                    onClick={handleRemoveLogo}
                    className="btn-secondary text-sm text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                    Quitar
                  </button>
                )}
              </div>
              <p className="text-xs text-gray-500">PNG, JPG o SVG. Máximo 2MB.</p>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".png,.jpg,.jpeg,.svg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </div>

        {/* Company name section */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Nombre de la empresa</label>
          <div className="flex gap-2">
            <input
              type="text"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Ej: Acme Corp"
              className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
            />
            <button
              onClick={handleSaveName}
              disabled={saving}
              className="btn-primary text-sm"
            >
              <Save className="h-4 w-4" />
              {saving ? 'Guardando...' : 'Guardar'}
            </button>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Aparece como subtítulo en el sidebar. "EnterHR" se mantiene como marca principal.
          </p>
        </div>
      </div>
    </section>
  );
}
