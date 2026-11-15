import nodemailer, { type Transporter } from 'nodemailer';

export interface SmtpConfig { host: string; port: number; secure: boolean; user: string; pass: string; from: string }

/** SMTP settings from env, or null if not configured. Port 465 uses implicit TLS; other ports upgrade with STARTTLS. */
export function smtpConfig(env: Record<string, string | undefined> = process.env): SmtpConfig | null {
  const { SMTP_HOST: host, SMTP_USER: user, SMTP_PASS: pass } = env;
  if (!host || !user || !pass) return null;
  const port = Number(env.SMTP_PORT) || 587;
  const secure = env.SMTP_SECURE ? env.SMTP_SECURE === 'true' : port === 465;
  return { host, port, secure, user, pass, from: env.MAIL_FROM || `LifeQuest <${user}>` };
}

let cached: { key: string; transporter: Transporter } | undefined;

function transporterFor(c: SmtpConfig): Transporter {
  const key = `${c.host}:${c.port}:${c.user}`;
  if (cached?.key !== key) {
    cached = { key, transporter: nodemailer.createTransport({ host: c.host, port: c.port, secure: c.secure, auth: { user: c.user, pass: c.pass }, connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 15_000 }) };
  }
  return cached.transporter;
}

export interface Mail { to: string; subject: string; text: string; html: string }

export async function sendMail(mail: Mail, config: SmtpConfig | null = smtpConfig()): Promise<void> {
  if (!config) throw new Error('SMTP is not configured');
  await transporterFor(config).sendMail({ from: config.from, ...mail });
}

export async function verifySmtp(config: SmtpConfig | null = smtpConfig()): Promise<void> {
  if (!config) throw new Error('SMTP is not configured');
  await transporterFor(config).verify();
}

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);

/** The sign-in email: a big code to type, plus a one-click link that works on any device. */
export function buildLoginEmail({ code, link, minutes = 60 }: { code: string; link: string; minutes?: number }): Omit<Mail, 'to'> {
  const subject = `Your LifeQuest sign-in code: ${code}`;
  const text = `Your LifeQuest sign-in code is ${code}\n\nEnter it on the sign-in page, or open this link to sign in directly:\n${link}\n\nThe code and link expire in ${minutes} minutes. If you didn't request this, you can ignore this email.\n`;
  const html = `<!doctype html><html><body style="margin:0;background:#070b24;padding:24px;font-family:system-ui,-apple-system,Segoe UI,sans-serif;color:#f1f0ff">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr><td align="center">
<table role="presentation" width="480" cellpadding="0" cellspacing="0" style="max-width:480px;background:#1f1a42;border:1px solid #3a336f;border-radius:16px;padding:32px">
<tr><td style="font-size:20px;font-weight:700;color:#fbbf24">⚔️ LifeQuest</td></tr>
<tr><td style="padding-top:16px;font-size:16px;color:#b4b3dc">Your sign-in code</td></tr>
<tr><td style="padding:12px 0;font-size:36px;font-weight:700;letter-spacing:8px;color:#ffffff">${esc(code)}</td></tr>
<tr><td style="font-size:14px;color:#b4b3dc">Enter it on the sign-in page. Or tap the button to sign in directly (works on any device).</td></tr>
<tr><td style="padding:20px 0"><a href="${esc(link)}" style="display:inline-block;background:#fbbf24;color:#3a2300;font-weight:700;text-decoration:none;padding:12px 22px;border-radius:999px">Sign in to LifeQuest</a></td></tr>
<tr><td style="font-size:12px;color:#8180b2">Expires in ${minutes} minutes. If you didn't request this, you can safely ignore this email.</td></tr>
</table></td></tr></table></body></html>`;
  return { subject, text, html };
}
