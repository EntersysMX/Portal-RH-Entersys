import { clsx } from 'clsx';

interface Props {
  src: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZES = {
  sm: { container: 'h-7 w-7', text: 'text-[5px]' },
  md: { container: 'h-9 w-9', text: 'text-[6px]' },
  lg: { container: 'h-16 w-16', text: 'text-[8px]' },
};

/**
 * Logo de empresa con marca de agua "EnterHR".
 * Muestra el logo subido por la empresa con un overlay
 * semi-transparente del nombre del portal para mantener
 * la presencia de marca.
 */
export default function BrandedLogo({ src, size = 'md', className }: Props) {
  const s = SIZES[size];

  return (
    <div className={clsx('relative overflow-hidden rounded-lg', s.container, className)}>
      <img
        src={src}
        alt="Logo"
        className="h-full w-full object-contain"
      />
      {/* Marca de agua EnterHR */}
      <div className="absolute inset-0 flex items-end justify-center pointer-events-none">
        <span
          className={clsx(
            'font-bold uppercase tracking-wider text-white select-none',
            'drop-shadow-[0_1px_1px_rgba(0,0,0,0.5)]',
            'opacity-60',
            s.text
          )}
          style={{ textShadow: '0 0 3px rgba(0,0,0,0.7), 0 0 1px rgba(0,0,0,0.9)' }}
        >
          EnterHR
        </span>
      </div>
    </div>
  );
}
