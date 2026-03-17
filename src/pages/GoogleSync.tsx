import { useState, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Settings, CheckCircle2, XCircle, AlertTriangle, Loader2, Users,
  CloudDownload, ChevronDown, ChevronUp, ArrowLeft, ArrowRight,
  Link2, Table2, Columns3, Eye, Upload, PartyPopper,
  LogIn, Building2,
} from 'lucide-react';
import { employeeService } from '@/api/services';
import type { Employee } from '@/types/frappe';
import type {
  SyncStep, GoogleConfig, GoogleDirectoryUser, GoogleSheet,
  SheetWithMapping, MergedEmployee, ImportResult,
} from '@/lib/google/types';
import { MAPPABLE_FIELDS } from '@/lib/google/types';
import { loadGoogleScript, requestAccessToken, getStoredToken } from '@/lib/google/googleAuth';
import { fetchDirectoryUsers, mapDirectoryToEmployee } from '@/lib/google/googleDirectory';
import {
  extractSpreadsheetId, fetchSpreadsheetMeta, fetchSheetData,
} from '@/lib/google/googleSheets';
import { autoMapColumns, applyMapping, mergeEmployees } from '@/lib/google/googleMapper';

const STEPS: { key: SyncStep; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { key: 'config', label: 'Configuracion', icon: Settings },
  { key: 'auth', label: 'Autenticacion', icon: LogIn },
  { key: 'directory', label: 'Directorio', icon: Users },
  { key: 'sheets', label: 'Google Sheets', icon: Table2 },
  { key: 'mapping', label: 'Mapeo', icon: Columns3 },
  { key: 'preview', label: 'Preview', icon: Eye },
  { key: 'importing', label: 'Importando', icon: Upload },
  { key: 'done', label: 'Completado', icon: PartyPopper },
];

