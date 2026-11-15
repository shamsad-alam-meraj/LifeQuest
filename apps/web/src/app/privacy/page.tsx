import type { Metadata } from 'next';
import Link from 'next/link';
import { Logo } from '../../ui/Logo';
import { RETENTION_DAYS } from '../../server/loginEvents';

export const metadata: Metadata = {
  title: 'Privacy',
  description: 'What LifeQuest stores, how sign-in is secured, and your choices.',
  alternates: { canonical: '/privacy' },
  openGraph: { url: '/privacy', title: 'Privacy · LifeQuest', description: 'What LifeQuest stores, how sign-in is secured, and your choices.' },
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto w-full max-w-3xl px-4 py-12">
      <Link href="/" className="mb-8 inline-block" aria-label="Home"><Logo /></Link>
      <h1 className="text-3xl">Privacy</h1>
      <div className="mt-6 flex flex-col gap-6 text-ink2">
        <section><h2 className="mb-2 text-xl text-ink">Guests</h2><p>If you play without an account, everything stays in your browser. We receive nothing.</p></section>
        <section><h2 className="mb-2 text-xl text-ink">Accounts</h2><p>Signing in uses a one-time code sent to your email; there are no passwords. We store your email, your game progress (so it syncs between devices) and, if you join a guild, your display name, level and XP, which other guild members can see.</p></section>
        <section>
          <h2 className="mb-2 text-xl text-ink">Sign-in security log</h2>
          <p>To keep accounts safe and to stop abuse, we keep a security log of sign-in activity. It is used to rate-limit attacks and to show you your own recent sign-ins in Settings, is deleted automatically after {RETENTION_DAYS} days, and is never sold or shared for advertising.</p>
        </section>
        <section><h2 className="mb-2 text-xl text-ink">AI providers</h2><p>If you add your own AI key, quest-generation prompts (your goals, interests and recent quest titles) are sent directly from your browser to the provider you choose. Your key is stored only in your browser.</p></section>
        <section><h2 className="mb-2 text-xl text-ink">Your choices</h2><p>You can export your data as PDF or CSV and delete your progress in Settings. To have your account and all stored data erased, contact the site owner.</p></section>
      </div>
    </main>
  );
}
