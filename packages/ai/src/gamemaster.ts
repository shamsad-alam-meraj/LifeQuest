import { fallbackAdventure, fallbackQuest, type AdventureDraft, type QuestDraft } from '@lifequest/core';
import { BOSS_NOTE, buildUserPrompt, DAILY_NOTE, SYSTEM_PROMPT, systemPrompt, type PromptInput } from './prompt';
import { complete, type Fetcher, type ProviderConfig } from './providers';
import { parseAdventure } from './schema';

export interface GenerateResult {
  draft: AdventureDraft;
  source: 'ai' | 'fallback';
  /** Why the fallback was used, if it was. */
  error?: string;
}

/** Generate an adventure. Retries once on malformed output, then falls back to the offline generator. */
export async function generateAdventure(input: PromptInput, cfg: ProviderConfig | null, f?: Fetcher): Promise<GenerateResult> {
  if (!cfg?.apiKey) return { draft: fallbackAdventure(input.goal, input.interests), source: 'fallback' };
  let lastError = '';
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const text = await complete(cfg, SYSTEM_PROMPT, buildUserPrompt(input), f);
      return { draft: parseAdventure(text), source: 'ai' };
    } catch (e) {
      lastError = e instanceof Error ? e.message : String(e);
      if (/provider error 4(01|03|29)/.test(lastError)) break; // auth / rate limit: retry won't help
    }
  }
  return { draft: fallbackAdventure(input.goal, input.interests), source: 'fallback', error: lastError };
}

export interface SingleQuestResult {
  quest: QuestDraft;
  source: 'ai' | 'fallback';
  error?: string;
}

/** One quest (daily, boss, or a re-roll). Never throws: falls back to the offline pool. */
export async function generateQuest(kind: 'daily' | 'boss' | 'reroll', input: PromptInput, cfg: ProviderConfig | null, f?: Fetcher): Promise<SingleQuestResult> {
  const fb = (error?: string): SingleQuestResult => ({ quest: fallbackQuest(kind === 'boss' ? 'boss' : 'daily'), source: 'fallback', error });
  if (!cfg?.apiKey) return fb();
  const note = kind === 'daily' ? DAILY_NOTE : kind === 'boss' ? BOSS_NOTE : 'Offer a different quest from the ones listed as recently completed.';
  try {
    const text = await complete(cfg, systemPrompt(1, note), buildUserPrompt(input), f);
    return { quest: parseAdventure(text).quests[0]!, source: 'ai' };
  } catch (e) {
    return fb(e instanceof Error ? e.message : String(e));
  }
}
