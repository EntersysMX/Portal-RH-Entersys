import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Globe,
  Cpu,
  CheckCircle2,
  XCircle,
  Wifi,
  Eye,
  EyeOff,
  Shield,
  Users,
  Bell,
  Palette,
  CloudDownload,
} from 'lucide-react';
import { frappeTestConnection } from '@/api/client';
import { usePermissions } from '@/hooks/usePermissions';

export default function Settings() {
  const navigate = useNavigate();
  const { isAdmin } = usePermissions();
  const [serverUrl, setServerUrl] = useState(
    localStorage.getItem('frappe_url') || 'http://localhost:8080'
  );
  const [apiToken, setApiToken] = useState(
    localStorage.getItem('frappe_api_token') || ''
  );
  const [showToken, setShowToken] = useState(false);
  const [saved, setSaved] = useState(false);

  // Test de conexión
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    success: boolean;
    user?: string;
    version?: string;
    error?: string;
  } | null>(null);

  const handleSave = () => {
    localStorage.setItem('frappe_url', serverUrl);
    if (apiToken) {
      localStorage.setItem('frappe_api_token', apiToken);
    } else {
      localStorage.removeItem('frappe_api_token');
    }
    setSaved(true);
    setTestResult(null);
    setTimeout(() => setSaved(false), 3000);
  };

  const handleTestConnection = async () => {
    localStorage.setItem('frappe_url', serverUrl);
    if (apiToken) localStorage.setItem('frappe_api_token', apiToken);

    setTesting(true);
    setTestResult(null);
    const result = await frappeTestConnection();
    setTestResult(result);
    setTesting(false);
  };

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Configuración</h1>
        <p className="mt-1 text-gray-500">Ajustes generales del sistema EnterHR</p>
      </div>

      {/* General info */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-primary-50 p-2">
            <Shield className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Información del Sistema</h2>
            <p className="text-sm text-gray-500">Datos generales de tu instalación</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-gray-500">Plataforma</p>
            <p className="font-semibold text-gray-900">EnterHR v1.0</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-gray-500">Licencia</p>
            <p className="font-semibold text-gray-900">Empresarial</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-gray-500">Módulos activos</p>
            <p className="font-semibold text-gray-900">10+</p>
          </div>
          <div className="rounded-lg bg-gray-50 p-3">
            <p className="text-gray-500">Soporte</p>
            <p className="font-semibold text-gray-900">Entersys</p>
          </div>
        </div>
      </div>

      {/* Notifications */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-orange-50 p-2">
            <Bell className="h-5 w-5 text-orange-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Notificaciones</h2>
            <p className="text-sm text-gray-500">Preferencias de alertas</p>
          </div>
        </div>
        <div className="space-y-3">
          <label className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-700">Nuevas solicitudes de permiso</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-700">Recibos de nómina generados</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-700">Evaluaciones de desempeño</span>
            <input type="checkbox" defaultChecked className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          </label>
          <label className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3">
            <span className="text-sm text-gray-700">Cumpleaños de empleados</span>
            <input type="checkbox" className="h-4 w-4 rounded border-gray-300 text-primary-600" />
          </label>
        </div>
      </div>

      {/* Appearance */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2">
            <Palette className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Apariencia</h2>
            <p className="text-sm text-gray-500">Personalización visual</p>
          </div>
        </div>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Idioma</label>
            <select className="input w-auto" defaultValue="es">
              <option value="es">Español</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Zona horaria</label>
            <select className="input w-auto" defaultValue="america_mexico">
              <option value="america_mexico">América/Ciudad de México (UTC-6)</option>
              <option value="america_monterrey">América/Monterrey (UTC-6)</option>
              <option value="america_tijuana">América/Tijuana (UTC-8)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Roles overview */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-2">
            <Users className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Perfiles de Acceso</h2>
            <p className="text-sm text-gray-500">Roles disponibles en el sistema</p>
          </div>
        </div>
        <div className="space-y-2">
          {[
            { role: 'Administrador', desc: 'Acceso total al sistema, configuración y gestión de usuarios', color: 'bg-red-100 text-red-700' },
            { role: 'HR Manager', desc: 'Gestión completa de empleados, nómina, reclutamiento y reportes', color: 'bg-purple-100 text-purple-700' },
            { role: 'HR User', desc: 'Operaciones de RH: empleados, asistencia, nómina y organización', color: 'bg-blue-100 text-blue-700' },
            { role: 'Empleado', desc: 'Portal de autoservicio: perfil, nómina, asistencia y capacitación', color: 'bg-green-100 text-green-700' },
          ].map((item) => (
            <div key={item.role} className="flex items-center gap-3 rounded-lg bg-gray-50 px-4 py-3">
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${item.color}`}>
                {item.role}
              </span>
              <span className="text-sm text-gray-600">{item.desc}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Server connection - only for admins */}
      {isAdmin && (
        <>
          <div className="card p-6">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Globe className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Conexión al Servidor</h2>
                <p className="text-sm text-gray-500">
                  Configuración del backend de datos
                </p>
              </div>
            </div>
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  URL del Servidor
                </label>
                <input
                  className="input"
                  value={serverUrl}
                  onChange={(e) => setServerUrl(e.target.value)}
                  placeholder="http://localhost:8080"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Dirección donde se encuentra el servicio de backend
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Token de API (opcional)
                </label>
                <div className="relative">
                  <input
                    className="input pr-12 font-mono text-sm"
                    type={showToken ? 'text' : 'password'}
                    value={apiToken}
                    onChange={(e) => setApiToken(e.target.value)}
                    placeholder="api_key:api_secret"
                  />
                  <button
                    type="button"
                    onClick={() => setShowToken(!showToken)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 hover:text-gray-600"
                  >
                    {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Save + Test */}
          <div className="flex flex-wrap items-center gap-3">
            <button onClick={handleSave} className="btn-primary">
              Guardar Configuración
            </button>
            <button
              onClick={handleTestConnection}
              disabled={testing}
              className="btn-secondary"
            >
              {testing ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
              ) : (
                <Wifi className="h-4 w-4" />
              )}
              Probar Conexión
            </button>
            {saved && (
              <span className="text-sm font-medium text-green-600">Guardado</span>
            )}
          </div>

          {/* Test result */}
          {testResult && (
            <div
              className={`rounded-xl border p-4 ${
                testResult.success
                  ? 'border-green-200 bg-green-50'
                  : 'border-red-200 bg-red-50'
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5 text-red-600" />
                )}
                <span
                  className={`font-semibold ${
                    testResult.success ? 'text-green-800' : 'text-red-800'
                  }`}
                >
                  {testResult.success ? 'Conexión exitosa' : 'Error de conexión'}
                </span>
              </div>
              {testResult.success && (
                <div className="mt-2 space-y-1 text-sm text-green-700">
                  <p>Usuario: <strong>{testResult.user}</strong></p>
                  <p>Versión del servidor: <strong>{testResult.version}</strong></p>
                </div>
              )}
              {testResult.error && (
                <p className="mt-2 text-sm text-red-700">{testResult.error}</p>
              )}
            </div>
          )}
        </>
      )}

      {/* Google Workspace - only for admins */}
      {isAdmin && (
        <GoogleWorkspaceCard onNavigate={() => navigate('/google-sync')} />
      )}

      {/* AI */}
      <div className="card p-6">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-lg bg-purple-50 p-2">
            <Cpu className="h-5 w-5 text-purple-600" />
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">Inteligencia Artificial</h2>
            <p className="text-sm text-gray-500">Funciones de IA integradas en EnterHR</p>
          </div>
        </div>
        <div className="space-y-2 text-sm text-gray-500">
          <ul className="ml-4 list-disc space-y-1">
            <li>Chatbot para consultas de políticas de HR</li>
            <li>Parseo automático de CVs con extracción de datos</li>
            <li>Análisis de sentimiento en encuestas de clima laboral</li>
            <li>Predicción de rotación de personal</li>
            <li>Recomendaciones de capacitación personalizadas</li>
            <li>Detección automática de anomalías en asistencia</li>
          </ul>
          <div className="mt-4 rounded-lg border border-purple-200 bg-purple-50 p-3">
            <p className="text-sm font-medium text-purple-800">
              Estas funciones se pueden activar con modelos de IA locales (sin enviar datos a terceros)
              o con APIs de IA como OpenAI, Anthropic, o modelos open-source vía Ollama.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function GoogleWorkspaceCard({ onNavigate }: { onNavigate: () => void }) {
  const [googleClientId, setGoogleClientId] = useState(
    localStorage.getItem('google_client_id') || ''
  );
  const [googleDomain, setGoogleDomain] = useState(
    localStorage.getItem('google_domain') || ''
  );
  const [googleCompany, setGoogleCompany] = useState(
    localStorage.getItem('google_default_company') || ''
  );
  const [googleSaved, setGoogleSaved] = useState(false);

  const handleSaveGoogle = () => {
    if (googleClientId) localStorage.setItem('google_client_id', googleClientId);
    else localStorage.removeItem('google_client_id');
    if (googleDomain) localStorage.setItem('google_domain', googleDomain);
    else localStorage.removeItem('google_domain');
    if (googleCompany) localStorage.setItem('google_default_company', googleCompany);
    else localStorage.removeItem('google_default_company');
    setGoogleSaved(true);
    setTimeout(() => setGoogleSaved(false), 3000);
  };

  return (
    <div className="card p-6">
      <div className="mb-4 flex items-center gap-3">
        <div className="rounded-lg bg-blue-50 p-2">
          <CloudDownload className="h-5 w-5 text-blue-600" />
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Google Workspace</h2>
          <p className="text-sm text-gray-500">
            Conecta con el directorio y hojas de Google para importar empleados
          </p>
        </div>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700">
            Client ID de Google
          </label>
          <input
            className="input font-mono text-sm"
            value={googleClientId}
            onChange={(e) => setGoogleClientId(e.target.value)}
            placeholder="123456789-xxxxx.apps.googleusercontent.com"
          />
          <p className="mt-1 text-xs text-gray-400">
            Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Dominio</label>
            <input
              className="input"
              value={googleDomain}
              onChange={(e) => setGoogleDomain(e.target.value)}
              placeholder="entersys.com"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Empresa por defecto</label>
            <input
              className="input"
              value={googleCompany}
              onChange={(e) => setGoogleCompany(e.target.value)}
              placeholder="Entersys"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button onClick={handleSaveGoogle} className="btn-primary">
            Guardar
          </button>
          <button onClick={onNavigate} className="btn-secondary">
            <CloudDownload className="h-4 w-4" />
            Ir a Google Sync
          </button>
          {googleSaved && (
            <span className="text-sm font-medium text-green-600">
              <CheckCircle2 className="mr-1 inline h-4 w-4" />
              Guardado
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
