export type ProviderId = 'gemini' | 'groq' | 'openrouter';

export interface ProviderConfig {
  provider: ProviderId;
  apiKey: string;
  model?: string;
}

export interface ProviderInfo {
  id: ProviderId;
  label: string;
  defaultModel: string;
  keyUrl: string;
}

export const PROVIDERS: ProviderInfo[] = [
  { id: 'gemini', label: 'Google Gemini (free tier)', defaultModel: 'gemini-3.8-flash', keyUrl: 'https://aistudio.google.com/apikey' },
  { id: 'groq', label: 'Groq (free tier)', defaultModel: 'llama-3.3-70b-versatile', keyUrl: 'https://console.groq.com/keys' },
  { id: 'openrouter', label: 'OpenRouter (free models)', defaultModel: 'meta-llama/llama-3.3-70b-instruct:free', keyUrl: 'https://openrouter.ai/keys' },
];

export type Fetcher = (url: string, init: RequestInit) => Promise<Response>;

async function ok(res: Response): Promise<Response> {
  if (!res.ok) throw new Error(`AI provider error ${res.status}: ${(await res.text()).slice(0, 200)}`);
  return res;
}

/** Calls the provider directly from the browser; the key never leaves the user's device except to that provider. */
export async function complete(cfg: ProviderConfig, system: string, user: string, f: Fetcher = fetch): Promise<string> {
  const info = PROVIDERS.find((p) => p.id === cfg.provider)!;
  const model = cfg.model || info.defaultModel;

  if (cfg.provider === 'gemini') {
    const res = await ok(
      await f(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-goog-api-key': cfg.apiKey },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: system }] },
          contents: [{ role: 'user', parts: [{ text: user }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.9 },
        }),
      }),
    );
    const j = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
    const text = j.candidates?.[0]?.content?.parts?.map((p) => p.text ?? '').join('');
    if (!text) throw new Error('Empty response from Gemini');
    return text;
  }

  const url = cfg.provider === 'groq' ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://openrouter.ai/api/v1/chat/completions';
  const res = await ok(
    await f(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${cfg.apiKey}` },
      body: JSON.stringify({
        model,
        temperature: 0.9,
        messages: [
          { role: 'system', content: system },
          { role: 'user', content: user },
        ],
      }),
    }),
  );
  const j = (await res.json()) as { choices?: { message?: { content?: string } }[] };
  const text = j.choices?.[0]?.message?.content;
  if (!text) throw new Error('Empty response from provider');
  return text;
}
