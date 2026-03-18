import { useState, useRef, useCallback } from 'react';
import {
  Upload, FileSpreadsheet, CheckCircle2, XCircle, AlertTriangle,
  ChevronDown, ChevronUp, Users, Loader2, Download, X,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import { parseUploadedExcel, toEmployeeCreateData } from '@/lib/excel/bulkUploadParser';
import { downloadPlantillaCargaMasiva } from '@/lib/excel/excelGenerator';
import { employeeService, catalogService } from '@/api/services';
import { parseFrappeError } from '@/lib/frappeErrors';
import type { ParseResult, ParsedRow } from '@/lib/excel/bulkUploadParser';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onComplete: () => void;
}

type Step = 'upload' | 'preview' | 'importing' | 'done';

export default function BulkUploadModal({ isOpen, onClose, onComplete }: Props) {
  const [step, setStep] = useState<Step>('upload');
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string>('');
  const [isParsing, setIsParsing] = useState(false);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [importProgress, setImportProgress] = useState({ current: 0, total: 0, errors: [] as string[] });
  const [importResults, setImportResults] = useState({ created: 0, failed: 0, errors: [] as string[] });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setStep('upload');
    setParseResult(null);
    setParseError('');
    setIsParsing(false);
    setExpandedRows(new Set());
    setImportProgress({ current: 0, total: 0, errors: [] });
    setImportResults({ created: 0, failed: 0, errors: [] });
    if (fileInputRef.current) fileInputRef.current.value = '';
  }, []);

  const handleClose = () => {
    if (step === 'importing') return; // No cerrar durante importación
    reset();
    onClose();
  };

  const handleFileSelect = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setParseError('Solo se aceptan archivos Excel (.xlsx)');
      return;
    }

    setIsParsing(true);
    setParseError('');

    try {
      const result = await parseUploadedExcel(file);
      if (result.totalRows === 0) {
        setParseError('El archivo no contiene datos de empleados. Verifique que los datos estén en la hoja "Empleados" a partir de la fila 6.');
        setIsParsing(false);
        return;
      }
      setParseResult(result);
      setStep('preview');
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Error al leer el archivo');
    } finally {
      setIsParsing(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  };

  const handleImport = async () => {
    if (!parseResult) return;

    const validRows = parseResult.rows.filter((r) => r.isValid);
    if (validRows.length === 0) return;

    setStep('importing');
    setImportProgress({ current: 0, total: validRows.length, errors: [] });

    // Pre-create unique catalog entries
    const uniqueCompanies = new Set<string>();
    const uniqueDesignations = new Set<string>();
    const uniqueDepartments = new Set<string>();
    const uniqueBranches = new Set<string>();
    // Track company per department for the Department doctype
    const deptCompanyMap = new Map<string, string>();

    for (const row of validRows) {
      const emp = row.employee;
      if (emp.company) uniqueCompanies.add(emp.company);
      if (emp.designation) uniqueDesignations.add(emp.designation);
      if (emp.department) {
        uniqueDepartments.add(emp.department);
        if (emp.company) deptCompanyMap.set(emp.department, emp.company);
      }
      if (emp.branch) uniqueBranches.add(emp.branch);
    }

    try {
      const catalogPromises: Promise<void>[] = [];
      for (const company of uniqueCompanies) {
        catalogPromises.push(
          catalogService.ensureExists('Company', {
            company_name: company,
            abbr: company.substring(0, 5).toUpperCase(),
            default_currency: 'MXN',
            country: 'Mexico',
          })
        );
      }
      for (const designation of uniqueDesignations) {
        catalogPromises.push(
          catalogService.ensureExists('Designation', { designation })
        );
      }
      for (const branch of uniqueBranches) {
        catalogPromises.push(
          catalogService.ensureExists('Branch', { branch })
        );
      }
      await Promise.all(catalogPromises);

      // Departments depend on Company, so create after companies
      const deptPromises: Promise<void>[] = [];
      for (const dept of uniqueDepartments) {
        deptPromises.push(
          catalogService.ensureExists('Department', {
            department_name: dept,
            company: deptCompanyMap.get(dept) || undefined,
          })
        );
      }
      await Promise.all(deptPromises);
    } catch {
      // If catalog creation fails, continue with import anyway
    }

    let created = 0;
    let failed = 0;
    const errors: string[] = [];
    const BATCH_SIZE = 5;

    for (let i = 0; i < validRows.length; i += BATCH_SIZE) {
      const batch = validRows.slice(i, i + BATCH_SIZE);
      const results = await Promise.allSettled(
        batch.map((row) => {
          const data = toEmployeeCreateData(row.employee);
          return employeeService.create(data).then(() => ({ row, success: true as const }));
        })
      );

      for (let j = 0; j < results.length; j++) {
        const result = results[j];
        const row = batch[j];
        if (result.status === 'fulfilled') {
          created++;
        } else {
          failed++;
          const name = `${row.employee.first_name} ${row.employee.last_name}`;
          const parsed = parseFrappeError(result.reason);
          errors.push(`Fila ${row.employee.rowNumber} (${name}): [${parsed.code}] ${parsed.message}`);
        }
      }
      setImportProgress({ current: Math.min(i + BATCH_SIZE, validRows.length), total: validRows.length, errors: [...errors] });
    }

    setImportResults({ created, failed, errors });
    setStep('done');
    if (created > 0) onComplete();
  };

  const toggleRow = (rowNum: number) => {
    setExpandedRows((prev) => {
      const next = new Set(prev);
      if (next.has(rowNum)) next.delete(rowNum);
      else next.add(rowNum);
      return next;
    });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Carga Masiva de Empleados"
      size="xl"
      footer={
        step === 'upload' ? (
          <>
            <button onClick={handleClose} className="btn-secondary">Cancelar</button>
            <button onClick={() => downloadPlantillaCargaMasiva()} className="btn-secondary">
              <Download className="h-4 w-4" />
              Descargar Plantilla
            </button>
          </>
        ) : step === 'preview' ? (
          <>
            <button onClick={reset} className="btn-secondary">Volver</button>
            <button
              onClick={handleImport}
              disabled={!parseResult || parseResult.validRows === 0}
              className="btn-primary"
            >
              <Upload className="h-4 w-4" />
              Importar {parseResult?.validRows ?? 0} empleado{(parseResult?.validRows ?? 0) !== 1 ? 's' : ''}
            </button>
          </>
        ) : step === 'done' ? (
          <button onClick={handleClose} className="btn-primary">Cerrar</button>
        ) : null
      }
    >
      {/* Step 1: Upload */}
      {step === 'upload' && (
        <div className="space-y-4">
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-10 transition-colors hover:border-primary-400 hover:bg-primary-50"
          >
            {isParsing ? (
              <>
                <Loader2 className="h-12 w-12 animate-spin text-primary-500" />
                <p className="mt-3 text-sm font-medium text-gray-700">Leyendo archivo...</p>
              </>
            ) : (
              <>
                <FileSpreadsheet className="h-12 w-12 text-gray-400" />
                <p className="mt-3 text-sm font-medium text-gray-700">
                  Arrastra tu archivo Excel aquí o haz clic para seleccionar
                </p>
                <p className="mt-1 text-xs text-gray-500">
                  Solo archivos .xlsx generados con la plantilla de EnterHR
                </p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFileSelect(file);
              }}
            />
          </div>

          {parseError && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3">
              <XCircle className="mt-0.5 h-5 w-5 flex-shrink-0 text-red-500" />
              <p className="text-sm text-red-700">{parseError}</p>
            </div>
          )}

          <div className="rounded-lg bg-blue-50 p-4">
            <h4 className="text-sm font-semibold text-blue-800">Instrucciones:</h4>
            <ol className="mt-2 list-inside list-decimal space-y-1 text-sm text-blue-700">
              <li>Descarga la plantilla con el botón de abajo</li>
              <li>Llena los datos de los empleados en la hoja "Empleados"</li>
              <li>Los campos con asterisco (*) son obligatorios</li>
              <li>Sube el archivo aquí para validar y previsualizar</li>
              <li>Confirma la importación</li>
            </ol>
          </div>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 'preview' && parseResult && (
        <div className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg bg-gray-50 p-3 text-center">
              <Users className="mx-auto h-6 w-6 text-gray-500" />
              <p className="mt-1 text-2xl font-bold text-gray-900">{parseResult.totalRows}</p>
              <p className="text-xs text-gray-500">Total registros</p>
            </div>
            <div className="rounded-lg bg-green-50 p-3 text-center">
              <CheckCircle2 className="mx-auto h-6 w-6 text-green-500" />
              <p className="mt-1 text-2xl font-bold text-green-700">{parseResult.validRows}</p>
              <p className="text-xs text-green-600">Válidos</p>
            </div>
            <div className="rounded-lg bg-red-50 p-3 text-center">
              <XCircle className="mx-auto h-6 w-6 text-red-500" />
              <p className="mt-1 text-2xl font-bold text-red-700">{parseResult.invalidRows}</p>
              <p className="text-xs text-red-600">Con errores</p>
            </div>
          </div>

          {parseResult.invalidRows > 0 && (
            <div className="flex items-start gap-2 rounded-lg bg-yellow-50 p-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                Los registros con errores no serán importados. Corrígelos en el Excel y vuelve a subir, o importa solo los válidos.
              </p>
            </div>
          )}

          {/* File info */}
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <FileSpreadsheet className="h-4 w-4" />
            <span>{parseResult.fileName}</span>
          </div>

          {/* Employee list */}
          <div className="max-h-[40vh] overflow-y-auto rounded-lg border border-gray-200">
            <table className="w-full text-sm">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Estado</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Fila</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Nombre Completo</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Puesto</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Departamento</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-gray-600">Errores</th>
                  <th className="w-8 px-2"></th>
                </tr>
              </thead>
              <tbody>
                {parseResult.rows.map((row) => {
                  const emp = row.employee;
                  const fullName = [emp.first_name, emp.middle_name, emp.last_name, emp.last_name_2].filter(Boolean).join(' ');
                  const isExpanded = expandedRows.has(emp.rowNumber);

                  return (
                    <tr key={emp.rowNumber} className="border-b border-gray-100 last:border-0">
                      <td className="px-3 py-2">
                        {row.isValid ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                        ) : (
                          <XCircle className="h-5 w-5 text-red-500" />
                        )}
                      </td>
                      <td className="px-3 py-2 text-gray-400">{emp.rowNumber}</td>
                      <td className="px-3 py-2 font-medium text-gray-900">{fullName || '(vacío)'}</td>
                      <td className="px-3 py-2 text-gray-600">{emp.designation || '—'}</td>
                      <td className="px-3 py-2 text-gray-600">{emp.department || '—'}</td>
                      <td className="px-3 py-2">
                        {row.errors.length > 0 && (
                          <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-700">
                            {row.errors.length} error{row.errors.length > 1 ? 'es' : ''}
                          </span>
                        )}
                        {row.warnings.length > 0 && row.errors.length === 0 && (
                          <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
                            {row.warnings.length} aviso{row.warnings.length > 1 ? 's' : ''}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-2">
                        {(row.errors.length > 0 || row.warnings.length > 0) && (
                          <button onClick={() => toggleRow(emp.rowNumber)} className="rounded p-0.5 text-gray-400 hover:bg-gray-100">
                            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                          </button>
                        )}
                      </td>
                      {isExpanded && (
                        <td colSpan={7} className="bg-gray-50 px-4 py-2">
                          <RowDetails row={row} />
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 3: Importing */}
      {step === 'importing' && (
        <div className="space-y-6 py-4">
          <div className="text-center">
            <Loader2 className="mx-auto h-12 w-12 animate-spin text-primary-500" />
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Importando empleados...</h3>
            <p className="mt-1 text-sm text-gray-500">
              {importProgress.current} de {importProgress.total} procesados
            </p>
          </div>

          {/* Progress bar */}
          <div className="mx-auto max-w-md">
            <div className="h-3 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-primary-600 transition-all duration-300"
                style={{ width: `${importProgress.total > 0 ? (importProgress.current / importProgress.total) * 100 : 0}%` }}
              />
            </div>
            <p className="mt-1 text-center text-xs text-gray-500">
              {importProgress.total > 0 ? Math.round((importProgress.current / importProgress.total) * 100) : 0}%
            </p>
          </div>

          {importProgress.errors.length > 0 && (
            <div className="mx-auto max-w-md rounded-lg bg-red-50 p-3">
              <p className="text-xs font-medium text-red-700">{importProgress.errors.length} error(es) hasta ahora</p>
            </div>
          )}
        </div>
      )}

      {/* Step 4: Done */}
      {step === 'done' && (
        <div className="space-y-4 py-4">
          <div className="text-center">
            {importResults.failed === 0 ? (
              <CheckCircle2 className="mx-auto h-14 w-14 text-green-500" />
            ) : (
              <AlertTriangle className="mx-auto h-14 w-14 text-yellow-500" />
            )}
            <h3 className="mt-4 text-lg font-semibold text-gray-900">Importación completada</h3>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg bg-green-50 p-4 text-center">
              <p className="text-3xl font-bold text-green-700">{importResults.created}</p>
              <p className="text-sm text-green-600">Empleados creados</p>
            </div>
            <div className="rounded-lg bg-red-50 p-4 text-center">
              <p className="text-3xl font-bold text-red-700">{importResults.failed}</p>
              <p className="text-sm text-red-600">Fallidos</p>
            </div>
          </div>

          {importResults.errors.length > 0 && (
            <div className="rounded-lg bg-red-50 p-3">
              <p className="mb-2 text-sm font-semibold text-red-800">Errores durante importación:</p>
              <ul className="max-h-32 space-y-1 overflow-y-auto text-xs text-red-700">
                {importResults.errors.map((err, i) => (
                  <li key={i} className="flex items-start gap-1">
                    <X className="mt-0.5 h-3 w-3 flex-shrink-0" />
                    {err}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// Sub-componente para detalle de errores/warnings por fila
function RowDetails({ row }: { row: ParsedRow }) {
  return (
    <div className="space-y-1">
      {row.errors.map((err, i) => (
        <div key={`e${i}`} className="flex items-start gap-1.5 text-xs text-red-700">
          <XCircle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          {err}
        </div>
      ))}
      {row.warnings.map((warn, i) => (
        <div key={`w${i}`} className="flex items-start gap-1.5 text-xs text-yellow-700">
          <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-shrink-0" />
          {warn}
        </div>
      ))}
    </div>
  );
}
