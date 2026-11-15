'use client';

import { useEffect, useRef, type ClipboardEvent, type KeyboardEvent } from 'react';
import { OTP_DEFAULT, boxCount, fillFrom, removeAt } from './otpLogic';

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Called when the code reaches `autoSubmitAt` digits (typing or paste). */
  onComplete?: (v: string) => void;
  autoSubmitAt?: number;
  disabled?: boolean;
  invalid?: boolean;
}

/** Accessible one-time-code input: auto-advance, backspace, arrows, paste, OS autofill. Accepts 6 to 10 digit codes. */
export function OtpInput({ value, onChange, onComplete, autoSubmitAt = OTP_DEFAULT, disabled, invalid }: Props) {
  const refs = useRef<(HTMLInputElement | null)[]>([]);
  const length = boxCount(value);
  useEffect(() => { refs.current[0]?.focus(); }, []);
  // after a failed attempt the parent clears the value and re-enables input: return focus to the first box
  useEffect(() => { if (!value && !disabled) refs.current[0]?.focus(); }, [value, disabled]);

  const digits = Array.from({ length }, (_, i) => value[i] ?? '');
  const focus = (i: number) => refs.current[Math.max(0, Math.min(length - 1, i))]?.focus();

  function apply(index: number, raw: string) {
    const r = fillFrom(index < 0 ? '' : value, Math.max(0, index), raw);
    if (r.value === value && !raw) return;
    onChange(r.value);
    if (r.value.length === autoSubmitAt && r.value.length > value.length) onComplete?.(r.value);
    else setTimeout(() => focus(r.focus)); // after React re-renders the new boxes
  }

  function onKey(i: number, e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (value[i]) onChange(removeAt(value, i));
      else if (i > 0) { onChange(removeAt(value, i - 1)); focus(i - 1); }
    } else if (e.key === 'ArrowLeft') { e.preventDefault(); focus(i - 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); focus(i + 1); }
  }

  function onPaste(e: ClipboardEvent) {
    e.preventDefault();
    apply(-1, e.clipboardData.getData('text')); // a paste replaces the whole code
  }

  return (
    <div role="group" aria-label="Sign-in code" className="flex justify-center gap-1.5 sm:gap-2.5" onPaste={onPaste}>
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          value={d}
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete={i === 0 ? 'one-time-code' : 'off'}
          maxLength={10}
          disabled={disabled}
          aria-label={`Digit ${i + 1} of ${length}`}
          aria-invalid={invalid || undefined}
          onChange={(e) => apply(i, e.target.value)}
          onKeyDown={(e) => onKey(i, e)}
          onFocus={(e) => e.target.select()}
          className={`h-12 min-w-0 max-w-12 flex-1 rounded-xl border bg-[rgb(5_8_30/0.6)] text-center font-display text-xl text-ink transition focus:border-violet focus:ring-3 focus:ring-violet/30 focus:outline-none disabled:opacity-50 sm:h-14 sm:text-2xl ${invalid ? 'border-bad' : d ? 'border-gold/60' : 'border-line'}`}
        />
      ))}
    </div>
  );
}
