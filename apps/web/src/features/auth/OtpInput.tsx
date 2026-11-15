'use client';

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';

interface Props {
  length: number;
  value: string;
  onChange: (v: string) => void;
  onComplete?: (v: string) => void;
  disabled?: boolean;
  invalid?: boolean;
}

/** Accessible N-box one-time-code input: auto-advance, backspace, arrows, paste, and OS autofill. */
export function OtpInput({ length, value, onChange, onComplete, disabled, invalid }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  // after a failed attempt the parent clears the value and re-enables input: return focus to the first box
  useEffect(() => { if (!value && !disabled) refs.current[0]?.focus(); }, [value, disabled]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  function commit(next: string, focusAt: number) {
    const v = next.replace(/\D/g, '').slice(0, length);
    onChange(v);
    if (v.length === length) onComplete?.(v);
    else focus(focusAt);
  }

  function onInput(i: number, raw: string) {
    const d = raw.replace(/\D/g, '');
    if (!d) return;
    const chars = digits.slice();
    // handles autofill / multi-char input starting at box i
    d.split('').forEach((c, k) => { if (i + k < length) chars[i + k] = c; });
    commit(chars.join(''), i + d.length);
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const chars = digits.slice();
      if (chars[i]) { chars[i] = ''; onChange(chars.join('').replace(/ /g, '')); }
      else if (i > 0) { chars[i - 1] = ''; onChange(chars.slice(0, i - 1).join('')); focus(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1); }
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    commit(e.clipboardData.getData('text'), length);
  }

  return (
    <div role="group" aria-label={`${length}-digit verification code`} className="flex justify-center gap-2 sm:gap-3" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={length}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => onInput(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={`h-12 min-w-0 max-w-14 flex-1 rounded-xl border bg-[rgb(5_8_30/0.6)] text-center font-display text-2xl text-ink transition focus:border-violet focus:ring-3 focus:ring-violet/30 focus:outline-none disabled:opacity-50 sm:h-14 ${invalid ? 'border-bad' : d ? 'border-gold/60' : 'border-line'}`}
        />
      ))}
    </div>
  );
}
