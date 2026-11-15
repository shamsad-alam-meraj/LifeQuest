'use client';

import { PROVIDERS, type ProviderId } from '@lifequest/ai';
import { emptyState, levelFromXp, titleForLevel, totalXp } from '@lifequest/core';
import Link from 'next/link';
import { useEffect, useState, type ReactNode } from 'react';
import type { LoginEntry } from '../lib/types';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Icon } from '../ui/Icon';
import { Select } from '../ui/Select';
import { downloadCsv } from '../export/csv';
import { notificationsSupported, useInstall } from './device';
import type { Ctx } from './types';

type Section = 'profile' | 'preferences' | 'ai' | 'data';
const SECTIONS: { id: Section; label: string; icon: string; hint: string }[] = [
  { id: 'profile', label: 'Profile', icon: 'users', hint: 'Name, interests, goals' },
  { id: 'preferences', label: 'Preferences', icon: 'gear', hint: 'Balance, reminders, app' },
  { id: 'ai', label: 'AI Game Master', icon: 'sparkle', hint: 'Provider and API key' },
  { id: 'data', label: 'Data & sync', icon: 'book', hint: 'Cloud, export, reset' },
];

const parseList = (s: string) => [...new Set(s.split(',').map((x) => x.trim()).filter(Boolean))].slice(0, 10);
const same = (a: string[], b: string[]) => a.length === b.length && a.every((x, i) => x === b[i]);

function Panel({ title, desc, children }: { title: string; desc?: string; children: ReactNode }) {
  return (
    <section className="card flex flex-col gap-4 sm:p-6">
      <div><h2 className="text-xl">{title}</h2>{desc && <p className="mt-1 text-sm text-ink2">{desc}</p>}</div>
      {children}
    </section>
  );
}

