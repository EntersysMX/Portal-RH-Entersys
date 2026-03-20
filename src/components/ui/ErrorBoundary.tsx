import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error capturado:', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="rounded-full bg-red-50 p-4">
            <AlertTriangle className="h-10 w-10 text-red-400" />
          </div>
          <h2 className="mt-4 text-xl font-semibold text-gray-800">
            Algo salió mal
          </h2>
          <p className="mt-2 max-w-md text-sm text-gray-500">
            Ocurrió un error inesperado. Puedes intentar recargar esta sección o volver al inicio.
          </p>
          {this.state.error && (
            <details className="mt-3 max-w-md text-left">
              <summary className="cursor-pointer text-xs text-gray-400 hover:text-gray-600">
                Detalles técnicos
              </summary>
              <pre className="mt-1 overflow-auto rounded-lg bg-gray-50 p-3 text-xs text-red-600">
                {this.state.error.message}
              </pre>
            </details>
          )}
          <div className="mt-6 flex gap-3">
            <button onClick={this.handleReset} className="btn-secondary">
              <RefreshCw className="h-4 w-4" />
              Reintentar
            </button>
            <a href="/" className="btn-primary">
              Ir al inicio
            </a>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
