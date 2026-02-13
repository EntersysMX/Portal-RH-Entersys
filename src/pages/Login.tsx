import { useState, FormEvent, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { getHomePath } from '@/lib/permissions';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error, clearError, isAuthenticated, user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      const home = getHomePath(user.roles ?? []);
      navigate(home, { replace: true });
    }
  }, [isAuthenticated, user, navigate]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    clearError();
    await login(username, password);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      const home = getHomePath(currentUser.roles);
      navigate(home, { replace: true });
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left side - branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-gradient-to-br from-primary-600 via-primary-700 to-primary-900 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/20">
            <Users className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-bold text-white">EnterHR</span>
        </div>

        <div className="space-y-6">
          <h2 className="text-4xl font-bold leading-tight text-white">
            Plataforma integral de
            <br />
            Recursos Humanos
          </h2>
          <p className="max-w-md text-lg text-primary-200">
            Gestiona empleados, nomina, reclutamiento, performance y mas.
            Todo en un solo lugar con inteligencia artificial.
          </p>
          <div className="flex gap-8 pt-4">
            {[
              { label: 'Modulos HR', value: '10+' },
              { label: 'Automatizado', value: '100%' },
              { label: 'Con IA', value: 'Si' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-primary-300">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <p className="text-sm text-primary-400">
          EnterHR by Entersys &middot; Plataforma de Capital Humano
        </p>
      </div>

      {/* Right side - login form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary-600">
                <Users className="h-5 w-5 text-white" />
              </div>
              <span className="text-xl font-bold text-gray-900">EnterHR</span>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-gray-900">Iniciar Sesion</h1>
          <p className="mt-2 text-gray-500">
            Ingresa tus credenciales para continuar
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            {error && (
              <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
              </div>
            )}

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Usuario o Email
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="input"
                placeholder="tu.usuario"
                required
              />
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                Contrasena
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pr-10"
                  placeholder="Tu contrasena"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <button type="submit" disabled={isLoading} className="btn-primary w-full">
              {isLoading ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              ) : (
                'Iniciar Sesion'
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
