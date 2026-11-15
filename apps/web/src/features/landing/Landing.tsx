'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Fox } from '../../ui/Fox';
import { Icon } from '../../ui/Icon';
import { Logo } from '../../ui/Logo';

const REPO = 'https://github.com/shamsad-alam-meraj/LifeQuest';
const PORTFOLIO = 'https://shamsad.vercel.app';

const FEATURES = [
  { i: '🧭', c: 'bg-grad-violet', t: 'AI Game Master', d: 'Tell it a real goal. It builds an adventure of concrete, doable quests sized to your level and interests.' },
  { i: '🌳', c: 'bg-grad-blue', t: 'Skills that grow', d: 'Every quest feeds a skill. Watch guitar, fitness or writing level up into a visible progression tree.' },
  { i: '📜', c: 'bg-grad-teal', t: 'Proof, not points', d: 'Write a line about what you did. Your journal becomes a record of things you really accomplished.' },
  { i: '🔥', c: 'bg-grad-violet', t: 'Streaks & trophies', d: 'Gentle momentum mechanics and achievements that celebrate consistency, never guilt.' },
  { i: '🌿', c: 'bg-grad-teal', t: 'Life over game', d: 'A daily reward cap and offline-first quests keep the game a companion to life, not a replacement.' },
  { i: '🔒', c: 'bg-grad-blue', t: 'Private by design', d: 'No account. Your data stays on your device. Bring your own free AI key, or play fully offline.' },
];

const STEPS = [
  ['Name a goal', '“Run a 5k”, “learn guitar”, “write a novel”. Anything real.'],
  ['Get your adventure', 'Five quests that build on each other, each a 10–90 minute real action.'],
  ['Do it in real life', 'Step away from the screen. Practice, move, make, learn.'],
  ['Check in & level up', 'Log what you did, earn XP, grow your skills and unlock trophies.'],
];

const PHASES = [
  ['Phase 1', 'Personal Adventure', 'AI adventures, quests, progression and your personal world.', true],
  ['Phase 2', 'Social Adventure', 'Guilds, cooperative missions and community challenges.', false],
  ['Phase 3', 'Living Universe', 'Shared worlds, simulations and community-created content.', false],
  ['Phase 4', 'Open Ecosystem', 'Public SDKs, plugins, self-hosting and third-party platforms.', false],
] as const;

const FAQ = [
  ['Is LifeQuest really free?', 'Yes. The app is open source and runs entirely in your browser. AI quest generation uses your own free-tier key from Gemini, Groq or OpenRouter. No key? An offline Game Master still creates quests.'],
  ['Where is my data stored?', 'Only on your device (browser storage). There are no accounts and no servers. Export and import your save any time.'],
  ['How is this different from a habit tracker?', 'Trackers count checkmarks. LifeQuest generates a story-driven path toward a specific goal, grows skills over time and records what you actually did.'],
  ['Does it want me to play more?', 'The opposite. Quests happen in the real world and rewards are capped per day, so the game stays in service of your life.'],
  ['Can I self-host or build on it?', 'Yes. The engine and AI packages are separate, framework-free libraries, and the project is working toward public SDKs and plugins (Phase 4).'],
];

function Phone({ cls, children }: { cls: string; children: React.ReactNode }) {
  return (
    <div className={`absolute h-[520px] w-[250px] rounded-[38px] bg-linear-to-br from-white/35 to-white/5 p-2.5 shadow-[0_30px_70px_rgb(2_4_24/0.7),0_0_60px_rgb(124_58_237/0.25)] ${cls}`}>
      <div className="relative flex h-full flex-col gap-2.5 overflow-hidden rounded-[30px] bg-linear-to-b from-[#121a52] to-bg px-3.5 py-5">{children}</div>
    </div>
  );
}

const MiniQuest = ({ c, t, s, xp }: { c: string; t: string; s: string; xp: string }) => (
  <div className={`flex items-center justify-between rounded-2xl border border-white/15 px-3 py-2.5 text-xs ${c}`}>
    <div><b className="block text-[13px]">{t}</b><small className="opacity-75">{s}</small></div>
    <span className="text-gold font-semibold">{xp}</span>
  </div>
);

