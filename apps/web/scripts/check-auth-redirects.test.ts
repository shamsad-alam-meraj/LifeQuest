import { describe, expect, it } from 'vitest';
import { evaluate } from './check-auth-redirects.mjs';

describe('auth redirect check', () => {
  it('passes when links go to the live site', () => {
    expect(evaluate('https://life-quest-io.vercel.app/auth/confirm#error=x', 'https://life-quest-io.vercel.app').ok).toBe(true);
  });
  it('fails when Supabase falls back to localhost (the reported bug)', () => {
    expect(evaluate('http://localhost:3000', 'https://life-quest-io.vercel.app')).toMatchObject({ ok: false, got: 'http://localhost:3000' });
  });
  it('fails safely on missing or unreadable redirects', () => {
    expect(evaluate(null, 'https://x.co').ok).toBe(false);
    expect(evaluate('not a url', 'https://x.co').ok).toBe(false);
  });
});
