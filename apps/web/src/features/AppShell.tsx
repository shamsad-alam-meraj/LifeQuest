'use client';

import Link from 'next/link';
import AppLink from '../components/AppLink';
import { applyShields, completedOn, dayKey, levelProgress, streakDays, titleForLevel, totalXp } from '@lifequest/core';
import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { signOutAction } from '../app/actions';
import { cloud as cloudClient } from '../lib/cloud';
import type { SessionUser } from '../lib/supabase';
import { useGame } from '../store';
import { Icon } from '../ui/Icon';
import { Logo } from '../ui/Logo';
import { useReminder } from './device';
import { Guild } from './Guild';
import { Home } from './Home';
import { Journal } from './Journal';
import { Adventures } from './Adventures';
import { Journey } from './Journey';
import { Onboarding } from './Onboarding';
import { Settings } from './Settings';
import { Trophies } from './Trophies';
import type { Ctx } from './types';

// [route, label, icon, shown in the phone bottom bar]
const TABS = [
  ['', 'Home', 'home', true],
  ['adventures', 'Quests', 'compass', true],
  ['journey', 'Journey', 'map', true],
  ['journal', 'Journal', 'book', false],
  ['guild', 'Guild', 'users', true],
  ['trophies', 'Trophies', 'trophy', false],
  ['settings', 'Settings', 'gear', true],
] as const;

export function AppShell({ user, cloudEnabled }: { user: SessionUser | null; cloudEnabled: boolean; children?: React.ReactNode }) {
  const router = useRouter();
  const tab = usePathname().replace(/^\/app\/?/, '');
  const requestLogin = () => router.push('/login');
  const signOut = async () => { await signOutAction(); router.refresh(); };
  // key: switching account (or guest <-> signed in) must reset the in-memory game state
  return <Game key={user?.id ?? 'guest'} tab={tab} ownerId={user?.id ?? 'guest'} email={user?.email} cloudEnabled={cloudEnabled} signOut={user ? () => void signOut() : undefined} requestLogin={requestLogin} />;
}

