import { Express, Request, Response } from 'express';
import { generateChapter } from '../controllers/chapter.controller';
import { generateQuiz } from '../controllers/quiz.controller';
import { generateTest } from '../controllers/test.controller';
import { chatENBAC } from '../services/chat.service';
import { serviceAuth } from '../middleware/auth.middleware';

export const registerGenerateRoutes = (app: Express) => {
  app.post('/api/generate/chapter', serviceAuth, async (req: Request, res: Response) => {
    const result = await generateChapter(req.body);
    res.json(result);
  });

  app.post('/api/generate/summary', serviceAuth, async (req: Request, res: Response) => {
    const result = await generateChapter({ ...req.body, summaryOnly: true });
    res.json(result);
  });

  app.post('/api/generate/quiz', serviceAuth, async (req: Request, res: Response) => {
    const result = await generateQuiz(req.body);
    res.json(result);
  });

  app.post('/api/generate/test', serviceAuth, async (req: Request, res: Response) => {
    const result = await generateTest(req.body);
    res.json(result);
  });

  app.post('/api/generate/chat', serviceAuth, async (req: Request, res: Response) => {
    try {
      const { messages } = req.body as { messages: Array<{ role: string; content: string }> };
      const result = await chatENBAC(messages ?? []);
      res.json(result);
    } catch (err) {
      res.status(500).json({ error: 'Chat unavailable', content: '' });
    }
  });
};
