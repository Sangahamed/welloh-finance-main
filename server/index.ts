import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

let _ai: GoogleGenAI | null = null;
function getAI(): GoogleGenAI {
  if (_ai) return _ai;
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY n'est pas configuré sur le serveur.");
  _ai = new GoogleGenAI({ apiKey });
  return _ai;
}

// Ordered list of models to try. 1.5 models removed — deprecated since early 2025.
const FALLBACK_CHAIN = [
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-2.0-flash-exp',
];

// Extract a clean error object from whatever the SDK throws
function parseSDKError(err: any): { code: number; message: string } {
  // The SDK often throws: Error with message = raw JSON string
  if (err?.message) {
    try {
      const parsed = JSON.parse(err.message);
      // Handles { error: { code, message } } and { error: <string> }
      if (parsed?.error?.code) return { code: parsed.error.code, message: parsed.error.message };
      if (parsed?.error) return { code: 500, message: String(parsed.error) };
    } catch {}
  }
  return { code: 500, message: err?.message || 'Erreur inconnue' };
}

function isQuotaError(err: any): boolean {
  const { code, message } = parseSDKError(err);
  return code === 429 || message.includes('RESOURCE_EXHAUSTED') || message.includes('quota');
}

function isNotFoundError(err: any): boolean {
  const { code, message } = parseSDKError(err);
  return code === 404 || message.includes('NOT_FOUND') || message.includes('not found');
}

function buildUserErrorMessage(err: any): { message: string; status: number } {
  if (isQuotaError(err)) {
    return {
      status: 429,
      message:
        "Quota API Gemini épuisé. Veuillez créer ou vérifier votre clé API sur https://aistudio.google.com et la mettre à jour dans les paramètres du projet. Le quota se réinitialise chaque minute pour les requêtes par minute, et chaque jour pour les quotas journaliers.",
    };
  }
  const { message } = parseSDKError(err);
  return { status: 500, message };
}

async function tryGenerate(model: string, prompt: string, useSearch: boolean): Promise<string> {
  const config: any = {};
  if (useSearch) config.tools = [{ googleSearch: {} }];
  const response = await getAI().models.generateContent({ model, contents: prompt, config });
  const text = response.text;
  if (!text) throw new Error('Réponse vide reçue du modèle.');
  return text;
}

app.post('/api/gemini/generate', async (req, res) => {
  const { model: requestedModel, prompt, useSearch, stream } = req.body;

  if (!prompt || !requestedModel) {
    return res.status(400).json({ error: 'Les champs model et prompt sont requis.' });
  }

  // Build the chain starting from the requested model
  const startIdx = FALLBACK_CHAIN.indexOf(requestedModel);
  const chain = startIdx >= 0
    ? FALLBACK_CHAIN.slice(startIdx)
    : [requestedModel, ...FALLBACK_CHAIN];

  // ── Streaming ───────────────────────────────────────────────────────────────
  if (stream) {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    for (let i = 0; i < chain.length; i++) {
      const model = chain[i];
      const isLast = i === chain.length - 1;
      try {
        const config: any = {};
        if (useSearch) config.tools = [{ googleSearch: {} }];
        const responseStream = await getAI().models.generateContentStream({ model, contents: prompt, config });
        for await (const chunk of responseStream) {
          if (chunk.text) res.write(`data: ${JSON.stringify({ text: chunk.text })}\n\n`);
        }
        console.log(`[Gemini Stream] ✓ ${model}`);
        res.write('data: [DONE]\n\n');
        return res.end();
      } catch (err: any) {
        const skip = (isQuotaError(err) || isNotFoundError(err)) && !isLast;
        if (skip) {
          console.warn(`[Gemini Stream] ${model} skipped (${isQuotaError(err) ? 'quota' : '404'}), trying next...`);
          continue;
        }
        const { message } = buildUserErrorMessage(err);
        console.error(`[Gemini Stream] Failed on ${model}:`, parseSDKError(err));
        res.write(`data: ${JSON.stringify({ error: message })}\n\n`);
        res.write('data: [DONE]\n\n');
        return res.end();
      }
    }
    res.write('data: [DONE]\n\n');
    return res.end();
  }

  // ── Non-streaming ───────────────────────────────────────────────────────────
  let lastErr: any = null;
  for (let i = 0; i < chain.length; i++) {
    const model = chain[i];
    const isLast = i === chain.length - 1;
    try {
      const text = await tryGenerate(model, prompt, useSearch ?? false);
      console.log(`[Gemini] ✓ ${model}`);
      return res.json({ text, model });
    } catch (err: any) {
      lastErr = err;
      const skip = (isQuotaError(err) || isNotFoundError(err)) && !isLast;
      if (skip) {
        console.warn(`[Gemini] ${model} skipped (${isQuotaError(err) ? 'quota' : '404'}), trying next...`);
        continue;
      }
      break;
    }
  }

  const { status, message } = buildUserErrorMessage(lastErr);
  console.error('[Gemini] All models failed:', parseSDKError(lastErr));
  return res.status(status).json({ error: message });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Serveur proxy Gemini démarré sur le port ${PORT}`);
  console.log(`Clé API: ${process.env.GEMINI_API_KEY ? `✓ configurée (${process.env.GEMINI_API_KEY.length} car.)` : '✗ MANQUANTE'}`);
  console.log(`Chaîne de fallback: ${FALLBACK_CHAIN.join(' → ')}`);
});