function Game({ tab, ownerId, email, cloudEnabled, signOut, requestLogin }: { tab: string; ownerId: string; email?: string; cloudEnabled: boolean; signOut?: () => void; requestLogin: () => void }) {
  const signedIn = Boolean(email) && cloudEnabled;
  const { state, setState, ai, setAi, sync, syncNow } = useGame(ownerId, signedIn ? cloudClient : null);
  const [toasts, setToasts] = useState<{ id: number; msg: string }[]>([]);
  const toast = useCallback((msg: string) => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4500);
  }, []);

  useReminder(state.profile?.reminderTime, completedOn(state, dayKey(new Date().toISOString())).length > 0);

  // Spend a streak shield on load if yesterday was missed (once per mount)
  const shielded = useRef(false);
  useEffect(() => {
    if (shielded.current || !state.profile) return;
    shielded.current = true;
    const next = applyShields(state);
    if (next !== state) { setState(next); toast('🛡️ A streak shield saved your streak!'); }
  }, [state, setState, toast]);

  if (!state.profile) return <Onboarding onDone={(profile) => setState((s) => ({ ...s, profile }))} />;

  const ctx: Ctx = { state, setState, ai, setAi, toast, email, signOut, requestLogin, ownerId, cloud: signedIn ? cloudClient : null, sync, syncNow };
  const xp = totalXp(state);
  const p = levelProgress(xp);

  const titleOf: Record<string, string> = { '': 'Home', adventures: 'Quests', journey: 'Journey', journal: 'Journal', guild: 'Guild', trophies: 'Trophies', settings: 'Settings' };

  return (
    <div className="min-h-screen md:flex">
      <aside className="hidden shrink-0 border-r border-line bg-bg2/50 backdrop-blur-xl md:sticky md:top-0 md:flex md:h-screen md:w-20 md:flex-col md:gap-6 md:px-3 md:py-6 lg:w-64 lg:px-5 2xl:w-72">
        <Link href="/" aria-label="LifeQuest home" className="flex justify-center lg:justify-start"><span className="lg:hidden"><Logo size={36} hideText /></span><span className="hidden lg:inline"><Logo /></span></Link>
        <div className="card hidden p-4 lg:block">
          <p className="text-xs text-ink3">{titleForLevel(p.level)}</p>
          <p className="truncate font-display text-lg">{state.profile.name}</p>
          <div className="mt-2 flex items-center justify-between text-xs text-ink2"><span>Lv {p.level}</span><span className="text-gold">{xp} XP</span></div>
          <div className="bar mt-1.5"><i style={{ width: `${p.fraction * 100}%` }} /></div>
        </div>
        <nav aria-label="App" className="flex flex-col gap-1">
          {TABS.map(([id, label, icon]) => (
            <AppLink key={id} href={`/app${id ? '/' + id : ''}`} title={label} aria-current={tab === id ? 'page' : undefined} className={`flex items-center justify-center gap-3 rounded-xl px-3 py-3 font-medium no-underline transition lg:justify-start lg:px-4 ${tab === id ? 'bg-white/10 text-gold shadow-[inset_3px_0_0_var(--color-gold)]' : 'text-ink2 hover:bg-white/5 hover:text-ink'}`}>
              <Icon name={icon} /><span className="hidden lg:inline">{label}</span>
            </AppLink>
          ))}
        </nav>
        <p className="mt-auto hidden text-xs text-ink3 lg:block">Go live a little, then come back. 🌿</p>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 hidden h-16 items-center justify-between gap-4 border-b border-line bg-bg/70 px-8 backdrop-blur-xl md:flex 2xl:px-14">
          <p className="font-display text-lg">{titleOf[tab] ?? 'LifeQuest'}</p>
          <div className="flex items-center gap-3">
            {sync !== 'off' && <button className="pill cursor-pointer" onClick={syncNow} title="Sync now" aria-label={`Cloud sync: ${sync}. Click to sync now`}><span className={sync === 'error' ? 'text-bad' : sync === 'syncing' ? 'animate-pulse text-gold' : 'text-good'}>●</span>{sync === 'synced' ? 'Synced' : sync === 'syncing' ? 'Syncing…' : 'Sync failed'}</button>}
            <span className="pill"><span className="text-gold"><Icon name="flame" size={14} fill /></span>{streakDays(state)} day streak{(state.shields ?? 0) > 0 ? ` · 🛡️ ${state.shields}` : ''}</span>
            <span className="pill"><span className="text-gold">★</span>Lv {p.level} · {xp} XP</span>
            <AppLink href="/app/settings" className="grid size-9 place-items-center rounded-full border border-line bg-white/10 font-display text-sm no-underline" title={email ?? 'Guest'} aria-label="Account settings">{(email ?? state.profile.name).charAt(0).toUpperCase()}</AppLink>
          </div>
        </header>

        <main className="w-full flex-1 px-4 pt-6 pb-28 md:px-8 md:pt-8 md:pb-12 2xl:px-14">
          {tab === '' && <Home {...ctx} />}
          {tab === 'adventures' && <Adventures {...ctx} />}
          {tab === 'journey' && <Journey {...ctx} />}
          {tab === 'journal' && <Journal {...ctx} />}
          {tab === 'guild' && <Guild {...ctx} />}
          {tab === 'trophies' && <Trophies {...ctx} />}
          {tab === 'settings' && <Settings {...ctx} />}
          {!['', 'adventures', 'journey', 'journal', 'guild', 'trophies', 'settings'].includes(tab) && <div className="card text-center">Page not found. <AppLink className="font-semibold text-gold" href="/app">Go home</AppLink></div>}
        </main>
      </div>

      <nav aria-label="App" className="fixed inset-x-3 bottom-3 z-40 flex justify-around rounded-3xl border border-line bg-[rgb(10_14_50/0.88)] px-1 py-1.5 shadow-glow backdrop-blur-xl md:hidden" style={{ paddingBottom: 'max(6px, env(safe-area-inset-bottom))' }}>
        {TABS.filter((t) => t[3]).map(([id, label, icon]) => (
          <AppLink key={id} href={`/app${id ? '/' + id : ''}`} aria-current={tab === id ? 'page' : undefined} className={`flex min-w-0 flex-1 flex-col items-center gap-0.5 rounded-2xl px-1 py-1.5 text-[10px] font-medium no-underline ${tab === id ? 'bg-white/10 text-gold' : 'text-ink3'}`}>
            <Icon name={icon} size={22} />{label}
          </AppLink>
        ))}
      </nav>

      <div className="pointer-events-none fixed bottom-24 left-1/2 z-120 flex w-[min(420px,calc(100%-24px))] -translate-x-1/2 flex-col gap-2 md:bottom-8" role="status" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className="pointer-events-auto animate-pop rounded-2xl border border-line bg-[#1b1752] px-4 py-3 text-sm shadow-glow">{t.msg}</div>)}
      </div>
    </div>
  );
}
