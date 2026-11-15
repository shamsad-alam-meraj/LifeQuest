export interface PromptInput {
  goal: string;
  interests: string[];
  existingSkills: string[];
  /** Recent completed quest titles, so the AI can scale difficulty and avoid repeats. */
  recentCompleted: string[];
}

export function systemPrompt(count = 5, note = ''): string {
  return `You are the Game Master of LifeQuest, an app that turns REAL-LIFE goals into adventures.
Rules:
- Every quest must be a concrete, doable, real-world action (never "open the app").
- Quests must take 10-90 minutes. Prefer offline actions. The game must make life more meaningful, not consume more screen time.
- Story text is short, vivid, fantasy-flavoured, but the "action" is plain and specific.
- Reuse existing skill names when they fit; otherwise invent short skill names (1-2 words).
- Scale difficulty to the player's history. Mix easy/medium/hard; "epic" is rare.
- Respond with ONLY valid JSON, no prose, matching:
{"title":string,"premise":string,"quests":[{"title":string,"story":string,"action":string,"skill":string,"difficulty":"easy"|"medium"|"hard"|"epic"}]}
Generate exactly ${count} quest${count === 1 ? '' : 's'}${count > 1 ? ' that form a progression' : ''}.${note ? ' ' + note : ''}`;
}

export const SYSTEM_PROMPT = systemPrompt(5);

export const DAILY_NOTE = 'This is the player\'s "quest of the day": small, achievable today, varied from recent quests.';
export const BOSS_NOTE = 'This is the weekly BOSS quest: a meaningful challenge for the week, difficulty "hard" or "epic", still doable in under 90 minutes of focused effort.';

export function buildUserPrompt(i: PromptInput): string {
  return [
    `Goal: ${i.goal}`,
    `Interests: ${i.interests.join(', ') || 'none given'}`,
    `Existing skills: ${i.existingSkills.join(', ') || 'none yet'}`,
    `Recently completed: ${i.recentCompleted.slice(-8).join('; ') || 'nothing yet'}`,
  ].join('\n');
}
