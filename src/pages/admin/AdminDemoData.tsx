import { useState, useCallback } from 'react';
import { Database, Trash2, Play, AlertTriangle, CheckCircle2, XCircle, Info } from 'lucide-react';
import { seedDemoData, cleanDemoData, loadDemoTracker, type DemoTracker, type ProgressCallback } from '@/lib/demoData';

interface LogEntry {
  step: string;
  success: boolean;
  detail?: string;
  time: string;
}

export default function AdminDemoData() {
  const [tracker, setTracker] = useState<DemoTracker | null>(null);
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [action, setAction] = useState<'idle' | 'seeding' | 'cleaning'>('idle');

  const addLog: ProgressCallback = useCallback((step, success, detail) => {
    setLogs((prev) => [
      ...prev,
      { step, success, detail, time: new Date().toLocaleTimeString() },
    ]);
  }, []);

  const checkStatus = useCallback(async () => {
    setLoading(true);
    try {
      const t = await loadDemoTracker();
      setTracker(t);
    } catch {
      setTracker(null);
    }
    setChecked(true);
    setLoading(false);
  }, []);

  const handleSeed = async () => {
    if (!confirm('¿Crear datos demo? Se crearán registros de ejemplo en todos los módulos.')) return;
    setAction('seeding');
    setLogs([]);
    setLoading(true);
    try {
      const t = await seedDemoData(addLog);
      setTracker(t);
    } catch (err) {
      addLog('Error fatal en seeder', false, String(err));
    }
    setLoading(false);
    setAction('idle');
  };

  const handleClean = async () => {
    if (!confirm('¿Eliminar TODOS los datos demo? Esta acción no se puede deshacer.')) return;
    setAction('cleaning');
    setLogs([]);
    setLoading(true);
    try {
      await cleanDemoData(addLog);
      setTracker(null);
    } catch (err) {
      addLog('Error fatal en limpieza', false, String(err));
    }
    setLoading(false);
    setAction('idle');
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Datos Demo</h1>
        <p className="mt-1 text-gray-500">
          Crea o elimina datos de ejemplo para probar todos los módulos del portal
        </p>
      </div>

      {/* Temporary page notice */}
      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Info className="h-5 w-5 shrink-0 text-blue-500" />
          <p className="text-sm text-blue-800">
            Esta pagina es temporal y solo sirve para administrar los datos de demo.
            Se eliminara cuando el sistema este en produccion con datos reales.
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className="card">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-base font-semibold text-gray-900">Estado de Datos Demo</h3>
            {!checked ? (
              <p className="mt-1 text-sm text-gray-500">
                Verifica si existen datos demo en el sistema
              </p>
            ) : tracker && tracker.records.length > 0 ? (
              <div className="mt-2 space-y-1">
                <p className="text-sm text-green-700">
                  <CheckCircle2 className="mr-1 inline h-4 w-4" />
                  Datos demo activos: <strong>{tracker.records.length} registros</strong>
                </p>
                <p className="text-xs text-gray-500">
                  Empleada: {tracker.employeeName} ({tracker.employeeId})
                </p>
                <p className="text-xs text-gray-500">
                  Empresa: {tracker.company} &middot; Creados: {new Date(tracker.createdAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="mt-2 text-sm text-gray-400">
                No hay datos demo en el sistema
              </p>
            )}
          </div>

          {!checked && (
            <button onClick={checkStatus} disabled={loading} className="btn-secondary">
              <Database className="h-4 w-4" />
              Verificar
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {checked && (
        <div className="flex flex-wrap gap-3">
          {(!tracker || tracker.records.length === 0) && (
            <button
              onClick={handleSeed}
              disabled={loading}
              className="btn-primary"
            >
              {action === 'seeding' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Play className="h-4 w-4" />
              )}
              {action === 'seeding' ? 'Creando datos...' : 'Crear Datos Demo'}
            </button>
          )}

          {tracker && tracker.records.length > 0 && (
            <button
              onClick={handleClean}
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm transition-colors hover:bg-red-700 disabled:opacity-50"
            >
              {action === 'cleaning' ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
              {action === 'cleaning' ? 'Eliminando...' : 'Eliminar Datos Demo'}
            </button>
          )}
        </div>
      )}

      {/* Info Box */}
      {checked && (!tracker || tracker.records.length === 0) && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 shrink-0 text-amber-500" />
            <div className="text-sm text-amber-800">
              <p className="font-medium">Sobre los datos demo</p>
              <ul className="mt-2 list-inside list-disc space-y-1 text-amber-700">
                <li>Se creará la empleada <strong>Cynthia Monares Tellez (33 años)</strong> como referencia</li>
                <li>Se generan registros en todos los módulos: asistencia, nómina, préstamos, capacitación, etc.</li>
                <li>Todos los datos se almacenan en la base de datos de Frappe (nada hardcodeado)</li>
                <li>Puedes eliminar todo con un solo clic cuando quieras usar datos reales</li>
                <li>Algunos registros pueden fallar si el backend no tiene ciertos doctypes configurados</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Progress Log */}
      {logs.length > 0 && (
        <div className="card">
          <h3 className="mb-3 text-base font-semibold text-gray-900">
            {action === 'seeding' ? 'Progreso de Creación' : action === 'cleaning' ? 'Progreso de Limpieza' : 'Resultado'}
          </h3>
          <div className="max-h-96 space-y-1 overflow-y-auto rounded-lg bg-gray-50 p-3 font-mono text-xs">
            {logs.map((log, i) => (
              <div key={i} className="flex items-start gap-2">
                <span className="shrink-0 text-gray-400">{log.time}</span>
                {log.success ? (
                  <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-green-500" />
                ) : (
                  <XCircle className="mt-0.5 h-3 w-3 shrink-0 text-red-500" />
                )}
                <span className={log.success ? 'text-gray-700' : 'text-red-600'}>
                  {log.step}
                  {log.detail && <span className="ml-1 text-gray-400">({log.detail})</span>}
                </span>
              </div>
            ))}
            {loading && (
              <div className="flex items-center gap-2 text-gray-400">
                <div className="h-3 w-3 animate-spin rounded-full border-2 border-gray-300 border-t-primary-600" />
                Procesando...
              </div>
            )}
          </div>
        </div>
      )}

      {/* Records Table */}
      {tracker && tracker.records.length > 0 && logs.length === 0 && (
        <div className="card">
          <h3 className="mb-3 text-base font-semibold text-gray-900">
            Registros Demo ({tracker.records.length})
          </h3>
          <div className="max-h-80 overflow-y-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b text-xs text-gray-500">
                <tr>
                  <th className="pb-2 pr-4">Doctype</th>
                  <th className="pb-2 pr-4">ID</th>
                  <th className="pb-2">Almacén</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {tracker.records.map((rec, i) => (
                  <tr key={i} className="text-gray-700">
                    <td className="py-1.5 pr-4 font-medium">{rec.doctype}</td>
                    <td className="py-1.5 pr-4 font-mono text-xs text-gray-500">{rec.name}</td>
                    <td className="py-1.5">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        rec.store === 'frappe' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {rec.store === 'frappe' ? 'Frappe DB' : 'Note Store'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
