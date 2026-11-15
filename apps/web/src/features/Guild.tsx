'use client';

import { useCallback, useEffect, useState } from 'react';
import { CloudError } from '../lib/cloud';
import type { GuildOverview } from '../lib/types';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { Icon } from '../ui/Icon';
import type { Ctx } from './types';

export function Guild({ cloud, email, requestLogin, toast }: Ctx) {
  const [data, setData] = useState<GuildOverview | null | undefined>(undefined); // undefined = loading
  const [error, setError] = useState('');
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [leaving, setLeaving] = useState(false);

  const load = useCallback(async () => {
    if (!cloud || !email) return;
    setError('');
    try { const g = await cloud.guild(); setData(g); }
    catch (e) { setError(e instanceof CloudError ? e.message : 'Could not load your guild.'); setData(null); }
  }, [cloud, email]);

  useEffect(() => { void load(); }, [load]);

  async function run(fn: () => Promise<GuildOverview | null | void>, ok: string) {
    setBusy(true); setError('');
    try { const g = await fn(); setData(g ?? null); toast(ok); }
    catch (e) { setError(e instanceof CloudError ? e.message : 'Something went wrong. Try again.'); }
    setBusy(false);
  }

  if (!cloud) return <Notice title="Guilds need the cloud" body="This copy of LifeQuest has no backend configured. The site owner can enable guilds by following docs/CLOUD.md." />;
  if (!email) return <Notice title="Sign in to join a guild" body="Guilds, leaderboards and co-op missions need an account so your friends can see your progress." action={<button className="btn btn-primary" onClick={requestLogin}>Sign in with email</button>} />;
  if (data === undefined) return <p className="text-ink2">Loading your guild…</p>;

  if (!data) {
    return (
      <div className="flex flex-col gap-6">
        <h1 className="text-3xl">Guild</h1>
        <p className="max-w-4xl text-ink2">Team up with friends: climb a shared leaderboard and complete a weekly co-op mission together. Up to 30 members.</p>
        <p role="alert" className="min-h-5 text-sm text-bad">{error}</p>
        <div className="grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
          <form className="card flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void run(() => cloud.createGuild(name), 'Guild created!'); }}>
            <h2 className="text-lg">Create a guild</h2>
            <label className="field">Guild name<input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="The Midnight Ramblers" maxLength={40} /></label>
            <button className="btn btn-gold" disabled={busy || name.trim().length < 3}>Create guild</button>
          </form>
          <form className="card flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); void run(() => cloud.joinGuild(code), 'Welcome to the guild!'); }}>
            <h2 className="text-lg">Join with an invite code</h2>
            <label className="field">Invite code<input className="input font-mono tracking-widest uppercase" value={code} onChange={(e) => setCode(e.target.value)} placeholder="ABC123" maxLength={8} autoCapitalize="characters" /></label>
            <button className="btn btn-primary" disabled={busy || code.trim().length < 4}>Join guild</button>
          </form>
        </div>
      </div>
    );
  }

  const { guild, members, mission } = data;
  const pct = Math.min(100, Math.round((mission.progress / mission.target) * 100));
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><p className="text-sm text-ink3">Your guild</p><h1 className="text-3xl">{guild.name}</h1></div>
        <div className="flex items-center gap-2">
          <button className="btn" onClick={() => { void navigator.clipboard?.writeText(guild.invite_code).then(() => toast('Invite code copied.'), () => toast(`Invite code: ${guild.invite_code}`)); }}>Invite code <b className="font-mono tracking-widest text-gold">{guild.invite_code}</b></button>
          <button className="btn btn-ghost" onClick={() => void load()}>Refresh</button>
        </div>
      </div>
      <p role="alert" className="min-h-0 text-sm text-bad">{error}</p>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.4fr)] 2xl:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section className="card flex flex-col gap-3" aria-label="Weekly mission">
          <p className="kicker mb-0">Weekly co-op mission</p>
          <h2 className="text-xl">{mission.title}</h2>
          <div className="bar"><i style={{ width: `${pct}%` }} /></div>
          <p className="flex justify-between text-sm text-ink2"><span>{mission.progress}/{mission.target} quests</span><span>You: {mission.my_amount}</span></p>
          <p className="text-xs text-ink3">Every quest you complete while in the guild adds 1. Resets each week ({mission.week}).</p>
          {pct >= 100 && <p className="rounded-xl border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">🏆 Mission complete! Great teamwork.</p>}
        </section>

        <section className="card" aria-label="Leaderboard">
          <h2 className="mb-3 text-lg">Leaderboard</h2>
          <ol className="m-0 flex list-none flex-col gap-2 p-0">
            {members.map((m, i) => (
              <li key={i} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 ${m.is_me ? 'bg-gold/10 ring-1 ring-gold/30' : 'bg-white/5'}`}>
                <span className="w-6 text-center font-display text-lg">{['🥇', '🥈', '🥉'][i] ?? i + 1}</span>
                <span className="min-w-0 flex-1 truncate font-semibold">{m.name}{m.is_me && <span className="ml-2 text-xs text-gold">you</span>}</span>
                <span className="pill">Lv {m.level}</span>
                <span className="pill hidden sm:inline-flex"><Icon name="flame" size={12} fill /> {m.streak}d</span>
                <span className="w-20 text-right text-sm text-gold">{m.xp} XP</span>
              </li>
            ))}
          </ol>
          <p className="mt-3 text-xs text-ink3">Stats update whenever a member’s progress syncs.</p>
        </section>
      </div>

      <div><button className="btn btn-danger" onClick={() => setLeaving(true)}>Leave guild</button></div>
      {leaving && <ConfirmDialog danger title="Leave this guild?" message="You’ll lose access to the leaderboard and mission. You can rejoin later with the invite code." confirmLabel="Leave guild" onCancel={() => setLeaving(false)} onConfirm={() => { setLeaving(false); void run(async () => { await cloud.leaveGuild(); return null; }, 'You left the guild.'); }} />}
    </div>
  );
}

function Notice({ title, body, action }: { title: string; body: string; action?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-6"><h1 className="text-3xl">Guild</h1>
      <div className="card flex w-full flex-col items-start gap-3"><h2 className="text-xl">{title}</h2><p className="max-w-3xl text-sm text-ink2">{body}</p>{action}</div>
    </div>
  );
}
