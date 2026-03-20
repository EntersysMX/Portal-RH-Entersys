import { useEffect, useRef } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useModuleStore } from '@/store/moduleStore';
import { usePermissions } from '@/hooks/usePermissions';
import AppLayout from '@/components/layout/AppLayout';
import ToastContainer from '@/components/ui/Toast';
import Login from '@/pages/Login';
import Dashboard from '@/pages/Dashboard';
import Employees from '@/pages/Employees';
import Recruitment from '@/pages/Recruitment';
import Performance from '@/pages/Performance';
import Attendance from '@/pages/Attendance';
import Payroll from '@/pages/Payroll';
import Expenses from '@/pages/Expenses';
import Training from '@/pages/Training';
import Organization from '@/pages/Organization';
import Settings from '@/pages/Settings';
import NominaMX from '@/pages/NominaMX';
import NominaUSA from '@/pages/NominaUSA';
import NominaCol from '@/pages/NominaCol';
import EmployeeDetail from '@/pages/EmployeeDetail';
import Notices from '@/pages/Notices';
import GoogleSync from '@/pages/GoogleSync';
// New HR modules
import Surveys from '@/pages/Surveys';
import WorkClimate from '@/pages/WorkClimate';
import Disabilities from '@/pages/Disabilities';
import Discipline from '@/pages/Discipline';
import Turnover from '@/pages/Turnover';
import PeopleAnalytics from '@/pages/PeopleAnalytics';
import EquipmentPage from '@/pages/Equipment';
import OnboardingPage from '@/pages/Onboarding';
import Documents from '@/pages/Documents';
// New HR modules (batch 2)
import Loans from '@/pages/Loans';
import SavingsFund from '@/pages/SavingsFund';
import Travel from '@/pages/Travel';
import Benefits from '@/pages/Benefits';
import Movements from '@/pages/Movements';
import Separations from '@/pages/Separations';
import Shifts from '@/pages/Shifts';
import Checkins from '@/pages/Checkins';
import Grievances from '@/pages/Grievances';
import Skills from '@/pages/Skills';
import LeaveManagement from '@/pages/LeaveManagement';
// Admin panel
import AdminModules from '@/pages/admin/AdminModules';
import AdminRoles from '@/pages/admin/AdminRoles';
import AdminUsers from '@/pages/admin/AdminUsers';
import AdminCatalogs from '@/pages/admin/AdminCatalogs';
import AdminPlatform from '@/pages/admin/AdminPlatform';
// Portal de empleado
import EmployeeDashboard from '@/pages/employee/EmployeeDashboard';
import MyProfile from '@/pages/employee/MyProfile';
import MyPayslips from '@/pages/employee/MyPayslips';
import MyAttendance from '@/pages/employee/MyAttendance';
import MyTraining from '@/pages/employee/MyTraining';
import MyOrganization from '@/pages/employee/MyOrganization';
import MyNotices from '@/pages/employee/MyNotices';
// Guards
import ProtectedRoute from '@/components/auth/ProtectedRoute';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

/**
 * Redirige la raíz `/` según el rol del usuario.
 */
function RootRedirect() {
  const { isAuthenticated } = useAuthStore();
  const { isEmployeeOnly } = usePermissions();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (isEmployeeOnly) return <Navigate to="/portal" replace />;
  return <Navigate to="/dashboard" replace />;
}

/**
 * Guard de autenticación + inicialización de la app.
 *
 * Responsabilidades:
 *   1. Redirigir a /login si no hay sesión
 *   2. Verificar la sesión con el backend (checkAuth)
 *   3. Cargar la config de módulos/roles desde BD (init)
 *   4. Timeout de seguridad: si init no termina en 10s, forzar isInitialized
 *      para que el usuario nunca se quede en spinner infinito
 *
 * La config que init() carga es la MISMA para todos los usuarios —
 * es la que el admin configuró. Los empleados la leen, solo el admin la escribe.
 */
