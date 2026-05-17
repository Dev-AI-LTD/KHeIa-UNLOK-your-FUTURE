import { Express, Request, Response } from 'express';

export const registerHealthRoutes = (app: Express) => {
  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({
      status: 'ok',
      openaiConfigured: !!process.env.OPENAI_API_KEY,
      ttsRoute: true,
    });
  });
};
