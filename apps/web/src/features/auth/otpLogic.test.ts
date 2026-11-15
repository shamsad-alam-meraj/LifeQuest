import { describe, expect, it } from 'vitest';
import { OTP_DEFAULT, OTP_MAX, boxCount, digitsOnly, fillFrom, removeAt } from './otpLogic';

describe('otp input logic', () => {
  it('keeps digits only', () => { expect(digitsOnly(' 48 29-13 ')).toBe('482913'); });
  it('a pasted or autofilled code lands in order, whatever its length (6 to 10)', () => {
    for (const code of ['482913', '48291377', '4829137712']) expect(fillFrom('', 0, code)).toMatchObject({ value: code });
  });
  it('an 8-digit code is never truncated to 6 (the production bug)', () => {
    expect(fillFrom('', 0, '48291377').value).toBe('48291377');
  });
  it('caps at the maximum and ignores non-digits', () => {
    expect(fillFrom('', 0, '1234567890123').value).toHaveLength(OTP_MAX);
    expect(fillFrom('123', 3, 'abc')).toEqual({ value: '123', focus: 3 });
  });
  it('typing one digit at a time advances focus and never leaves gaps', () => {
    let v = ''; let f = 0;
    for (const c of '4829') { const r = fillFrom(v, f, c); v = r.value; f = r.focus; }
    expect(v).toBe('4829'); expect(f).toBe(4);
    expect(fillFrom('48', 6, '9').value).toBe('489'); // clicking a far box appends instead of leaving holes
  });
  it('overtyping a middle box replaces that digit', () => { expect(fillFrom('482913', 2, '7').value).toBe('487913'); });
  it('backspace removes and shifts left', () => { expect(removeAt('482913', 2)).toBe('48913'); });
  it('shows 8 boxes by default and grows for longer codes', () => {
    expect(boxCount('')).toBe(OTP_DEFAULT); expect(boxCount('123456')).toBe(8); expect(boxCount('1234567890')).toBe(10);
  });
});
