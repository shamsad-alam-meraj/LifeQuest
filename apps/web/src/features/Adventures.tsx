'use client';

import { abandonQuest, isUnlocked, type Quest } from '@lifequest/core';
import { useState } from 'react';
import { useQuestFlows } from './QuestFlows';
import { QuestCard } from './QuestCard';
import { useQuestActions } from './questActions';
import type { Ctx } from './types';

export function Adventures(ctx: Ctx) {
  const { state, setState } = ctx;
  const actions = useQuestActions(ctx);
  const flows = useQuestFlows(ctx);
  const idx = (q: Quest) => state.skills.findIndex((k) => k.id === q.skillId);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-3xl">Adventures</h1>
      <div className="grid items-start gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,440px),1fr))]">
      {state.adventures.length === 0 && <div className="card text-center text-ink2">No adventures yet. Create one from Home.</div>}
      {state.adventures.map((a) => {
        const qs = state.quests.filter((q) => q.adventureId === a.id && q.status !== 'abandoned');
        const done = qs.filter((q) => q.status === 'completed').length;
        return (
          <section key={a.id} className="card flex flex-col gap-3" aria-label={a.title}>
            <div><h2 className="text-xl">{a.title}</h2><p className="mt-1 text-sm text-ink2 italic">{a.premise}</p></div>
            <div className="flex items-center gap-3"><div className="bar flex-1"><i style={{ width: `${qs.length ? (done / qs.length) * 100 : 0}%` }} /></div><span className="text-xs text-ink2">{done}/{qs.length}</span></div>
            {qs.map((q) => (
              <div key={q.id}>
                <QuestCard q={q} skillName={state.skills[idx(q)]?.name ?? ''} skillIndex={idx(q)} locked={!isUnlocked(state, q)} rerolling={actions.busy === q.id} onOpen={() => flows.openComplete(q)} onFocus={() => flows.openFocus(q)} onReroll={q.kind === 'custom' ? undefined : () => void actions.reroll(q)} />
                {q.status === 'active' && <button className="mt-1 ml-1 text-xs text-ink3 hover:text-ink2" onClick={() => setState((s) => abandonQuest(s, q.id))}>Skip this quest</button>}
              </div>
            ))}
          </section>
        );
      })}
      </div>
      {flows.node}
    </div>
  );
}
