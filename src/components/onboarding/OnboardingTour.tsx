import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  X,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Rocket,
  PartyPopper,
} from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useAuthStore } from '@/store/authStore';

// ─── Types ───────────────────────────────────────────────
interface TourStep {
  /** CSS selector for the target element to highlight */
  target: string;
  /** Title shown in the tooltip */
  title: string;
  /** Description shown in the tooltip */
  description: string;
  /** Route to navigate to before showing this step */
  route?: string;
  /** Tooltip position relative to the target */
  position: 'top' | 'bottom' | 'left' | 'right';
  /** Optional icon key */
  icon?: 'sparkles' | 'rocket';
}

// ─── Tour Steps ──────────────────────────────────────────
const adminSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar-logo"]',
    title: 'Bienvenido a EnterHR',
    description:
      'Esta es tu plataforma integral de Recursos Humanos. Aqui gestionas todo: empleados, nomina, reclutamiento y mas. Te guiaremos por las funciones principales.',
    position: 'right',
    icon: 'sparkles',
  },
  {
    target: '[data-tour="sidebar-admin-nav"]',
    title: 'Menu de Administracion',
    description:
      'Desde aqui accedes a todos los modulos de RH: empleados, reclutamiento, asistencia, nomina, performance y mas. Cada seccion tiene su propio conjunto de herramientas.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-dashboard"]',
    title: 'Dashboard General',
    description:
      'Vista panoramica de tu organizacion: total de empleados, vacantes abiertas, asistencia del dia, solicitudes pendientes y distribucion por departamento.',
    route: '/dashboard',
    position: 'right',
    icon: 'rocket',
  },
  {
    target: '[data-tour="topbar-search"]',
    title: 'Busqueda Rapida',
    description:
      'Busca empleados, vacantes o documentos al instante desde cualquier seccion de la plataforma.',
    position: 'bottom',
  },
  {
    target: '[data-tour="topbar-notifications"]',
    title: 'Notificaciones y Avisos',
    description:
      'Aqui veras avisos importantes, solicitudes pendientes y alertas del sistema. El punto rojo indica que hay novedades.',
    position: 'bottom',
  },
  {
    target: '[data-tour="topbar-user"]',
    title: 'Tu Perfil y Sesion',
    description:
      'Accede a tu perfil personal, cambia al Portal de Empleado o cierra sesion. Tu rol actual se muestra junto a tu nombre.',
    position: 'bottom',
  },
  {
    target: '[data-tour="nav-employees"]',
    title: 'Gestion de Empleados',
    description:
      'Directorio completo del equipo. Puedes agregar empleados uno a uno o con carga masiva desde Excel. Cada perfil tiene 11 secciones de informacion.',
    route: '/employees',
    position: 'right',
  },
  {
    target: '[data-tour="nav-payroll"]',
    title: 'Nomina',
    description:
      'Consulta recibos de nomina, resumen de pagos brutos/netos y deducciones. Puedes exportar reportes en PDF y Excel.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-nomina-mx"]',
    title: 'Nomina Mexicana',
    description:
      'Calculadora especializada con tablas SAT vigentes: ISR, IMSS, SDI, prestaciones de ley, proyecciones anuales y generacion de CFDI.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-recruitment"]',
    title: 'Reclutamiento',
    description:
      'Publica vacantes, recibe y evalua candidatos. Lleva el seguimiento del proceso de seleccion desde la publicacion hasta la contratacion.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-attendance"]',
    title: 'Asistencia',
    description:
      'Registro diario de asistencia: presentes, ausentes, trabajo remoto y entradas tardias. Filtra por fecha y departamento.',
    position: 'right',
  },
  {
    target: '[data-tour="sidebar-portal-nav"]',
    title: 'Portal del Empleado',
    description:
      'Como administrador tambien tienes acceso al portal de empleado. Es la vista que tendran tus colaboradores para consultar su informacion personal.',
    position: 'right',
  },
];

