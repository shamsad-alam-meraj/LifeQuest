import { describe, expect, it } from 'vitest';
import { buildLoginEmail, smtpConfig } from './mailer';

describe('smtpConfig', () => {
  it('is null unless host, user and pass are all set', () => {
    expect(smtpConfig({})).toBeNull();
    expect(smtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'u' })).toBeNull();
  });
  it('derives TLS mode from the port and builds a default From', () => {
    expect(smtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'me@x.co', SMTP_PASS: 'p', SMTP_PORT: '465' })).toMatchObject({ port: 465, secure: true, from: 'LifeQuest <me@x.co>' });
    expect(smtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_PORT: '587' })?.secure).toBe(false);
    expect(smtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p' })?.port).toBe(587);
    expect(smtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', SMTP_PORT: '2525', SMTP_SECURE: 'true' })?.secure).toBe(true);
    expect(smtpConfig({ SMTP_HOST: 'h', SMTP_USER: 'u', SMTP_PASS: 'p', MAIL_FROM: 'Q <q@x.co>' })?.from).toBe('Q <q@x.co>');
  });
});

describe('buildLoginEmail', () => {
  const m = buildLoginEmail({ code: '123456', link: 'https://x.co/auth/confirm?token_hash=a&type=email' });
  it('contains the code and link in both text and html, and puts the code in the subject', () => {
    expect(m.subject).toContain('123456');
    expect(m.text).toContain('123456'); expect(m.text).toContain('token_hash=a');
    expect(m.html).toContain('123456'); expect(m.html).toContain('token_hash=a&amp;type=email');
  });
  it('escapes html in anything it embeds', () => {
    const evil = buildLoginEmail({ code: '<img onerror=x>', link: 'https://x.co/?a="><script>' });
    expect(evil.html).not.toContain('<img onerror'); expect(evil.html).not.toContain('"><script>');
  });
});
