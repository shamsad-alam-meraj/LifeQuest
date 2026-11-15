'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { sendCodeAction, verifyCodeAction } from '../../app/actions';
import { Fox } from '../../ui/Fox';
import { Logo } from '../../ui/Logo';
import { OtpInput } from './OtpInput';

const RESEND_SECONDS = 30;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function Login({ authEnabled, otpLength, initialError = '' }: { authEnabled: boolean; otpLength: number; initialError?: string }) {
  const router = useRouter();
  const [step, setStep] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(initialError);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  async function send(e?: React.FormEvent) {
    e?.preventDefault();
    if (!EMAIL_RE.test(email.trim())) return setError('Enter a valid email address.');
    setBusy(true); setError('');
    try {
      const r = await sendCodeAction(email);
      if (r.ok) { setStep('code'); setCode(''); setCooldown(RESEND_SECONDS); } else setError(r.error);
    } catch { setError('Network error. Check your connection and try again.'); }
    setBusy(false);
  }

  async function verify(token: string) {
    if (busy) return;
    setBusy(true); setError('');
    try {
      const r = await verifyCodeAction(email, token);
      if (r.ok) { router.replace('/app'); router.refresh(); return; }
      setError(r.error); setCode('');
    } catch { setError('Network error. Check your connection and try again.'); setCode(''); }
    setBusy(false);
  }

  const shell = (children: React.ReactNode) => (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-8 flex justify-center" aria-label="Back to home"><Logo /></Link>
        {children}
      </div>
    </div>
  );

  if (!authEnabled) {
    return shell(
      <div className="card text-center sm:p-8">
        <div className="flex justify-center"><Fox size={96} /></div>
        <h1 className="mt-2 text-2xl">Email sign-in isn’t set up</h1>
        <p className="mt-3 text-sm text-ink2">This copy of LifeQuest is missing its authentication or database configuration (Supabase keys and DATABASE_URL), so sign-in is disabled. You can play as a guest (saved on this device), or the site owner can enable email codes by following docs/CLOUD.md.</p>
        <Link href="/app" className="btn btn-gold btn-lg mt-6 w-full no-underline">Continue as guest</Link>
      </div>,
    );
  }

  return shell(
    <>
      <div className="card text-center sm:p-8">
        <div className="flex justify-center"><Fox size={96} /></div>
        {step === 'email' ? (
          <form onSubmit={send} className="mt-2 flex flex-col gap-4 text-left" noValidate>
            <div className="text-center"><h1 className="text-2xl">Welcome, Adventurer</h1><p className="mt-2 text-sm text-ink2">Enter your email and we’ll send you a one-time code. No password needed.</p></div>
            <label className="field">Email
              <input className="input" type="email" autoComplete="email" inputMode="email" autoFocus placeholder="you@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!error || undefined} aria-describedby="login-err" />
            </label>
            <button className="btn btn-primary btn-lg" disabled={busy}>{busy ? 'Sending…' : 'Send me a code'}</button>
            <p className="text-center text-xs text-ink3"><Link href="/privacy" className="text-gold">Privacy</Link></p>
          </form>
        ) : (
          <div className="mt-2 flex flex-col gap-5">
            <div><h1 className="text-2xl">Check your email</h1><p className="mt-2 text-sm text-ink2">We sent a {otpLength}-digit code to <b className="text-ink">{email}</b>. Enter it below, or just click the sign-in link in the same email. Not there? Check spam, and use only the <b className="text-ink">newest</b> email.</p></div>
            <OtpInput length={otpLength} value={code} onChange={(v) => { setCode(v); setError(''); }} onComplete={verify} disabled={busy} invalid={!!error} />
            <button className="btn btn-primary btn-lg" disabled={busy || code.length < Math.min(6, otpLength)} onClick={() => verify(code)}>{busy ? 'Verifying…' : 'Verify & enter'}</button>
            <div className="flex flex-wrap items-center justify-center gap-x-4 text-sm">
              <button className="btn btn-ghost min-h-9 px-3 py-1 text-sm" disabled={cooldown > 0 || busy} onClick={() => send()}>{cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}</button>
              <button className="btn btn-ghost min-h-9 px-3 py-1 text-sm" onClick={() => { setStep('email'); setError(''); setCode(''); }}>Change email</button>
            </div>
          </div>
        )}
        <p id="login-err" role="alert" aria-live="polite" className="mt-3 min-h-5 text-sm text-bad">{error}</p>
      </div>
      <p className="mt-6 text-center text-sm text-ink3">Just exploring? <Link href="/app" className="font-semibold text-gold underline-offset-4 hover:underline">Continue without an account</Link></p>
    </>,
  );
}
