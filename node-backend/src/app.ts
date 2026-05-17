import dotenv from 'dotenv';
import { resolve } from 'path';

// Încarcă .env: node-backend, root, supabase (cel din supabase/ conține OPENAI_API_KEY)
const root = resolve(process.cwd(), '..');
dotenv.config({ path: resolve(process.cwd(), '.env') });
dotenv.config({ path: resolve(root, '.env') });
dotenv.config({ path: resolve(root, 'supabase', '.env') });

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import pinoHttp from 'pino-http';

import { registerGenerateRoutes } from './routes/generate.routes';
import { registerHealthRoutes } from './routes/health.routes';
import { registerTtsRoutes } from './routes/tts.routes';

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(pinoHttp());

app.get('/', (_req, res) => {
  res.send('Welcome to KHEYA - Unlock Your Future!');
});

registerHealthRoutes(app);
registerGenerateRoutes(app);
registerTtsRoutes(app);

/** Exported for integration tests (supertest). */
export { app };

const port = process.env.PORT ? Number(process.env.PORT) : 8080;

if (process.env.NODE_ENV !== 'test') {
  app.listen(port, () => {
    // eslint-disable-next-line no-console
    console.log(`Node backend listening on ${port}`);
  });
}
