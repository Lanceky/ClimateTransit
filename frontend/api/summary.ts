import type { VercelRequest, VercelResponse } from '@vercel/node';
import { createHash } from 'node:crypto';
import {
  SYSTEM_PROMPT,
  buildUserPrompt,
  templateFallback,
  type SummaryPayload,
} from '../server/prompts.js';

const MAX_BODY_BYTES = 8 * 1024;
const MAX_OUTPUT_TOKENS = 256;
const GEMINI_MODEL = 'gemini-2.0-flash';

// Best-effort in-memory cache (serverless instances do not share memory).
const cache = new Map<string, string>();

function hashPayload(p: SummaryPayload): string {
  return createHash('sha256').update(JSON.stringify(p)).digest('hex');
}

function validate(body: unknown): SummaryPayload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;
  if (typeof b.place !== 'string' || typeof b.zone_now !== 'string') return null;
  if (!Array.isArray(b.plan_items) || !Array.isArray(b.risks)) return null;
  if (b.plan_items.length > 12 || b.risks.length > 8) return null;
  return b as unknown as SummaryPayload;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' });
    return;
  }

  const raw = JSON.stringify(req.body ?? {});
  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    res.status(413).json({ error: 'payload_too_large' });
    return;
  }

  const payload = validate(req.body);
  if (!payload) {
    res.status(400).json({ error: 'invalid_payload' });
    return;
  }

  const key = hashPayload(payload);
  if (cache.has(key)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).json({ text: cache.get(key), model: GEMINI_MODEL, cached: true });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(200).json({ text: templateFallback(payload), model: 'template', cached: false });
    return;
  }

  try {
    const { GoogleGenAI } = await import('@google/genai');
    const ai = new GoogleGenAI({ apiKey });
    const result = await ai.models.generateContent({
      model: GEMINI_MODEL,
      contents: buildUserPrompt(payload),
      config: {
        systemInstruction: SYSTEM_PROMPT,
        maxOutputTokens: MAX_OUTPUT_TOKENS,
        temperature: 0.4,
      },
    });
    const text = (result.text ?? '').trim() || templateFallback(payload);
    cache.set(key, text);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    res.status(200).json({ text, model: GEMINI_MODEL, cached: false });
  } catch {
    // Never show fabricated values; fall back to the facts-only template.
    res.status(200).json({ text: templateFallback(payload), model: 'template', cached: false });
  }
}
