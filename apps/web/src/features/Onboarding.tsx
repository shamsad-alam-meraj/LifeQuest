'use client';

import type { Profile } from '@lifequest/core';
import { useState } from 'react';
import { Fox } from '../ui/Fox';
import { Logo } from '../ui/Logo';

const split = (s: string) => s.split(',').map((x) => x.trim()).filter(Boolean);

export function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [name, setName] = useState('');
  const [interests, setInterests] = useState('');
  const [goals, setGoals] = useState('');
  return (
    <div className="grid min-h-screen place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 flex justify-center"><Logo /></div>
        <form className="card flex flex-col gap-4 sm:p-8" onSubmit={(e) => { e.preventDefault(); onDone({ name: name.trim() || 'Adventurer', interests: split(interests), goals: split(goals), dailyQuestLimit: 3 }); }}>
          <div className="text-center"><div className="flex justify-center"><Fox size={104} /></div><h1 className="mt-1 text-2xl">Create your hero</h1><p className="mt-2 text-sm text-ink2">A few details so your Game Master can craft quests that fit your life.</p></div>
          <label className="field">Hero name<input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="Adventurer" maxLength={30} /></label>
          <label className="field">Interests <small>comma separated</small><input className="input" value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="guitar, running, cooking" /></label>
          <label className="field">Real-life goals <small>comma separated</small><input className="input" value={goals} onChange={(e) => setGoals(e.target.value)} placeholder="learn guitar, run a 5k" /></label>
          <button className="btn btn-gold btn-lg">Begin your journey</button>
        </form>
      </div>
    </div>
  );
}