export function Settings(ctx: Ctx) {
  const [section, setSection] = useState<Section>('profile');

  return (
    <div className="flex flex-col gap-6">
      <div><h1 className="text-3xl">Settings</h1><p className="mt-1 text-ink2">Make LifeQuest yours.</p></div>

      <div className="grid items-start gap-6 xl:grid-cols-[260px_minmax(0,1fr)] 2xl:grid-cols-[300px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 xl:sticky xl:top-24 xl:mx-0 xl:flex-col xl:overflow-visible xl:px-0">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)} aria-current={section === s.id ? 'page' : undefined}
              className={`flex shrink-0 items-center gap-3 rounded-xl border px-4 py-3 text-left transition xl:w-full ${section === s.id ? 'border-gold/40 bg-white/10 text-gold' : 'border-line bg-glass text-ink2 hover:bg-white/5 hover:text-ink'}`}>
              <Icon name={s.icon} size={20} />
              <span className="min-w-0"><span className="block whitespace-nowrap font-semibold">{s.label}</span><span className="hidden text-xs text-ink3 xl:block">{s.hint}</span></span>
            </button>
          ))}
        </nav>

        <div className="flex min-w-0 flex-col gap-6">
          {section === 'profile' && <ProfileSection {...ctx} />}
          {section === 'preferences' && <PreferencesSection {...ctx} />}
          {section === 'ai' && <AiSection {...ctx} />}
          {section === 'data' && <DataSection {...ctx} />}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ state, setState, email, signOut, requestLogin, sync, toast, cloud }: Ctx) {
  const profile = state.profile!;
  const [name, setName] = useState(profile.name);
  const [interests, setInterests] = useState(profile.interests.join(', '));
  const [goals, setGoals] = useState(profile.goals.join(', '));
  const xp = totalXp(state);
  const level = levelFromXp(xp);

  const next = { name: name.trim(), interests: parseList(interests), goals: parseList(goals) };
  const dirty = next.name !== profile.name || !same(next.interests, profile.interests) || !same(next.goals, profile.goals);
  const valid = next.name.length >= 1 && next.name.length <= 30;

  function save(e: React.FormEvent) {
    e.preventDefault();
    if (!valid || !dirty) return;
    setState((s) => ({ ...s, profile: { ...s.profile!, ...next } }));
    setInterests(next.interests.join(', ')); setGoals(next.goals.join(', '));
    toast(email ? '✓ Profile updated. It will sync to your account.' : '✓ Profile updated.');
  }

  return (
    <>
      <section className="card flex flex-wrap items-center gap-5 bg-grad-violet sm:p-6">
        <div className="grid size-20 shrink-0 place-items-center rounded-full border-2 border-gold bg-bg2 font-display text-3xl">{(email ?? profile.name).charAt(0).toUpperCase()}</div>
        <div className="min-w-0 flex-1 basis-48">
          <p className="break-words font-display text-2xl">{profile.name}</p>
          <p className="truncate text-sm text-white/80">{email ?? 'Guest · saved on this device only'}</p>
          <p className="mt-2 flex flex-wrap gap-2"><span className="pill">Lv {level} · {titleForLevel(level)}</span><span className="pill text-gold">{xp} XP</span>{email && <span className="pill">{sync === 'synced' ? '● Synced' : sync === 'syncing' ? '● Syncing…' : sync === 'error' ? '● Sync failed' : 'Local only'}</span>}</p>
        </div>
        {email ? <button className="btn w-full sm:w-auto" onClick={signOut}>Sign out</button> : <button className="btn btn-gold w-full sm:w-auto" onClick={requestLogin}>Sign in with email</button>}
      </section>

      {!email && (
        <div className="card flex flex-wrap items-center justify-between gap-3 border-gold/30">
          <p className="max-w-2xl text-sm text-ink2">Sign in with a one-time email code to sync across devices, join guilds and keep your progress safe. No password needed.</p>
          <button className="btn btn-primary" onClick={requestLogin}>Sign in</button>
        </div>
      )}

      <Panel title="Edit profile" desc="Your Game Master uses this to craft quests that fit your life.">
        <form onSubmit={save} className="flex flex-col gap-4">
          <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
            <label className="field">Hero name<input className="input" value={name} onChange={(e) => setName(e.target.value)} maxLength={30} aria-invalid={!valid || undefined} /><small>{name.trim().length}/30 · shown on guild leaderboards</small></label>
            <label className="field">Email<input className="input opacity-70" value={email ?? 'Not signed in'} readOnly disabled /><small>{email ? 'Your login. Contact support to change it.' : 'Sign in to attach an email.'}</small></label>
          </div>
          <label className="field">Interests <small>comma separated, up to 10</small><input className="input" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="guitar, running, cooking" /></label>
          <label className="field">Real-life goals <small>comma separated, up to 10. Tap one on Home to start an adventure</small><input className="input" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="learn guitar, run a 5k" /></label>
          <div className="flex flex-wrap items-center gap-3">
            <button className="btn btn-gold" disabled={!dirty || !valid}>Save changes</button>
            <button type="button" className="btn btn-ghost" disabled={!dirty} onClick={() => { setName(profile.name); setInterests(profile.interests.join(', ')); setGoals(profile.goals.join(', ')); }}>Discard</button>
            {dirty && <span className="text-sm text-gold">Unsaved changes</span>}
          </div>
        </form>
      </Panel>
      {email && cloud && <RecentSignIns cloud={cloud} />}
    </>
  );
}

/** Browser/OS summary from a user-agent string (best effort, for display only). */
function describeDevice(ua: string | null): string {
  if (!ua) return 'Unknown device';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome' : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Browser';
  const os = /Windows/.test(ua) ? 'Windows' : /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown OS';
  return `${browser} on ${os}`;
}
const EVENT_LABEL: Record<string, string> = { login_success: 'Signed in', logout: 'Signed out', otp_requested: 'Code requested', login_failed: 'Wrong code', login_blocked: 'Blocked (too many attempts)' };

