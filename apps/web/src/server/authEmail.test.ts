import { describe, expect, it, vi } from 'vitest';
import { sendLoginEmail, type AuthEmailDeps } from './authEmail';
import type { SmtpConfig } from './mailer';

const smtp: SmtpConfig = { host: 'h', port: 465, secure: true, user: 'me@x.co', pass: 'p', from: 'LifeQuest <me@x.co>' };
const ok = { data: { properties: { email_otp: '482913', hashed_token: 'abc/def+==' } }, error: null };

const make = (generate: ReturnType<typeof vi.fn>, createUser = vi.fn().mockResolvedValue({ error: null })) => {
  const send = vi.fn().mockResolvedValue(undefined);
  const deps = { admin: { auth: { admin: { generateLink: generate, createUser } } }, smtp, send } as unknown as AuthEmailDeps;
  return { deps, send, createUser };
};

describe('sendLoginEmail', () => {
  it('returns false (caller falls back to Supabase email) when SMTP or the secret key is missing', async () => {
    expect(await sendLoginEmail('a@b.co', 'https://x.co', { admin: null, smtp, send: vi.fn() })).toBe(false);
    const { deps } = make(vi.fn());
    expect(await sendLoginEmail('a@b.co', 'https://x.co', { ...deps, smtp: null })).toBe(false);
  });
  it('emails the code and a token-hash link, and never returns the code to the caller', async () => {
    const { deps, send } = make(vi.fn().mockResolvedValue(ok));
    expect(await sendLoginEmail('a@b.co', 'https://x.co', deps)).toBe(true);
    const mail = send.mock.calls[0]![0];
    expect(mail.to).toBe('a@b.co'); expect(mail.text).toContain('482913');
    expect(mail.text).toContain('https://x.co/auth/confirm?token_hash=abc%2Fdef%2B%3D%3D&type=email');
  });
  it('creates the account on first sign-in, then retries', async () => {
    const generate = vi.fn().mockResolvedValueOnce({ data: {}, error: { code: 'user_not_found', message: 'User not found' } }).mockResolvedValueOnce(ok);
    const { deps, send, createUser } = make(generate);
    expect(await sendLoginEmail('new@b.co', 'https://x.co', deps)).toBe(true);
    expect(createUser).toHaveBeenCalledWith({ email: 'new@b.co', email_confirm: true });
    expect(generate).toHaveBeenCalledTimes(2); expect(send).toHaveBeenCalledOnce();
  });
  it('surfaces generation and delivery failures so no success is reported falsely', async () => {
    const bad = make(vi.fn().mockResolvedValue({ data: {}, error: { code: 'x', message: 'boom' } }));
    await expect(sendLoginEmail('a@b.co', 'https://x.co', bad.deps)).rejects.toBeTruthy();
    const noSend = make(vi.fn().mockResolvedValue(ok)); noSend.send.mockRejectedValue(new Error('smtp down'));
    await expect(sendLoginEmail('a@b.co', 'https://x.co', noSend.deps)).rejects.toThrow('smtp down');
  });
});
