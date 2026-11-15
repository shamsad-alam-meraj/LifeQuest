import { z } from 'zod';
import type { AdventureDraft } from '@lifequest/core';

export const AdventureSchema = z.object({
  title: z.string().min(1).max(120),
  premise: z.string().min(1).max(600),
  quests: z
    .array(
      z.object({
        title: z.string().min(1).max(100),
        story: z.string().min(1).max(400),
        action: z.string().min(1).max(400),
        skill: z.string().min(1).max(40),
        difficulty: z.enum(['easy', 'medium', 'hard', 'epic']),
      }),
    )
    .min(1)
    .max(8),
});

/** Extract the first JSON object from model text (handles ```json fences and chatter). */
export function parseAdventure(text: string): AdventureDraft {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start < 0 || end <= start) throw new Error('No JSON object in model response');
  return AdventureSchema.parse(JSON.parse(text.slice(start, end + 1)));
}
