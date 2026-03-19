import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  compact?: boolean;
}

/**
 * Estado de error reutilizable.
 * Muestra un mensaje claro y botón de reintentar para que el usuario
 * pueda continuar sin quedarse atrapado en una pantalla vacía.
 */
export default function ErrorState({
  message = 'No se pudo cargar la información. Verifica tu conexión e intenta de nuevo.',
  onRetry,
  compact = false,
}: ErrorStateProps) {
  if (compact) {
    return (
      <div className="flex items-center justify-center gap-3 py-8 text-center">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-400" />
        <p className="text-sm text-gray-500">{message}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-secondary text-xs">
            <RefreshCw className="h-3 w-3" />
            Reintentar
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="rounded-full bg-red-50 p-3">
        <AlertCircle className="h-8 w-8 text-red-400" />
      </div>
      <h3 className="mt-4 text-lg font-semibold text-gray-700">
        Error al cargar
      </h3>
      <p className="mt-2 max-w-sm text-sm text-gray-500">{message}</p>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary mt-4">
          <RefreshCw className="h-4 w-4" />
          Reintentar
        </button>
      )}
    </div>
  );
}
