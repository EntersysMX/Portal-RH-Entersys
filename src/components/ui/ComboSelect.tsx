import { useState, useRef, useEffect } from 'react';

export interface ComboOption {
  value: string;
  label: string;
}

interface ComboSelectProps {
  options: ComboOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

export default function ComboSelect({
  options,
  value,
  onChange,
  placeholder = 'Seleccionar o escribir...',
  label,
  disabled,
}: ComboSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Sync search text with value when dropdown is closed
  useEffect(() => {
    if (!open) {
      const match = options.find((o) => o.value === value);
      setSearch(match ? match.label : value);
    }
  }, [value, options, open]);

  // Close on click outside
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const filtered = options.filter((o) =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const exactMatch = options.some(
    (o) => o.label.toLowerCase() === search.trim().toLowerCase() || o.value.toLowerCase() === search.trim().toLowerCase()
  );

  const showCreate = search.trim().length > 0 && !exactMatch;

  const handleSelect = (val: string) => {
    onChange(val);
    setOpen(false);
    inputRef.current?.blur();
  };

  const handleInputChange = (text: string) => {
    setSearch(text);
    if (!open) setOpen(true);
  };

  const handleBlur = () => {
    // Small delay to allow click events on options to fire first
    setTimeout(() => {
      if (!containerRef.current?.contains(document.activeElement)) {
        setOpen(false);
        // Commit the typed text as the value
        if (search.trim()) {
          const match = options.find(
            (o) => o.label.toLowerCase() === search.trim().toLowerCase()
          );
          onChange(match ? match.value : search.trim());
        } else {
          onChange('');
        }
      }
    }, 150);
  };

  return (
    <div ref={containerRef} className="relative">
      {label && (
        <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
      )}
      <input
        ref={inputRef}
        type="text"
        className="input w-full"
        value={search}
        onChange={(e) => handleInputChange(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={handleBlur}
        placeholder={placeholder}
        disabled={disabled}
      />
      {open && (filtered.length > 0 || showCreate) && (
        <ul className="absolute z-50 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-gray-200 bg-white shadow-lg">
          {filtered.map((opt) => (
            <li
              key={opt.value}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(opt.value)}
              className={`cursor-pointer px-3 py-2 text-sm hover:bg-primary-50 ${
                opt.value === value ? 'bg-primary-50 font-medium text-primary-700' : 'text-gray-700'
              }`}
            >
              {opt.label}
            </li>
          ))}
          {showCreate && (
            <li
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => handleSelect(search.trim())}
              className="cursor-pointer border-t border-gray-100 px-3 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50"
            >
              + Crear: {search.trim()}
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
