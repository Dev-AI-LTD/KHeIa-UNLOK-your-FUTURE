import { Express, Request, Response } from 'express';
import { speakText } from '../services/tts.service';
import { serviceAuth } from '../middleware/auth.middleware';

export const registerTtsRoutes = (app: Express) => {
  app.post('/api/tts/speak', serviceAuth, async (req: Request, res: Response) => {
    const { text } = req.body as { text?: string; chapterId?: string };

    if (typeof text !== 'string' || !text.trim()) {
      res.status(400).json({ error: 'Câmpul text este obligatoriu.' });
      return;
    }

    const result = await speakText(text);
    if (!result.ok) {
      res.status(result.status).json({ error: result.message });
      return;
    }

    res.setHeader('Content-Type', result.contentType);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    res.send(result.buffer);
  });
};