const employeeSteps: TourStep[] = [
  {
    target: '[data-tour="sidebar-logo"]',
    title: 'Bienvenido a EnterHR',
    description:
      'Este es tu portal personal de Recursos Humanos. Aqui puedes consultar tu nomina, asistencia, capacitaciones y mas. Te mostramos como funciona.',
    position: 'right',
    icon: 'sparkles',
  },
  {
    target: '[data-tour="nav-portal"]',
    title: 'Mi Portal',
    description:
      'Tu pagina de inicio con un resumen rapido: ultimo recibo de nomina, tu asistencia del mes, permisos pendientes y avisos recientes.',
    route: '/portal',
    position: 'right',
    icon: 'rocket',
  },
  {
    target: '[data-tour="nav-my-profile"]',
    title: 'Mi Perfil',
    description:
      'Revisa y actualiza tu informacion personal: telefono, email, contacto de emergencia, datos bancarios y direccion.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-my-payslips"]',
    title: 'Mi Nomina',
    description:
      'Consulta todos tus recibos de nomina. Puedes ver el desglose de percepciones y deducciones, y descargar cada recibo en PDF.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-my-attendance"]',
    title: 'Mi Asistencia',
    description:
      'Revisa tu registro de asistencia mes a mes: dias presentes, ausencias, trabajo remoto y entradas tardias.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-my-training"]',
    title: 'Mis Capacitaciones',
    description:
      'Ve tus proximos eventos de capacitacion y los que ya completaste. Incluye nombre del instructor, fecha y horario.',
    position: 'right',
  },
  {
    target: '[data-tour="nav-my-organization"]',
    title: 'Organigrama',
    description:
      'Visualiza la estructura de la empresa: tu posicion en el equipo, los departamentos y sus relaciones jerarquicas.',
    position: 'right',
  },
  {
    target: '[data-tour="topbar-notifications"]',
    title: 'Avisos de la Empresa',
    description:
      'Aqui llegan los avisos importantes de RH: comunicados, cambios de politicas, eventos y recordatorios.',
    position: 'bottom',
  },
  {
    target: '[data-tour="topbar-user"]',
    title: 'Tu Cuenta',
    description:
      'Desde aqui accedes rapidamente a tu perfil o cierras sesion cuando termines.',
    position: 'bottom',
  },
];

// ─── Storage key ─────────────────────────────────────────
const TOUR_COMPLETED_KEY = 'enterhr_tour_completed';
const TOUR_DISMISSED_KEY = 'enterhr_tour_dismissed';

// ─── Welcome Modal ───────────────────────────────────────
function WelcomeModal({
  userName,
  isEmployee,
  onStart,
  onSkip,
}: {
  userName: string;
  isEmployee: boolean;
  onStart: () => void;
  onSkip: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg animate-tour-enter rounded-2xl bg-white p-8 shadow-2xl">
        {/* Decorative top */}
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-primary-700 shadow-lg shadow-primary-200">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900">
          Hola, {userName}
        </h2>
        <p className="mt-2 text-center text-gray-500">
          Bienvenido a <span className="font-semibold text-primary-600">EnterHR</span>
        </p>

        <div className="mt-6 rounded-xl bg-primary-50 p-4">
          <p className="text-sm leading-relaxed text-primary-800">
            {isEmployee
              ? 'Este es tu portal personal de Recursos Humanos. Aqui podras consultar tu nomina, asistencia, capacitaciones y mantener tu informacion actualizada.'
              : 'Esta es tu plataforma integral de gestion de Capital Humano. Administra empleados, nomina, reclutamiento, asistencia y mucho mas desde un solo lugar.'}
          </p>
        </div>

        <p className="mt-4 text-center text-sm text-gray-400">
          Te daremos un recorrido rapido de {isEmployee ? '2' : '3'} minutos
        </p>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onSkip}
            className="btn-ghost flex-1 text-gray-500"
          >
            Omitir
          </button>
          <button
            onClick={onStart}
            className="btn-primary flex-1 gap-2"
          >
            <Rocket className="h-4 w-4" />
            Comenzar Tour
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Completion Modal ────────────────────────────────────
function CompletionModal({
  isEmployee,
  onClose,
}: {
  isEmployee: boolean;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="mx-4 w-full max-w-lg animate-tour-enter rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-700 shadow-lg shadow-accent-200">
            <PartyPopper className="h-10 w-10 text-white" />
          </div>
        </div>

        <h2 className="text-center text-2xl font-bold text-gray-900">
          Listo, ya conoces EnterHR
        </h2>

        <div className="mt-6 space-y-3">
          {isEmployee ? (
            <>
              <TipItem text="Revisa tu perfil y asegurate de que tu informacion este actualizada" />
              <TipItem text="Consulta tu ultimo recibo de nomina en Mi Nomina" />
              <TipItem text="Revisa los avisos recientes de tu empresa" />
            </>
          ) : (
            <>
              <TipItem text="Comienza registrando a tus empleados o importalos desde Excel" />
              <TipItem text="Configura los departamentos en la seccion Organizacion" />
              <TipItem text="Publica tu primera vacante en Reclutamiento" />
              <TipItem text="Explora la Calculadora de Nomina MX con tablas SAT actualizadas" />
            </>
          )}
        </div>

        <button
          onClick={onClose}
          className="btn-primary mt-8 w-full gap-2"
        >
          <Sparkles className="h-4 w-4" />
          Empezar a usar EnterHR
        </button>
      </div>
    </div>
  );
}

function TipItem({ text }: { text: string }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-gray-50 px-4 py-3">
      <div className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-accent-100 text-accent-600">
        <ChevronRight className="h-3 w-3" />
      </div>
      <p className="text-sm text-gray-700">{text}</p>
    </div>
  );
}