function RecentSignIns({ cloud }: Pick<Ctx, 'cloud'>) {
  const [rows, setRows] = useState<LoginEntry[] | null>(null);
  const [err, setErr] = useState('');
  useEffect(() => { cloud?.recentLogins().then(setRows).catch((e: Error) => setErr(e.message)); }, [cloud]);
  return (
    <Panel title="Recent sign-in activity" desc="Your latest sign-in events with the IP address and device we recorded. If you don't recognise something, sign out and contact the site owner.">
      {err && <p className="text-sm text-bad">{err}</p>}
      {!rows && !err && <p className="text-sm text-ink2">Loading…</p>}
      {rows && rows.length === 0 && <p className="text-sm text-ink2">No activity recorded yet.</p>}
      {rows && rows.length > 0 && (
        <ul className="m-0 flex list-none flex-col gap-2 p-0">
          {rows.map((r, i) => (
            <li key={i} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 rounded-xl bg-white/5 px-4 py-3 text-sm">
              <span className="font-semibold">{EVENT_LABEL[r.event] ?? r.event}</span>
              <span className="text-ink2">{describeDevice(r.userAgent)}</span>
              <span className="font-mono text-xs text-ink2">{r.ip ?? 'IP unknown'}</span>
              <time className="text-xs text-ink3" dateTime={r.at}>{new Date(r.at).toLocaleString()}</time>
            </li>
          ))}
        </ul>
      )}
      <p className="text-xs text-ink3">Sign-in records are deleted after 90 days. <Link href="/privacy" className="text-gold">Privacy</Link></p>
    </Panel>
  );
}

function PreferencesSection({ state, setState, toast }: Ctx) {
  const profile = state.profile!;
  const { canInstall, install } = useInstall();
  return (
    <>
      <Panel title="Balance" desc="A cap keeps the game a companion to your life, not a replacement for it.">
        <label className="field">Max rewarded quests per day: <b className="text-ink">{profile.dailyQuestLimit}</b>
          <input type="range" min={1} max={8} value={profile.dailyQuestLimit} className="accent-violet" onChange={(e) => setState((s) => ({ ...s, profile: { ...profile, dailyQuestLimit: Number(e.target.value) } }))} />
        </label>
      </Panel>
      <Panel title="Reminders & app" desc="Reminders appear while LifeQuest is open or installed, and are skipped if you’ve already played today.">
        <label className="field max-w-xs">Daily reminder time<input className="input" type="time" value={profile.reminderTime ?? ''} onChange={(e) => setState((s) => ({ ...s, profile: { ...profile, reminderTime: e.target.value || undefined } }))} /></label>
        <div className="flex flex-wrap items-center gap-3">
          {notificationsSupported() ? (
            Notification.permission === 'granted' ? <span className="text-sm text-good">✓ Notifications allowed</span>
              : Notification.permission === 'denied' ? <span className="text-sm text-ink2">Notifications are blocked in your browser settings.</span>
                : <button className="btn" onClick={() => void Notification.requestPermission().then((p) => { toast(p === 'granted' ? 'Notifications enabled.' : 'Notifications not enabled.'); setState((s) => ({ ...s })); })}>Allow notifications</button>
          ) : <span className="text-sm text-ink2">Notifications aren’t supported here.</span>}
          {canInstall && <button className="btn btn-primary" onClick={() => void install()}>Install app</button>}
        </div>
      </Panel>
    </>
  );
}

function AiSection({ ai, setAi, toast }: Ctx) {
  const [provider, setProvider] = useState<ProviderId>(ai?.provider ?? 'gemini');
  const [key, setKey] = useState(ai?.apiKey ?? '');
  const [model, setModel] = useState(ai?.model ?? '');
  const info = PROVIDERS.find((p) => p.id === provider)!;
  return (
    <Panel title="AI Game Master" desc="Use a free-tier key. It stays in this browser and is sent only to the provider you pick. Without one, an offline Game Master is used.">
      <div className="grid items-start gap-4 [grid-template-columns:repeat(auto-fit,minmax(min(100%,230px),1fr))]">
        <Select label="Provider" value={provider} onChange={setProvider} options={PROVIDERS.map((p) => ({ value: p.id, label: p.label }))} />
        <label className="field"><span>Model <span className="text-ink3">(optional)</span></span><input className="input" value={model} onChange={(e) => setModel(e.target.value)} placeholder={info.defaultModel} /></label>
      </div>
      <label className="field"><span>API key <a className="text-gold" href={info.keyUrl} target="_blank" rel="noreferrer">(get a free key)</a></span><input className="input" type="password" value={key} onChange={(e) => setKey(e.target.value)} autoComplete="off" /></label>
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" onClick={() => { setAi(key.trim() ? { provider, apiKey: key.trim(), model: model.trim() || undefined } : null); toast(key.trim() ? 'AI settings saved.' : 'AI disabled.'); }}>Save</button>
        {ai && <button className="btn" onClick={() => { setAi(null); setKey(''); toast('Key removed.'); }}>Remove key</button>}
        <span className="text-sm text-ink2">{ai ? `Active: ${PROVIDERS.find((p) => p.id === ai.provider)!.label}` : 'Offline mode'}</span>
      </div>
    </Panel>
  );
}

