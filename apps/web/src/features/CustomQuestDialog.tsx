'use client';

import { addCustomQuest, type Difficulty } from '@lifequest/core';
import { useState } from 'react';
import { Modal } from '../ui/Modal';
import type { Ctx } from './types';

const LEVELS: Difficulty[] = ['easy', 'medium', 'hard', 'epic'];

export function CustomQuestDialog({ ctx, onClose }: { ctx: Ctx; onClose: () => void }) {
  const [title, setTitle] = useState('');
  const [action, setAction] = useState('');
  const [skill, setSkill] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('medium');
  const valid = title.trim().length > 0 && action.trim().length > 0;
  return (
    <Modal onClose={onClose} label="Write your own quest">
      <form className="flex flex-col gap-3" onSubmit={(e) => { e.preventDefault(); if (!valid) return; ctx.setState((s) => addCustomQuest(s, { title, action, skill: skill.trim() || 'General', difficulty })); ctx.toast('🛠️ Quest added to “My Quests”.'); onClose(); }}>
        <h2 className="text-xl">Write your own quest</h2>
        <p className="text-sm text-ink2">Custom quests are worth half XP. The AI-crafted path stays your main road.</p>
        <label className="field">Title<input className="input" value={title} onChange={(e) => setTitle(e.target.value)} maxLength={100} placeholder="Bake sourdough" autoFocus /></label>
        <label className="field">What will you actually do?<textarea className="input" rows={2} value={action} onChange={(e) => setAction(e.target.value)} maxLength={400} placeholder="Mix, fold and bake one loaf." /></label>
        <label className="field">Skill<input className="input" value={skill} onChange={(e) => setSkill(e.target.value)} maxLength={40} placeholder="Cooking" list="skills" /><datalist id="skills">{ctx.state.skills.map((k) => <option key={k.id} value={k.name} />)}</datalist></label>
        <div role="radiogroup" aria-label="Difficulty" className="grid grid-cols-4 gap-2">{LEVELS.map((l) => <button type="button" key={l} role="radio" aria-checked={difficulty === l} onClick={() => setDifficulty(l)} className={`btn px-0 capitalize ${difficulty === l ? 'border-gold/60 bg-gold/15 text-gold' : ''}`}>{l}</button>)}</div>
        <div className="mt-1 flex gap-3"><button type="button" className="btn flex-1" onClick={onClose}>Cancel</button><button className="btn btn-gold flex-1" disabled={!valid}>Add quest</button></div>
      </form>
    </Modal>
  );
}