export function Landing() {
  const router = useRouter();
  const start = () => router.push('/app');
  return (
    <div className="overflow-x-clip">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded focus:bg-gold focus:px-3 focus:py-2 focus:text-black">Skip to content</a>
      <header className="sticky top-0 z-50 border-b border-line bg-bg/60 backdrop-blur-xl">
        <div className="wrap flex h-17 items-center justify-between">
          <Link href="/" aria-label="LifeQuest home"><Logo /></Link>
          <nav aria-label="Primary" className="hidden md:block">
            <ul className="m-0 flex list-none gap-7 p-0 text-[15px] font-medium text-ink2">
              {[['Features', 'features'], ['How it works', 'how'], ['Roadmap', 'roadmap'], ['FAQ', 'faq']].map(([l, id]) => (
                <li key={id}><a className="no-underline hover:text-ink" href={`#${id}`} onClick={(e) => { e.preventDefault(); document.getElementById(id!)?.scrollIntoView({ behavior: 'smooth' }); }}>{l}</a></li>
              ))}
            </ul>
          </nav>
          <div className="flex items-center gap-2">
            <button className="btn btn-ghost px-4" onClick={() => router.push('/login')}>Sign in</button>
            <button className="btn btn-primary" onClick={start}>Play free</button>
          </div>
        </div>
      </header>

      <main id="main">
        <section className="pt-12 pb-16 sm:pt-24">
          <div className="wrap grid items-center gap-10 text-center lg:grid-cols-[1.05fr_1fr] lg:text-left">
            <div>
              <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-sm font-semibold text-gold"><Icon name="sparkle" size={16} /> Open source · Free · Private</span>
              <h1 className="text-[clamp(2.1rem,4.6vw,3.7rem)] 2xl:text-7xl">Make real life feel like an <em className="text-grad-gold not-italic">adventure</em> worth progressing through.</h1>
              <p className="mx-auto mt-5 mb-8 max-w-xl text-[clamp(1.05rem,2vw,1.25rem)] text-ink2 lg:mx-0">LifeQuest turns your real goals into AI-crafted quests, skill trees and achievements. The game is in your life, not on your screen.</p>
              <div className="flex flex-wrap justify-center gap-3.5 lg:justify-start">
                <button className="btn btn-gold btn-lg" onClick={start}>Start your adventure <Icon name="arrow" size={18} /></button>
                <a className="btn btn-lg" href={REPO} target="_blank" rel="noopener noreferrer"><Icon name="github" size={18} /> View on GitHub</a>
              </div>
              <ul className="m-0 mt-7 flex list-none flex-wrap justify-center gap-x-6 gap-y-2 p-0 text-sm text-ink3 lg:justify-start">
                {['No account', 'Works offline', 'Your data stays yours'].map((t) => <li key={t}><span className="text-gold">✦</span> {t}</li>)}
              </ul>
            </div>
            <div className="relative -my-6 flex h-[560px] scale-[.82] items-center justify-center sm:scale-100" aria-hidden="true">
              <Phone cls="-translate-x-[105px] -rotate-6 scale-[.82] z-10 sm:-translate-x-[150px] sm:scale-[.88]">
                <h3 className="text-xl">Ready, Adventurer?</h3>
                <div className="rounded-2xl border border-line bg-glass2 p-3 text-xs"><div className="mb-2 flex justify-between"><b>LVL 12 · Explorer</b><span className="text-gold">650/900</span></div><div className="bar"><i style={{ width: '72%' }} /></div></div>
                <p className="text-ink2 text-xs">Today’s Quests</p>
                <MiniQuest c="bg-grad-violet" t="Morning stretch" s="Move your body" xp="+25 XP" />
                <MiniQuest c="bg-grad-blue" t="Practice scales" s="Guitar · 20 min" xp="+50 XP" />
                <MiniQuest c="bg-grad-teal" t="Gratitude journal" s="Reflect & grow" xp="+20 XP" />
              </Phone>
              <Phone cls="z-30 animate-float">
                <div className="mt-2 text-center"><span className="font-display text-sm text-ink2">Quest Complete</span></div>
                <div className="mt-2 text-center"><span className="font-display text-5xl font-bold text-grad-gold">+50 xp</span></div>
                <p className="text-center text-xs text-ink2">🔥 Streak increased</p>
                <div className="flex flex-1 items-end justify-center"><Fox size={150} cheer /></div>
                <div className="rounded-full py-2.5 text-center text-sm font-semibold" style={{ backgroundImage: 'linear-gradient(180deg,#a855f7,#6d28d9)' }}>Awesome!</div>
              </Phone>
              <Phone cls="translate-x-[105px] rotate-6 scale-[.82] z-10 sm:translate-x-[150px] sm:scale-[.88]">
                <h3 className="text-center text-lg">Your Journey</h3>
                <div className="rounded-2xl border border-line bg-grad-violet p-3 text-xs"><b className="text-base">Level 12</b><div className="bar mt-2"><i style={{ width: '72%' }} /></div></div>
                {[['🎸 Guitar', 64], ['🏃 Fitness', 38], ['✍️ Writing', 81]].map(([n, p]) => (
                  <div key={n as string} className="rounded-xl border border-line bg-glass p-2.5 text-xs"><div className="mb-1.5 flex justify-between"><span>{n}</span><span className="text-ink3">{p}%</span></div><div className="bar"><i style={{ width: `${p}%` }} /></div></div>
                ))}
              </Phone>
            </div>
          </div>
        </section>

        <section id="features" className="section">
          <div className="wrap">
            <div className="mx-auto mb-12 max-w-2xl text-center"><span className="kicker">Features</span><h2 className="mb-3.5 text-[clamp(1.8rem,4vw,2.8rem)]">Not a habit tracker with XP stapled on.</h2><p className="text-lg text-ink2">A persistent, evolving personal world where your real actions create progression.</p></div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 2xl:gap-7">
              {FEATURES.map((f) => (
                <article key={f.t} className="card"><div className={`grid size-13 place-items-center rounded-2xl text-2xl shadow-[inset_0_1px_0_rgb(255_255_255/0.3)] ${f.c}`}>{f.i}</div><h3 className="mt-3.5 mb-2 text-lg">{f.t}</h3><p className="text-[15px] text-ink2">{f.d}</p></article>
              ))}
            </div>
          </div>
        </section>

        <section id="how" className="section">
          <div className="wrap">
            <div className="mx-auto mb-12 max-w-2xl text-center"><span className="kicker">How it works</span><h2 className="text-[clamp(1.8rem,4vw,2.8rem)]">From goal to quest in seconds.</h2></div>
            <ol className="m-0 grid list-none gap-6 p-0 sm:grid-cols-2 lg:grid-cols-4">
              {STEPS.map(([t, d], i) => (
                <li key={t}><div className="bg-grad-gold mb-4 grid size-11 place-items-center rounded-full font-display text-lg font-bold text-[#3a2300] shadow-[0_0_24px_rgb(251_191_36/0.4)]">{i + 1}</div><h3 className="mb-1.5 text-base">{t}</h3><p className="text-[15px] text-ink2">{d}</p></li>
              ))}
            </ol>
          </div>
        </section>

        <section className="section">
          <div className="wrap grid items-center gap-10 lg:grid-cols-2">
            <blockquote className="m-0 font-display text-[clamp(1.4rem,3vw,2.1rem)] leading-snug font-semibold">“The game should make real life more <span className="text-gold">meaningful</span>, not make people spend more time inside the game.”</blockquote>
            <ul className="m-0 grid list-none gap-3.5 p-0">
              {['Quests are offline, real-world actions', 'Daily reward cap prevents grinding', 'Rewards tied to what you actually did', 'No ads, no dark patterns, no data harvesting'].map((t) => (
                <li key={t} className="flex gap-3 text-ink2"><span className="font-extrabold text-teal">✓</span>{t}</li>
              ))}
            </ul>
          </div>
        </section>

        <section id="roadmap" className="section">
          <div className="wrap">
            <div className="mx-auto mb-12 max-w-2xl text-center"><span className="kicker">Roadmap</span><h2 className="mb-3.5 text-[clamp(1.8rem,4vw,2.8rem)]">One product first. Then an open ecosystem.</h2></div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {PHASES.map(([tag, t, d, now]) => (
                <div key={t} className={`card ${now ? 'border-gold/50 shadow-[0_0_40px_rgb(251_191_36/0.12)]' : ''}`}>
                  <span className={`text-xs font-bold tracking-widest uppercase ${now ? 'text-gold' : 'text-ink3'}`}>{tag}{now ? ' · live' : ''}</span>
                  <h3 className="my-2 text-lg">{t}</h3><p className="text-sm text-ink2">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="section">
          <div className="wrap">
            <div className="mx-auto mb-12 max-w-2xl text-center"><span className="kicker">FAQ</span><h2 className="text-[clamp(1.8rem,4vw,2.8rem)]">Good questions.</h2></div>
            <div className="mx-auto grid max-w-3xl gap-3">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group rounded-xl border border-line bg-glass px-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-3 py-4 font-semibold">{q}<span className="text-xl text-gold group-open:rotate-45 transition-transform">+</span></summary>
                  <p className="pb-4 text-ink2">{a}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <section className="section pb-8">
          <div className="wrap">
            <div className="relative overflow-hidden rounded-[32px] border border-line bg-glass px-6 py-14 text-center sm:py-20" style={{ backgroundImage: 'radial-gradient(600px 300px at 50% 0, rgb(168 85 247 / .35), transparent 70%)' }}>
              <div className="flex justify-center"><Fox size={110} /></div>
              <h2 className="mt-3 mb-3.5 text-[clamp(1.8rem,4.5vw,3rem)]">Your next quest starts now.</h2>
              <p className="mb-7 text-ink2">Free forever. No sign-up. Takes 30 seconds.</p>
              <button className="btn btn-gold btn-lg" onClick={start}>Begin your journey <Icon name="arrow" size={18} /></button>
            </div>
          </div>
        </section>
      </main>

      <footer className="mt-10 border-t border-line py-10 text-sm text-ink3">
        <div className="wrap flex flex-wrap items-center justify-between gap-5">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1"><Logo size={22} /><span>© {new Date().getFullYear()} LifeQuest. MIT licensed. Built by <a className="text-ink2 underline-offset-4 hover:text-ink hover:underline" href={PORTFOLIO} target="_blank" rel="noopener noreferrer">Shamsad Alam Meraj</a>.</span></div>
          <nav aria-label="Footer" className="flex flex-wrap gap-5">
            <a className="no-underline hover:text-ink" href={REPO} target="_blank" rel="noopener noreferrer">GitHub</a>
            <a className="no-underline hover:text-ink" href={PORTFOLIO} target="_blank" rel="noopener noreferrer">Portfolio</a>
            <Link className="no-underline hover:text-ink" href="/app">Open app</Link>
            <Link className="no-underline hover:text-ink" href="/privacy">Privacy</Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
