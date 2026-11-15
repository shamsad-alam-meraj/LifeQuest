/** Supabase allows 6 to 10 digit email codes (default 8). The input accepts any of them with no configuration. */
export const OTP_MIN = 6;
export const OTP_DEFAULT = 8; // number of boxes shown, and the length that auto-submits
export const OTP_MAX = 10;

export const digitsOnly = (s: string) => s.replace(/\D/g, '');

/**
 * Apply typed/pasted/autofilled text at box `index`. Digits are written from that box onward, there are never gaps,
 * and the code is capped at `max`. `focus` is the box that should receive focus next.
 */
export function fillFrom(value: string, index: number, raw: string, max = OTP_MAX): { value: string; focus: number } {
  const d = digitsOnly(raw);
  if (!d) return { value, focus: index };
  const at = Math.min(index, value.length);
  const next = (value.slice(0, at) + d + value.slice(at + d.length)).slice(0, max);
  return { value: next, focus: Math.min(at + d.length, max - 1) };
}

/** Remove the digit at `index` (later digits shift left). */
export const removeAt = (value: string, index: number) => value.slice(0, index) + value.slice(index + 1);

/** Boxes to render: at least the default, growing if a longer code was pasted. */
export const boxCount = (value: string) => Math.min(OTP_MAX, Math.max(OTP_DEFAULT, value.length));