function DataSection({ state, setState, toast, cloud, sync, syncNow }: Ctx) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [busy, setBusy] = useState(false);
  const done = state.quests.filter((q) => q.status === 'completed').length;
  async function pdf() {
    setBusy(true);
    try { await (await import('../export/pdf')).downloadPdf(state); toast('PDF report downloaded.'); }
    catch { toast('Could not create the PDF. Please try again.'); }
    setBusy(false);
  }
  return (
    <>
      {cloud && (
        <Panel title="Cloud sync" desc="Your progress is saved to your account and merged across devices, so you never lose a quest. Offline changes sync when you’re back online.">
          <div className="flex flex-wrap items-center gap-3"><button className="btn" onClick={syncNow} disabled={sync === 'syncing'}>{sync === 'syncing' ? 'Syncing…' : 'Sync now'}</button><span className={`text-sm ${sync === 'error' ? 'text-bad' : 'text-ink2'}`}>{sync === 'synced' ? '✓ Up to date' : sync === 'error' ? 'Last sync failed. Your data is safe on this device.' : ''}</span></div>
        </Panel>
      )}
      <Panel title="Export your data" desc={`Download your quest history (${state.quests.length} quests, ${done} completed) to keep, print or open in a spreadsheet.`}>
        <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(min(100%,260px),1fr))]">
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-white/5 p-4"><div><p className="font-semibold">📄 PDF report</p><p className="text-sm text-ink2">A printable summary: level, skills and your full quest journal.</p></div><button className="btn mt-auto" onClick={() => void pdf()} disabled={busy}>{busy ? 'Creating PDF…' : 'Download PDF'}</button></div>
          <div className="flex flex-col gap-3 rounded-xl border border-line bg-white/5 p-4"><div><p className="font-semibold">📊 CSV spreadsheet</p><p className="text-sm text-ink2">Every quest as a row. Opens in Excel, Numbers and Google Sheets.</p></div><button className="btn mt-auto" onClick={() => { downloadCsv(state); toast('CSV downloaded.'); }}>Download CSV</button></div>
        </div>
        <p className="text-xs text-ink3">{cloud ? 'Your progress itself is backed up automatically by cloud sync.' : 'Tip: sign in to back up and sync your progress itself across devices.'}</p>
      </Panel>
      <section className="card flex flex-col gap-3 border-bad/30 sm:p-6">
        <h2 className="text-xl text-bad">Danger zone</h2>
        <p className="text-sm text-ink2">Permanently delete your hero, adventures, skills and trophies. {cloud ? 'Because you’re signed in, this also clears your cloud save. Another device that still holds your progress could sync it back.' : 'This only affects this device.'}</p>
        <div><button className="btn btn-danger" onClick={() => setConfirmReset(true)}>Reset everything</button></div>
      </section>
      {confirmReset && <ConfirmDialog danger title="Reset everything?" message="This permanently deletes your hero, adventures, skills and trophies on this device. Export a save first if you might want them back." confirmLabel="Delete all progress" onCancel={() => setConfirmReset(false)} onConfirm={() => { setState(emptyState()); setConfirmReset(false); toast('Progress reset.'); }} />}
    </>
  );
}