// ─── Tooltip Component ───────────────────────────────────
function TourTooltip({
  step,
  stepIndex,
  totalSteps,
  targetRect,
  onNext,
  onPrev,
  onClose,
}: {
  step: TourStep;
  stepIndex: number;
  totalSteps: number;
  targetRect: DOMRect;
  onNext: () => void;
  onPrev: () => void;
  onClose: () => void;
}) {
  const tooltipRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!tooltipRef.current) return;
    const tt = tooltipRef.current.getBoundingClientRect();
    const GAP = 16;
    let top = 0;
    let left = 0;

    switch (step.position) {
      case 'right':
        top = targetRect.top + targetRect.height / 2 - tt.height / 2;
        left = targetRect.right + GAP;
        break;
      case 'left':
        top = targetRect.top + targetRect.height / 2 - tt.height / 2;
        left = targetRect.left - tt.width - GAP;
        break;
      case 'bottom':
        top = targetRect.bottom + GAP;
        left = targetRect.left + targetRect.width / 2 - tt.width / 2;
        break;
      case 'top':
        top = targetRect.top - tt.height - GAP;
        left = targetRect.left + targetRect.width / 2 - tt.width / 2;
        break;
    }

    // Clamp to viewport
    top = Math.max(8, Math.min(top, window.innerHeight - tt.height - 8));
    left = Math.max(8, Math.min(left, window.innerWidth - tt.width - 8));

    setPos({ top, left });
  }, [targetRect, step.position]);

  const isFirst = stepIndex === 0;
  const isLast = stepIndex === totalSteps - 1;
  const progress = ((stepIndex + 1) / totalSteps) * 100;

  const IconComponent =
    step.icon === 'sparkles' ? Sparkles : step.icon === 'rocket' ? Rocket : null;

  return (
    <div
      ref={tooltipRef}
      className="animate-tour-enter fixed z-[9998] w-80 rounded-xl border border-gray-200 bg-white shadow-2xl"
      style={{ top: pos.top, left: pos.left }}
    >
      {/* Progress bar */}
      <div className="h-1 overflow-hidden rounded-t-xl bg-gray-100">
        <div
          className="h-full bg-gradient-to-r from-primary-500 to-primary-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="p-5">
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute right-3 top-4 rounded-lg p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-start gap-3 pr-6">
          {IconComponent && (
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-primary-100 text-primary-600">
              <IconComponent className="h-4 w-4" />
            </div>
          )}
          <div>
            <h3 className="text-sm font-bold text-gray-900">{step.title}</h3>
            <p className="mt-1.5 text-[13px] leading-relaxed text-gray-500">
              {step.description}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="mt-4 flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {stepIndex + 1} de {totalSteps}
          </span>
          <div className="flex gap-2">
            {!isFirst && (
              <button
                onClick={onPrev}
                className="flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-gray-500 transition-colors hover:bg-gray-100"
              >
                <ChevronLeft className="h-3 w-3" />
                Anterior
              </button>
            )}
            <button
              onClick={onNext}
              className="flex items-center gap-1 rounded-lg bg-primary-600 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-primary-700"
            >
              {isLast ? 'Finalizar' : 'Siguiente'}
              {!isLast && <ChevronRight className="h-3 w-3" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────
export default function OnboardingTour() {
  const { isEmployeeOnly } = usePermissions();
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  const [phase, setPhase] = useState<'idle' | 'welcome' | 'touring' | 'complete'>('idle');
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  const steps = isEmployeeOnly ? employeeSteps : adminSteps;

  // Check if tour should show
  useEffect(() => {
    if (!isAuthenticated || !user) return;

    const userKey = user.email || user.name;
    const completed = localStorage.getItem(`${TOUR_COMPLETED_KEY}_${userKey}`);
    const dismissed = localStorage.getItem(`${TOUR_DISMISSED_KEY}_${userKey}`);

    if (!completed && !dismissed) {
      // Small delay so the UI renders first
      const timer = setTimeout(() => setPhase('welcome'), 800);
      return () => clearTimeout(timer);
    }
  }, [isAuthenticated, user]);

  // Find and highlight target element
  const highlightTarget = useCallback(
    (stepIndex: number) => {
      const step = steps[stepIndex];
      if (!step) return;

      const findElement = () => {
        const el = document.querySelector(step.target);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
          const rect = el.getBoundingClientRect();
          setTargetRect(rect);
        } else {
          setTargetRect(null);
        }
      };

      // Navigate if needed, then find element after render
      if (step.route && location.pathname !== step.route) {
        navigate(step.route);
        setTimeout(findElement, 400);
      } else {
        setTimeout(findElement, 100);
      }
    },
    [steps, navigate, location.pathname]
  );

  // Re-highlight on step change
  useEffect(() => {
    if (phase === 'touring') {
      highlightTarget(currentStep);
    }
  }, [phase, currentStep, highlightTarget]);

  // Recalc on resize/scroll
  useEffect(() => {
    if (phase !== 'touring') return;

    const recalc = () => highlightTarget(currentStep);
    window.addEventListener('resize', recalc);
    window.addEventListener('scroll', recalc, true);
    return () => {
      window.removeEventListener('resize', recalc);
      window.removeEventListener('scroll', recalc, true);
    };
  }, [phase, currentStep, highlightTarget]);

  // Keyboard nav
  useEffect(() => {
    if (phase !== 'touring') return;

    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose();
      if (e.key === 'ArrowRight') handleNext();
      if (e.key === 'ArrowLeft' && currentStep > 0) handlePrev();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [phase, currentStep]);

  const handleStart = () => {
    setCurrentStep(0);
    setPhase('touring');
  };

  const handleSkip = () => {
    const userKey = user?.email || user?.name || '';
    localStorage.setItem(`${TOUR_DISMISSED_KEY}_${userKey}`, 'true');
    setPhase('idle');
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      setPhase('complete');
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const handleClose = () => {
    const userKey = user?.email || user?.name || '';
    localStorage.setItem(`${TOUR_DISMISSED_KEY}_${userKey}`, 'true');
    setPhase('idle');
    setTargetRect(null);
  };

  const handleComplete = () => {
    const userKey = user?.email || user?.name || '';
    localStorage.setItem(`${TOUR_COMPLETED_KEY}_${userKey}`, 'true');
    setPhase('idle');
    setTargetRect(null);
    navigate(isEmployeeOnly ? '/portal' : '/dashboard');
  };

  if (phase === 'idle') return null;

  return createPortal(
    <>
      {/* Welcome */}
      {phase === 'welcome' && (
        <WelcomeModal
          userName={user?.full_name?.split(' ')[0] || 'Usuario'}
          isEmployee={isEmployeeOnly}
          onStart={handleStart}
          onSkip={handleSkip}
        />
      )}

      {/* Touring */}
      {phase === 'touring' && (
        <>
          {/* Overlay with spotlight cutout */}
          <div className="fixed inset-0 z-[9996]">
            <svg className="h-full w-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <mask id="tour-spotlight">
                  <rect x="0" y="0" width="100%" height="100%" fill="white" />
                  {targetRect && (
                    <rect
                      x={targetRect.left - 6}
                      y={targetRect.top - 6}
                      width={targetRect.width + 12}
                      height={targetRect.height + 12}
                      rx="12"
                      fill="black"
                    />
                  )}
                </mask>
              </defs>
              <rect
                x="0"
                y="0"
                width="100%"
                height="100%"
                fill="rgba(0,0,0,0.5)"
                mask="url(#tour-spotlight)"
              />
            </svg>
          </div>

          {/* Spotlight ring */}
          {targetRect && (
            <div
              className="pointer-events-none fixed z-[9997] rounded-xl ring-2 ring-primary-400 ring-offset-4 transition-all duration-300"
              style={{
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
              }}
            />
          )}

          {/* Tooltip */}
          {targetRect && (
            <TourTooltip
              step={steps[currentStep]}
              stepIndex={currentStep}
              totalSteps={steps.length}
              targetRect={targetRect}
              onNext={handleNext}
              onPrev={handlePrev}
              onClose={handleClose}
            />
          )}
        </>
      )}

      {/* Completion */}
      {phase === 'complete' && (
        <CompletionModal isEmployee={isEmployeeOnly} onClose={handleComplete} />
      )}
    </>,
    document.body
  );
}

// ─── Restart Tour Button (for settings or help) ─────────
export function RestartTourButton() {
  const { user } = useAuthStore();

  const handleRestart = () => {
    const userKey = user?.email || user?.name || '';
    localStorage.removeItem(`${TOUR_COMPLETED_KEY}_${userKey}`);
    localStorage.removeItem(`${TOUR_DISMISSED_KEY}_${userKey}`);
    window.location.reload();
  };

  return (
    <button onClick={handleRestart} className="btn-secondary gap-2">
      <Rocket className="h-4 w-4" />
      Repetir Tour de Bienvenida
    </button>
  );
}
