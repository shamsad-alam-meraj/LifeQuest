'use client';

import { addFocusMinutes, type Quest } from '@lifequest/core';
import { useState } from 'react';
import { CompleteFlow } from './CompleteFlow';
import { FocusTimer } from './FocusTimer';
import type { Ctx } from './types';

/** Owns the "complete quest" and "focus timer" dialogs so any page can open them for a quest. */
export function useQuestFlows(ctx: Ctx) {
  const [complete, setComplete] = useState<Quest | null>(null);
  const [focus, setFocus] = useState<Quest | null>(null);
  const node = (
    <>
      {complete && <CompleteFlow quest={complete} ctx={ctx} onClose={() => setComplete(null)} />}
      {focus && (
        <FocusTimer
          quest={focus}
          onClose={() => setFocus(null)}
          onDone={(minutes) => { ctx.setState((s) => addFocusMinutes(s, minutes)); setComplete(focus); setFocus(null); }}
        />
      )}
    </>
  );
  return { openComplete: setComplete, openFocus: setFocus, node };
}