const INIT_TIMEOUT_MS = 10_000;

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, checkAuth } = useAuthStore();
  const { isInitialized, isLoading, init } = useModuleStore();
  const didInit = useRef(false);

  useEffect(() => {
    if (!isAuthenticated || didInit.current) return;
    didInit.current = true;

    // Verificar sesión con backend (también llama init internamente)
    checkAuth();
    // Cargar config de módulos (tiene guard interno contra doble llamada)
    init();

    // Timeout de seguridad: si init no resuelve en N segundos, desbloquear
    const timer = setTimeout(() => {
      const state = useModuleStore.getState();
      if (!state.isInitialized) {
        useModuleStore.setState({ isInitialized: true, isLoading: false });
      }
    }, INIT_TIMEOUT_MS);

    return () => clearTimeout(timer);
  }, [isAuthenticated, checkAuth, init]);

  if (!isAuthenticated) return <Navigate to="/login" replace />;

  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastContainer />
      <BrowserRouter>
        <Routes>
          {/* Login */}
          <Route path="/login" element={<Login />} />

          {/* Root redirect */}
          <Route path="/" element={<RootRedirect />} />

          {/* App layout (authenticated) */}
          <Route
            element={
              <AuthGuard>
                <AppLayout />
              </AuthGuard>
            }
          >
            {/* ========== Admin/HR Routes ========== */}
            <Route
              path="dashboard"
              element={
                <ProtectedRoute requiredSection="dashboard">
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees"
              element={
                <ProtectedRoute requiredSection="employees">
                  <Employees />
                </ProtectedRoute>
              }
            />
            <Route
              path="employees/:id"
              element={
                <ProtectedRoute requiredSection="employee-detail">
                  <EmployeeDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="notices"
              element={
                <ProtectedRoute requiredSection="notices">
                  <Notices />
                </ProtectedRoute>
              }
            />
            <Route
              path="recruitment"
              element={
                <ProtectedRoute requiredSection="recruitment">
                  <Recruitment />
                </ProtectedRoute>
              }
            />
            <Route
              path="performance"
              element={
                <ProtectedRoute requiredSection="performance">
                  <Performance />
                </ProtectedRoute>
              }
            />
            <Route
              path="attendance"
              element={
                <ProtectedRoute requiredSection="attendance">
                  <Attendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="payroll"
              element={
                <ProtectedRoute requiredSection="payroll">
                  <Payroll />
                </ProtectedRoute>
              }
            />
            <Route
              path="nomina-mx"
              element={
                <ProtectedRoute requiredSection="nomina-mx">
                  <NominaMX />
                </ProtectedRoute>
              }
            />
            <Route
              path="nomina-usa"
              element={
                <ProtectedRoute requiredSection="nomina-usa">
                  <NominaUSA />
                </ProtectedRoute>
              }
            />
            <Route
              path="nomina-col"
              element={
                <ProtectedRoute requiredSection="nomina-col">
                  <NominaCol />
                </ProtectedRoute>
              }
            />
            <Route
              path="expenses"
              element={
                <ProtectedRoute requiredSection="expenses">
                  <Expenses />
                </ProtectedRoute>
              }
            />
            <Route
              path="training"
              element={
                <ProtectedRoute requiredSection="training">
                  <Training />
                </ProtectedRoute>
              }
            />
            <Route
              path="organization"
              element={
                <ProtectedRoute requiredSection="organization">
                  <Organization />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute requiredSection="settings">
                  <Settings />
                </ProtectedRoute>
              }
            />
            <Route
              path="google-sync"
              element={
                <ProtectedRoute requiredSection="google-sync">
                  <GoogleSync />
                </ProtectedRoute>
              }
            />

            {/* ========== HR Extended Modules ========== */}
            <Route
              path="surveys"
              element={
                <ProtectedRoute requiredSection="surveys">
                  <Surveys />
                </ProtectedRoute>
              }
            />
            <Route
              path="work-climate"
              element={
                <ProtectedRoute requiredSection="work-climate">
                  <WorkClimate />
                </ProtectedRoute>
              }
            />
            <Route
              path="disabilities"
              element={
                <ProtectedRoute requiredSection="disabilities">
                  <Disabilities />
                </ProtectedRoute>
              }
            />
            <Route
              path="discipline"
              element={
                <ProtectedRoute requiredSection="discipline">
                  <Discipline />
                </ProtectedRoute>
              }
            />
            <Route
              path="turnover"
              element={
                <ProtectedRoute requiredSection="turnover">
                  <Turnover />
                </ProtectedRoute>
              }
            />
            <Route
              path="people-analytics"
              element={
                <ProtectedRoute requiredSection="people-analytics">
                  <PeopleAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="equipment"
              element={
                <ProtectedRoute requiredSection="equipment">
                  <EquipmentPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="onboarding"
              element={
                <ProtectedRoute requiredSection="onboarding">
                  <OnboardingPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="documents"
              element={
                <ProtectedRoute requiredSection="documents">
                  <Documents />
                </ProtectedRoute>
              }
            />

            {/* ========== Payroll Extended & HR Operations ========== */}
            <Route
              path="loans"
              element={
                <ProtectedRoute requiredSection="loans">
                  <Loans />
                </ProtectedRoute>
              }
            />
            <Route
              path="savings-fund"
              element={
                <ProtectedRoute requiredSection="savings-fund">
                  <SavingsFund />
                </ProtectedRoute>
              }
            />
            <Route
              path="travel"
              element={
                <ProtectedRoute requiredSection="travel">
                  <Travel />
                </ProtectedRoute>
              }
            />
            <Route
              path="benefits"
              element={
                <ProtectedRoute requiredSection="benefits">
                  <Benefits />
                </ProtectedRoute>
              }
            />
            <Route
              path="movements"
              element={
                <ProtectedRoute requiredSection="movements">
                  <Movements />
                </ProtectedRoute>
              }
            />
            <Route
              path="separations"
              element={
                <ProtectedRoute requiredSection="separations">
                  <Separations />
                </ProtectedRoute>
              }
            />
            <Route
              path="shifts"
              element={
                <ProtectedRoute requiredSection="shifts">
                  <Shifts />
                </ProtectedRoute>
              }
            />
            <Route
              path="checkins"
              element={
                <ProtectedRoute requiredSection="checkins">
                  <Checkins />
                </ProtectedRoute>
              }
            />
            <Route
              path="grievances"
              element={
                <ProtectedRoute requiredSection="grievances">
                  <Grievances />
                </ProtectedRoute>
              }
            />
            <Route
              path="skills"
              element={
                <ProtectedRoute requiredSection="skills">
                  <Skills />
                </ProtectedRoute>
              }
            />
            <Route
              path="leave-management"
              element={
                <ProtectedRoute requiredSection="leave-management">
                  <LeaveManagement />
                </ProtectedRoute>
              }
            />

            {/* ========== Admin Panel ========== */}
            <Route
              path="admin/modules"
              element={
                <ProtectedRoute requiredSection="admin-modules">
                  <AdminModules />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/roles"
              element={
                <ProtectedRoute requiredSection="admin-roles">
                  <AdminRoles />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/users"
              element={
                <ProtectedRoute requiredSection="admin-users">
                  <AdminUsers />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/catalogs"
              element={
                <ProtectedRoute requiredSection="admin-catalogs">
                  <AdminCatalogs />
                </ProtectedRoute>
              }
            />
            <Route
              path="admin/platform"
              element={
                <ProtectedRoute requiredSection="admin-platform">
                  <AdminPlatform />
                </ProtectedRoute>
              }
            />

            {/* ========== Portal de Empleado ========== */}
            <Route
              path="portal"
              element={
                <ProtectedRoute requiredSection="portal">
                  <EmployeeDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/profile"
              element={
                <ProtectedRoute requiredSection="my-profile">
                  <MyProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/payslips"
              element={
                <ProtectedRoute requiredSection="my-payslips">
                  <MyPayslips />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/attendance"
              element={
                <ProtectedRoute requiredSection="my-attendance">
                  <MyAttendance />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/training"
              element={
                <ProtectedRoute requiredSection="my-training">
                  <MyTraining />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/organization"
              element={
                <ProtectedRoute requiredSection="my-organization">
                  <MyOrganization />
                </ProtectedRoute>
              }
            />
            <Route
              path="portal/notices"
              element={
                <ProtectedRoute requiredSection="my-notices">
                  <MyNotices />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Catch-all: redirect to root */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
