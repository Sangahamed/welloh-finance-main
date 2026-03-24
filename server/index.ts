import express from 'express';
import cors from 'cors';
import { GoogleGenAI } from '@google/genai';

const app = express();
app.use(cors());
app.use(express.json());

function getAI(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is not configured on the server.");
  }
  return new GoogleGenAI({ apiKey });
}

const cleanJsonString = (text: string): string => {
  let jsonText = text.trim();
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.substring(7, jsonText.length - 3).trim();
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.substring(3, jsonText.length - 3).trim();
  }
  return jsonText;
};

app.post('/api/gemini/generate', async (req, res) => {
  const { model, prompt, useSearch, stream } = req.body;
  if (!prompt || !model) {
    return res.status(400).json({ error: 'model and prompt are required' });
  }
  try {
    const ai = getAI();
    const config: any = {};
    if (useSearch) {
      config.tools = [{ googleSearch: {} }];
    }

    if (stream) {
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const responseStream = await ai.models.generateContentStream({
        model,
        contents: prompt,
        config,
      });

      for await (const chunk of responseStream) {
        const text = chunk.text;
        if (text) {
          res.write(`data: ${JSON.stringify({ text })}\n\n`);
        }
      }
      res.write('data: [DONE]\n\n');
      res.end();
    } else {
      const response = await ai.models.generateContent({
        model,
        contents: prompt,
        config,
      });
      const text = response.text;
      res.json({ text });
    }
  } catch (err: any) {
    console.error('Gemini proxy error:', err.message);
    const status = err.message?.includes('429') || err.message?.includes('RESOURCE_EXHAUSTED') ? 429 : 500;
    res.status(status).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
  console.log(`Gemini proxy server running on port ${PORT}`);
});