export default function GoogleSync() {
  const navigate = useNavigate();
  const [step, setStep] = useState<SyncStep>('config');

  // Config
  const [config, setConfig] = useState<GoogleConfig>({
    clientId: localStorage.getItem('google_client_id') || '976421339746-imv4i7avl2g3b5umlq8ts9u9l4ahnjs5.apps.googleusercontent.com',
    domain: localStorage.getItem('google_domain') || 'entersys.com',
    defaultCompany: localStorage.getItem('google_default_company') || 'Entersys',
  });

  // Auth
  const [authStatus, setAuthStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [authError, setAuthError] = useState('');
  const [token, setToken] = useState<string | null>(getStoredToken());

  // Directory
  const [directoryUsers, setDirectoryUsers] = useState<GoogleDirectoryUser[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState('');

  // Sheets
  const [sheetUrls, setSheetUrls] = useState('');
  const [loadedSheets, setLoadedSheets] = useState<GoogleSheet[]>([]);
  const [selectedSheets, setSelectedSheets] = useState<Set<string>>(new Set()); // "spreadsheetId:sheetTitle"
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [sheetsError, setSheetsError] = useState('');

  // Mapping
  const [sheetsWithMapping, setSheetsWithMapping] = useState<SheetWithMapping[]>([]);
  const [mappingLoading, setMappingLoading] = useState(false);

  // Preview
  const [mergedEmployees, setMergedEmployees] = useState<MergedEmployee[]>([]);
  const [showOnlyErrors, setShowOnlyErrors] = useState(false);
  const [expandedEmails, setExpandedEmails] = useState<Set<string>>(new Set());

  // Import
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0 });
  const [importResults, setImportResults] = useState<ImportResult[]>([]);
  const [importCancelled, setImportCancelled] = useState(false);
  const cancelRef = useRef(false);

  // ---- STEP: CONFIG ----
  const handleSaveConfig = () => {
    localStorage.setItem('google_client_id', config.clientId);
    localStorage.setItem('google_domain', config.domain);
    localStorage.setItem('google_default_company', config.defaultCompany);

    // Check stored token
    const existing = getStoredToken();
    if (existing) {
      setToken(existing);
      setAuthStatus('success');
      setStep('auth');
      setTimeout(() => goTo('directory'), 500);
    } else {
      setStep('auth');
    }
  };

  // ---- STEP: AUTH ----
  const handleAuth = async () => {
    setAuthStatus('loading');
    setAuthError('');
    console.log('[GoogleSync] Iniciando autenticacion con Client ID:', config.clientId);
    try {
      console.log('[GoogleSync] Cargando script de Google...');
      await loadGoogleScript();
      console.log('[GoogleSync] Script cargado. Solicitando token...');
      const t = await requestAccessToken(config.clientId);
      console.log('[GoogleSync] Token obtenido exitosamente');
      setToken(t);
      setAuthStatus('success');
      setTimeout(() => goTo('directory'), 800);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GoogleSync] Error de autenticacion:', msg);
      setAuthStatus('error');
      setAuthError(msg);
    }
  };

  // ---- STEP: DIRECTORY ----
  const handleLoadDirectory = useCallback(async () => {
    setDirectoryLoading(true);
    setDirectoryError('');
    console.log('[GoogleSync] Cargando directorio para dominio:', config.domain, 'con token:', token ? 'SI' : 'NO');
    try {
      const users = await fetchDirectoryUsers(token!, config.domain);
      console.log('[GoogleSync] Usuarios encontrados:', users.length);
      const active = users.filter((u) => !u.suspended);
      console.log('[GoogleSync] Usuarios activos (no suspendidos):', active.length);
      setDirectoryUsers(active);
      setSelectedUsers(new Set(active.map((u) => u.primaryEmail)));
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      console.error('[GoogleSync] Error al cargar directorio:', msg);
      setDirectoryError(msg);
    } finally {
      setDirectoryLoading(false);
    }
  }, [token, config.domain]);

  const toggleUser = (email: string) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  const toggleAllUsers = () => {
    if (selectedUsers.size === directoryUsers.length) {
      setSelectedUsers(new Set());
    } else {
      setSelectedUsers(new Set(directoryUsers.map((u) => u.primaryEmail)));
    }
  };

  // ---- STEP: SHEETS ----
  const handleLoadSheets = async () => {
    setSheetsLoading(true);
    setSheetsError('');

    try {
      const urls = sheetUrls.split('\n').map((u) => u.trim()).filter(Boolean);
      const results: GoogleSheet[] = [];

      for (const url of urls) {
        const id = extractSpreadsheetId(url);
        if (!id) {
          setSheetsError(`URL invalida: ${url}`);
          setSheetsLoading(false);
          return;
        }
        const meta = await fetchSpreadsheetMeta(token!, id);
        results.push(meta);
      }

      setLoadedSheets(results);
      // Auto-select all sheets
      const keys = new Set<string>();
      results.forEach((s) => s.sheets.forEach((sh) => keys.add(`${s.spreadsheetId}:${sh.title}`)));
      setSelectedSheets(keys);
    } catch (err) {
      setSheetsError(err instanceof Error ? err.message : 'Error al cargar hojas');
    } finally {
      setSheetsLoading(false);
    }
  };

  const toggleSheet = (key: string) => {
    setSelectedSheets((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  // ---- STEP: MAPPING ----
  const handleLoadMapping = async () => {
    setMappingLoading(true);

    try {
      const result: SheetWithMapping[] = [];

      for (const key of selectedSheets) {
        const [spreadsheetId, sheetTitle] = key.split(':');
        const sheet = loadedSheets.find((s) => s.spreadsheetId === spreadsheetId);

        const data = await fetchSheetData(token!, spreadsheetId, sheetTitle);
        const headers = data.headers;
        const rows = data.rows;

        const mappings = autoMapColumns(headers);

        result.push({
          spreadsheetId,
          spreadsheetTitle: sheet?.title || spreadsheetId,
          sheetTitle,
          headers,
          rows,
          mappings,
        });
      }

      setSheetsWithMapping(result);
    } catch (err) {
      setSheetsError(err instanceof Error ? err.message : 'Error al cargar datos');
    } finally {
      setMappingLoading(false);
    }
  };

  const updateMapping = (sheetIndex: number, columnIndex: number, newField: string) => {
    setSheetsWithMapping((prev) => {
      const next = [...prev];
      const sheet = { ...next[sheetIndex] };
      const mappings = [...sheet.mappings];
      mappings[columnIndex] = { ...mappings[columnIndex], employeeField: newField, confidence: newField ? 1 : 0 };
      sheet.mappings = mappings;
      next[sheetIndex] = sheet;
      return next;
    });
  };

  // ---- STEP: PREVIEW (merge) ----
  const handleBuildPreview = () => {
    // Empleados del directorio
    const dirEmps = directoryUsers
      .filter((u) => selectedUsers.has(u.primaryEmail))
      .map((u) => mapDirectoryToEmployee(u, config.defaultCompany));

    // Empleados de sheets
    const sheetEmps: Partial<Employee>[] = [];
    for (const swm of sheetsWithMapping) {
      const mapped = applyMapping(swm.rows, swm.mappings);
      sheetEmps.push(...mapped);
    }

    const merged = mergeEmployees(dirEmps, sheetEmps);
    setMergedEmployees(merged);
  };

  const toggleExpand = (email: string) => {
    setExpandedEmails((prev) => {
      const next = new Set(prev);
      if (next.has(email)) next.delete(email);
      else next.add(email);
      return next;
    });
  };

  // ---- STEP: IMPORT ----
  const handleImport = async () => {
    const toImport = mergedEmployees.filter((e) => e.isValid);
    setImportProgress({ current: 0, total: toImport.length });
    setImportResults([]);
    cancelRef.current = false;
    setImportCancelled(false);
    setStep('importing');

    const results: ImportResult[] = [];

    for (let i = 0; i < toImport.length; i++) {
      if (cancelRef.current) break;

      const emp = toImport[i];
      try {
        await employeeService.create(emp.data);
        results.push({ email: emp.email, name: `${emp.data.first_name} ${emp.data.last_name}`, success: true });
        setImportResults([...results]);
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Error desconocido';
        results.push({ email: emp.email, name: `${emp.data.first_name} ${emp.data.last_name}`, success: false, error: msg });
        setImportResults([...results]);
      }
      setImportProgress({ current: i + 1, total: toImport.length });
    }

    if (!cancelRef.current) {
      setStep('done');
    }
  };

  const handleCancel = () => {
    cancelRef.current = true;
    setImportCancelled(true);
    setStep('done');
  };

  // ---- NAVIGATION ----
  const goTo = (target: SyncStep) => {
    // On entering certain steps, trigger their data load
    if (target === 'directory' && directoryUsers.length === 0) {
      setStep(target);
      handleLoadDirectory();
    } else if (target === 'mapping' && sheetsWithMapping.length === 0 && selectedSheets.size > 0) {
      setStep(target);
      handleLoadMapping();
    } else if (target === 'preview') {
      handleBuildPreview();
      setStep(target);
    } else if (target === 'importing') {
      handleImport();
    } else {
      setStep(target);
    }
  };

  const currentIndex = STEPS.findIndex((s) => s.key === step);

  // Stats helpers
  const dirUsersWithDept = directoryUsers.filter((u) => u.organizations?.[0]?.department);
  const validCount = mergedEmployees.filter((e) => e.isValid).length;
  const errorCount = mergedEmployees.filter((e) => !e.isValid).length;
  const conflictCount = mergedEmployees.filter((e) => e.conflicts.length > 0).length;
  const importedOk = importResults.filter((r) => r.success).length;
  const importedFail = importResults.filter((r) => !r.success).length;

  const displayedEmployees = showOnlyErrors
    ? mergedEmployees.filter((e) => !e.isValid)
    : mergedEmployees;

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Google Workspace Sync</h1>
        <p className="mt-1 text-gray-500">
          Importa empleados desde el Directorio de Google Workspace y Google Sheets
        </p>
      </div>

      {/* Stepper */}
      <div className="card overflow-x-auto p-4">
        <div className="flex min-w-[640px] items-center justify-between">
          {STEPS.map((s, i) => {
            const isCompleted = i < currentIndex;
            const isCurrent = s.key === step;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center">
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                      isCompleted
                        ? 'bg-green-100 text-green-700'
                        : isCurrent
                        ? 'bg-primary-100 text-primary-700'
                        : 'bg-gray-100 text-gray-400'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <s.icon className="h-4 w-4" />
                    )}
                  </div>
                  <span
                    className={`mt-1 text-[10px] font-medium ${
                      isCurrent ? 'text-primary-700' : isCompleted ? 'text-green-700' : 'text-gray-400'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
                {i < STEPS.length - 1 && (
                  <div
                    className={`mx-1 h-0.5 w-8 sm:w-12 ${
                      i < currentIndex ? 'bg-green-300' : 'bg-gray-200'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Step Content */}
      <div className="card p-6">
        {/* CONFIG */}
        {step === 'config' && (
          <div className="space-y-5">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-primary-50 p-2">
                <Settings className="h-5 w-5 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Configuracion de Google Workspace</h2>
                <p className="text-sm text-gray-500">Ingresa los datos de tu proyecto de Google Cloud</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Client ID de Google <span className="text-red-500">*</span>
                </label>
                <input
                  className="input font-mono text-sm"
                  value={config.clientId}
                  onChange={(e) => setConfig({ ...config, clientId: e.target.value })}
                  placeholder="123456789-xxxxxx.apps.googleusercontent.com"
                />
                <p className="mt-1 text-xs text-gray-400">
                  Obtenlo en Google Cloud Console → APIs & Services → Credentials → OAuth 2.0 Client IDs
                </p>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Dominio <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={config.domain}
                  onChange={(e) => setConfig({ ...config, domain: e.target.value })}
                  placeholder="entersys.com"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Empresa por defecto <span className="text-red-500">*</span>
                </label>
                <input
                  className="input"
                  value={config.defaultCompany}
                  onChange={(e) => setConfig({ ...config, defaultCompany: e.target.value })}
                  placeholder="Entersys"
                />
              </div>
            </div>

            <div className="rounded-lg bg-gray-50 p-4">
              <h4 className="text-sm font-semibold text-gray-700">Como obtener el Client ID:</h4>
              <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-gray-600">
                <li>Ve a console.cloud.google.com</li>
                <li>Crea o selecciona un proyecto</li>
                <li>Habilita las APIs: Admin SDK y Google Sheets API</li>
                <li>En Credentials, crea un OAuth 2.0 Client ID (Web Application)</li>
                <li>Agrega tu dominio como Authorized JavaScript Origin</li>
                <li>Copia el Client ID aqui</li>
              </ol>
            </div>
          </div>
        )}

        {/* AUTH */}
        {step === 'auth' && (
          <div className="space-y-6 py-4 text-center">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-primary-50">
              <LogIn className="h-10 w-10 text-primary-600" />
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">Conectar con Google</h2>
              <p className="mt-1 text-sm text-gray-500">
                Se abrira una ventana para autorizar el acceso al directorio y hojas de calculo
              </p>
            </div>

            {authStatus === 'idle' && (
              <button onClick={handleAuth} className="btn-primary mx-auto inline-flex items-center gap-2 px-6 py-3 text-base">
                <CloudDownload className="h-5 w-5" />
                Conectar con Google Workspace
              </button>
            )}

            {authStatus === 'loading' && (
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <p className="text-sm text-gray-500">Conectando...</p>
              </div>
            )}

            {authStatus === 'success' && (
              <div className="flex flex-col items-center gap-2">
                <CheckCircle2 className="h-10 w-10 text-green-500" />
                <p className="text-sm font-medium text-green-700">Conectado exitosamente</p>
              </div>
            )}

            {authStatus === 'error' && (
              <div className="space-y-3">
                <div className="mx-auto max-w-md rounded-lg bg-red-50 p-4">
                  <div className="flex items-center gap-2">
                    <XCircle className="h-5 w-5 text-red-500" />
                    <p className="text-sm text-red-700">{authError}</p>
                  </div>
                </div>
                <button onClick={handleAuth} className="btn-primary">
                  Reintentar
                </button>
              </div>
            )}
          </div>
        )}

        {/* DIRECTORY */}
        {step === 'directory' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-blue-50 p-2">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Directorio de Google Workspace</h2>
                <p className="text-sm text-gray-500">Usuarios encontrados en {config.domain}</p>
              </div>
            </div>

            {directoryLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-3 text-sm text-gray-500">Cargando directorio...</span>
              </div>
            )}

            {directoryError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <div>
                  <p className="text-sm text-red-700">{directoryError}</p>
                  <button onClick={handleLoadDirectory} className="mt-2 text-sm font-medium text-red-800 underline">
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {!directoryLoading && !directoryError && directoryUsers.length > 0 && (
              <>
                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  <div className="rounded-lg bg-blue-50 p-3 text-center">
                    <p className="text-2xl font-bold text-blue-700">{directoryUsers.length}</p>
                    <p className="text-xs text-blue-600">Total encontrados</p>
                  </div>
                  <div className="rounded-lg bg-green-50 p-3 text-center">
                    <p className="text-2xl font-bold text-green-700">{dirUsersWithDept.length}</p>
                    <p className="text-xs text-green-600">Con departamento</p>
                  </div>
                  <div className="rounded-lg bg-yellow-50 p-3 text-center">
                    <p className="text-2xl font-bold text-yellow-700">
                      {directoryUsers.length - dirUsersWithDept.length}
                    </p>
                    <p className="text-xs text-yellow-600">Sin departamento</p>
                  </div>
                </div>

                {/* Table */}
                <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">
                          <input
                            type="checkbox"
                            checked={selectedUsers.size === directoryUsers.length}
                            onChange={toggleAllUsers}
                            className="h-4 w-4 rounded border-gray-300 text-primary-600"
                          />
                        </th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nombre</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Email</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Departamento</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Puesto</th>
                      </tr>
                    </thead>
                    <tbody>
                      {directoryUsers.map((user) => (
                        <tr key={user.primaryEmail} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2">
                            <input
                              type="checkbox"
                              checked={selectedUsers.has(user.primaryEmail)}
                              onChange={() => toggleUser(user.primaryEmail)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600"
                            />
                          </td>
                          <td className="px-3 py-2 font-medium text-gray-900">{user.name.fullName}</td>
                          <td className="px-3 py-2 text-gray-600">{user.primaryEmail}</td>
                          <td className="px-3 py-2 text-gray-600">
                            {user.organizations?.[0]?.department || <span className="text-gray-400">—</span>}
                          </td>
                          <td className="px-3 py-2 text-gray-600">
                            {user.organizations?.[0]?.title || <span className="text-gray-400">—</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}

            {!directoryLoading && !directoryError && directoryUsers.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <Users className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-2">No se encontraron usuarios en el directorio</p>
              </div>
            )}
          </div>
        )}

        {/* SHEETS */}
        {step === 'sheets' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-green-50 p-2">
                <Table2 className="h-5 w-5 text-green-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Google Sheets</h2>
                <p className="text-sm text-gray-500">
                  Pega las URLs de las hojas de calculo con datos de empleados
                </p>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                URLs de Google Sheets (una por linea)
              </label>
              <textarea
                className="input min-h-[80px] font-mono text-sm"
                value={sheetUrls}
                onChange={(e) => setSheetUrls(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/abc123.../edit"
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleLoadSheets}
                disabled={sheetsLoading || !sheetUrls.trim()}
                className="btn-primary"
              >
                {sheetsLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Link2 className="h-4 w-4" />
                )}
                Cargar Hojas
              </button>
            </div>

            {sheetsError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
                <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
                <p className="text-sm text-red-700">{sheetsError}</p>
              </div>
            )}

            {loadedSheets.length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-gray-700">Hojas encontradas:</h3>
                {loadedSheets.map((ss) => (
                  <div key={ss.spreadsheetId} className="rounded-lg border border-gray-200 p-3">
                    <p className="font-medium text-gray-900">{ss.title}</p>
                    <div className="mt-2 space-y-1">
                      {ss.sheets.map((sh) => {
                        const key = `${ss.spreadsheetId}:${sh.title}`;
                        return (
                          <label key={key} className="flex items-center gap-2 rounded bg-gray-50 px-3 py-2 text-sm">
                            <input
                              type="checkbox"
                              checked={selectedSheets.has(key)}
                              onChange={() => toggleSheet(key)}
                              className="h-4 w-4 rounded border-gray-300 text-primary-600"
                            />
                            <span className="text-gray-700">{sh.title}</span>
                            <span className="text-xs text-gray-400">({sh.rowCount} filas)</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-3">
              <p className="text-sm text-yellow-800">
                Si solo deseas importar del directorio de Google Workspace, puedes omitir este paso y continuar.
              </p>
            </div>
          </div>
        )}

        {/* MAPPING */}
        {step === 'mapping' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-purple-50 p-2">
                <Columns3 className="h-5 w-5 text-purple-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Mapeo de Columnas</h2>
                <p className="text-sm text-gray-500">Verifica y ajusta el mapeo de columnas a campos de EnterHR</p>
              </div>
            </div>

            {mappingLoading && (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                <span className="ml-3 text-sm text-gray-500">Cargando datos de hojas...</span>
              </div>
            )}

            {!mappingLoading && sheetsWithMapping.map((swm, sheetIdx) => (
              <div key={`${swm.spreadsheetId}:${swm.sheetTitle}`} className="rounded-lg border border-gray-200">
                <div className="border-b border-gray-200 bg-gray-50 px-4 py-2">
                  <p className="text-sm font-semibold text-gray-700">
                    {swm.spreadsheetTitle} — {swm.sheetTitle}
                    <span className="ml-2 text-xs font-normal text-gray-400">({swm.rows.length} filas)</span>
                  </p>
                </div>
                <div className="max-h-[40vh] overflow-y-auto p-4">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Columna en Hoja</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Campo EnterHR</th>
                        <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {swm.mappings.map((mapping, colIdx) => (
                        <tr key={colIdx} className="border-b border-gray-100 last:border-0">
                          <td className="px-3 py-2 font-medium text-gray-900">{mapping.sheetColumn}</td>
                          <td className="px-3 py-2">
                            <select
                              className="input w-full max-w-[220px] text-sm"
                              value={mapping.employeeField}
                              onChange={(e) => updateMapping(sheetIdx, colIdx, e.target.value)}
                            >
                              {MAPPABLE_FIELDS.map((f) => (
                                <option key={f.value} value={f.value}>{f.label}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2">
                            {mapping.employeeField ? (
                              <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                                <CheckCircle2 className="h-3 w-3" />
                                {mapping.confidence >= 0.8 ? 'Auto' : 'Manual'}
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                                <AlertTriangle className="h-3 w-3" />
                                Sin mapear
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}

            {!mappingLoading && sheetsWithMapping.length === 0 && selectedSheets.size === 0 && (
              <div className="py-8 text-center text-gray-500">
                <p>No hay hojas seleccionadas para mapear. Los datos vendran solo del directorio.</p>
              </div>
            )}
          </div>
        )}

        {/* PREVIEW */}
        {step === 'preview' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="rounded-lg bg-cyan-50 p-2">
                <Eye className="h-5 w-5 text-cyan-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Preview de Importacion</h2>
                <p className="text-sm text-gray-500">Revisa los datos consolidados antes de importar</p>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <p className="text-2xl font-bold text-blue-700">{mergedEmployees.length}</p>
                <p className="text-xs text-blue-600">Total</p>
              </div>
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <p className="text-2xl font-bold text-green-700">{validCount}</p>
                <p className="text-xs text-green-600">Validos</p>
              </div>
              <div className="rounded-lg bg-red-50 p-3 text-center">
                <p className="text-2xl font-bold text-red-700">{errorCount}</p>
                <p className="text-xs text-red-600">Con errores</p>
              </div>
              <div className="rounded-lg bg-yellow-50 p-3 text-center">
                <p className="text-2xl font-bold text-yellow-700">{conflictCount}</p>
                <p className="text-xs text-yellow-600">Conflictos</p>
              </div>
            </div>

            {/* Filter */}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={showOnlyErrors}
                onChange={(e) => setShowOnlyErrors(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-primary-600"
              />
              <span className="text-gray-700">Mostrar solo con errores</span>
            </label>

            {/* Table */}
            <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-100">
                  <tr>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Fuente</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nombre</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Email</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Depto</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Puesto</th>
                    <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Estado</th>
                    <th className="w-8 px-2"></th>
                  </tr>
                </thead>
                <tbody>
                  {displayedEmployees.map((emp) => {
                    const isExpanded = expandedEmails.has(emp.email);
                    const name = [emp.data.first_name, emp.data.last_name].filter(Boolean).join(' ') || '(sin nombre)';

                    return (
                      <tr key={emp.email} className="border-b border-gray-100 last:border-0">
                        <td className="px-3 py-2">
                          <div className="flex gap-1">
                            {emp.source.includes('directory') && (
                              <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                DIR
                              </span>
                            )}
                            {emp.source.includes('sheet') && (
                              <span className="rounded bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                                SHEET
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-3 py-2 font-medium text-gray-900">{name}</td>
                        <td className="px-3 py-2 text-gray-600">{emp.email}</td>
                        <td className="px-3 py-2 text-gray-600">{emp.data.department || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{emp.data.designation || '—'}</td>
                        <td className="px-3 py-2">
                          {emp.isValid ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                              {emp.errors.length} error{emp.errors.length > 1 ? 'es' : ''}
                            </span>
                          )}
                        </td>
                        <td className="px-2 py-2">
                          {(emp.errors.length > 0 || emp.warnings.length > 0 || emp.conflicts.length > 0) && (
                            <button onClick={() => toggleExpand(emp.email)} className="rounded p-0.5 text-gray-400 hover:bg-gray-100">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </button>
                          )}
                        </td>
                        {isExpanded && (
                          <td colSpan={7} className="bg-gray-50 px-4 py-2">
                            <div className="space-y-1">
                              {emp.errors.map((err, i) => (
                                <div key={`e${i}`} className="flex items-start gap-1.5 text-xs text-red-700">
                                  <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                  {err}
                                </div>
                              ))}
                              {emp.warnings.map((w, i) => (
                                <div key={`w${i}`} className="flex items-start gap-1.5 text-xs text-yellow-700">
                                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                  {w}
                                </div>
                              ))}
                              {emp.conflicts.map((c, i) => (
                                <div key={`c${i}`} className="flex items-start gap-1.5 text-xs text-blue-700">
                                  <Building2 className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
                                  <span>
                                    <strong>{c.field}:</strong> Directorio="{c.directoryValue}" vs Sheet="{c.sheetValue}"
                                  </span>
                                </div>
                              ))}
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {mergedEmployees.length === 0 && (
              <div className="py-8 text-center text-gray-500">
                <p>No hay empleados para previsualizar. Verifica los pasos anteriores.</p>
              </div>
            )}
          </div>
        )}

        {/* IMPORTING */}
        {step === 'importing' && (
          <div className="space-y-6 py-4">
            <div className="text-center">
              <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
              <h3 className="mt-4 text-lg font-semibold text-gray-900">Importando empleados...</h3>
              <p className="mt-1 text-sm text-gray-500">
                Creando empleado {importProgress.current} de {importProgress.total}
              </p>
            </div>

            {/* Progress bar */}
            <div className="mx-auto max-w-md">
              <div className="h-3 overflow-hidden rounded-full bg-gray-200">
                <div
                  className="h-full rounded-full bg-primary-600 transition-all duration-300"
                  style={{
                    width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
              <p className="mt-1 text-center text-xs text-gray-500">
                {importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%
              </p>
            </div>

            {/* Live results */}
            {importResults.length > 0 && (
              <div className="mx-auto max-w-md max-h-40 overflow-y-auto rounded-lg border border-gray-200 p-3">
                {importResults.map((r, i) => (
                  <div key={i} className="flex items-center gap-2 py-1 text-xs">
                    {r.success ? (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-green-500" />
                    ) : (
                      <XCircle className="h-3.5 w-3.5 flex-shrink-0 text-red-500" />
                    )}
                    <span className={r.success ? 'text-gray-700' : 'text-red-700'}>
                      {r.name} {r.error ? `— ${r.error}` : ''}
                    </span>
                  </div>
                ))}
              </div>
            )}

            <div className="text-center">
              <button onClick={handleCancel} className="btn-secondary">
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* DONE */}
        {step === 'done' && (
          <div className="space-y-4 py-4">
            <div className="text-center">
              {importedFail === 0 && !importCancelled ? (
                <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
              ) : (
                <AlertTriangle className="mx-auto h-14 w-14 text-yellow-500" />
              )}
              <h3 className="mt-4 text-lg font-semibold text-gray-900">
                {importCancelled ? 'Importacion cancelada' : 'Importacion completada'}
              </h3>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-green-50 p-4 text-center">
                <p className="text-3xl font-bold text-green-700">{importedOk}</p>
                <p className="text-sm text-green-600">Creados</p>
              </div>
              <div className="rounded-lg bg-red-50 p-4 text-center">
                <p className="text-3xl font-bold text-red-700">{importedFail}</p>
                <p className="text-sm text-red-600">Fallidos</p>
              </div>
              <div className="rounded-lg bg-gray-50 p-4 text-center">
                <p className="text-3xl font-bold text-gray-700">
                  {mergedEmployees.filter((e) => !e.isValid).length}
                </p>
                <p className="text-sm text-gray-600">Omitidos</p>
              </div>
            </div>

            {importResults.filter((r) => !r.success).length > 0 && (
              <div className="rounded-lg bg-red-50 p-3">
                <p className="mb-2 text-sm font-semibold text-red-800">Errores durante importacion:</p>
                <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-red-700">
                  {importResults.filter((r) => !r.success).map((r, i) => (
                    <li key={i} className="flex items-start gap-1">
                      <XCircle className="mt-0.5 h-3 w-3 flex-shrink-0" />
                      {r.name}: {r.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="text-center pt-2">
              <button onClick={() => navigate('/employees')} className="btn-primary">
                Ir a Empleados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Navigation */}
      {step !== 'importing' && step !== 'done' && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => {
              if (currentIndex > 0) goTo(STEPS[currentIndex - 1].key);
            }}
            disabled={currentIndex === 0}
            className="btn-secondary"
          >
            <ArrowLeft className="h-4 w-4" />
            Anterior
          </button>

          <button
            onClick={() => {
              if (step === 'config') {
                handleSaveConfig();
              } else if (step === 'preview') {
                goTo('importing');
              } else if (currentIndex < STEPS.length - 1) {
                goTo(STEPS[currentIndex + 1].key);
              }
            }}
            disabled={
              (step === 'config' && !config.clientId) ||
              (step === 'config' && !config.domain) ||
              (step === 'config' && !config.defaultCompany) ||
              (step === 'auth' && authStatus !== 'success') ||
              (step === 'directory' && directoryLoading) ||
              (step === 'sheets' && sheetsLoading) ||
              (step === 'mapping' && mappingLoading) ||
              (step === 'preview' && validCount === 0)
            }
            className="btn-primary"
          >
            {step === 'preview' ? (
              <>
                <Upload className="h-4 w-4" />
                Importar {validCount} empleado{validCount !== 1 ? 's' : ''}
              </>
            ) : step === 'config' ? (
              <>
                Guardar y Continuar
                <ArrowRight className="h-4 w-4" />
              </>
            ) : (
              <>
                {step === 'directory' ? `Continuar con ${selectedUsers.size} seleccionados` : 'Siguiente'}
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
