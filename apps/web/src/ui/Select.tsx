'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Icon } from './Icon';

export interface Option<T extends string> { value: T; label: string }

interface Props<T extends string> {
  label: string;
  value: T;
  options: Option<T>[];
  onChange: (v: T) => void;
}

/** Themed, keyboard-accessible replacement for the native <select> (WAI-ARIA select-only combobox pattern). */
export function Select<T extends string>({ label, value, options, onChange }: Props<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const root = useRef<HTMLDivElement>(null);
  const btn = useRef<HTMLButtonElement>(null);
  const id = useId();
  const selected = Math.max(0, options.findIndex((o) => o.value === value));

  useEffect(() => {
    if (!open) return;
    const away = (e: MouseEvent) => !root.current?.contains(e.target as Node) && setOpen(false);
    document.addEventListener('mousedown', away);
    return () => document.removeEventListener('mousedown', away);
  }, [open]);

  const openMenu = () => { setActive(selected); setOpen(true); };
  const choose = (i: number) => { onChange(options[i]!.value); setOpen(false); btn.current?.focus(); };

  function onKey(e: KeyboardEvent) {
    if (!open) {
      if (['ArrowDown', 'ArrowUp', 'Enter', ' '].includes(e.key)) { e.preventDefault(); openMenu(); }
      return;
    }
    const last = options.length - 1;
    if (e.key === 'ArrowDown') { e.preventDefault(); setActive((a) => Math.min(last, a + 1)); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
    else if (e.key === 'Home') { e.preventDefault(); setActive(0); }
    else if (e.key === 'End') { e.preventDefault(); setActive(last); }
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); choose(active); }
    else if (e.key === 'Escape') { e.preventDefault(); setOpen(false); }
    else if (e.key === 'Tab') setOpen(false);
  }

  return (
    <div className="field" ref={root}>
      <span id={`${id}-label`}>{label}</span>
      <div className="relative">
        <button
          ref={btn}
          type="button"
          className="input flex items-center justify-between gap-3 text-left"
          role="combobox"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-controls={`${id}-list`}
          aria-labelledby={`${id}-label`}
          aria-activedescendant={open ? `${id}-opt-${active}` : undefined}
          onClick={() => (open ? setOpen(false) : openMenu())}
          onKeyDown={onKey}
        >
          <span className="truncate text-ink">{options[selected]?.label}</span>
          <span className={`shrink-0 text-ink3 transition-transform ${open ? 'rotate-180' : ''}`}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6" /></svg></span>
        </button>
        {open && (
          <ul id={`${id}-list`} role="listbox" aria-labelledby={`${id}-label`} className="absolute z-30 mt-2 max-h-64 w-full animate-pop overflow-auto rounded-xl border border-line bg-[#14104a] p-1.5 shadow-glow">
            {options.map((o, i) => (
              <li
                key={o.value}
                id={`${id}-opt-${i}`}
                role="option"
                aria-selected={o.value === value}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(i)}
                className={`flex cursor-pointer items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm text-ink ${i === active ? 'bg-white/10' : ''}`}
              >
                <span>{o.label}</span>
                {o.value === value && <span className="text-gold"><Icon name="check" size={16} /></span>}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
