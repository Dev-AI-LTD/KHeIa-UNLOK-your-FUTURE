/**
 * Node-backend API integration tests.
 * Mocks AI and chat services so no real OpenAI calls are made.
 */
import request from 'supertest';

jest.mock('../services/ai.service', () => ({
  generateWithLLM: jest.fn().mockResolvedValue({
    source: 'openai',
    prompt: '',
    meta: {},
    content: 'Mocked generated content',
  }),
}));

jest.mock('../services/chat.service', () => ({
  chatENBAC: jest.fn().mockResolvedValue({ content: 'Mocked chat reply' }),
}));

jest.mock('../services/tts.service', () => ({
  speakText: jest.fn().mockResolvedValue({
    ok: true,
    buffer: Buffer.from('mock-mp3'),
    contentType: 'audio/mpeg',
  }),
  cleanTextForTts: jest.fn((t: string) => t.trim()),
}));

import { app } from '../app';

describe('Node-backend API', () => {
  describe('GET /', () => {
    it('returns welcome message', async () => {
      const res = await request(app).get('/');
      expect(res.status).toBe(200);
      expect(res.text).toContain('KHEYA');
      expect(res.text).toContain('Unlock Your Future');
    });
  });

  describe('GET /api/health', () => {
    it('returns status ok and openaiConfigured flag', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('status', 'ok');
      expect(res.body).toHaveProperty('openaiConfigured');
      expect(typeof res.body.openaiConfigured).toBe('boolean');
    });
  });

  describe('POST /api/generate/chapter', () => {
    it('returns 200 and generated content when topic is provided', async () => {
      const res = await request(app)
        .post('/api/generate/chapter')
        .send({ topic: 'Fotosinteza', level: 'gimnaziu' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content', 'Mocked generated content');
      expect(res.body).toHaveProperty('source', 'openai');
    });

    it('returns error when topic is missing', async () => {
      const res = await request(app)
        .post('/api/generate/chapter')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body.content).toContain('Lipsește topic-ul');
      expect(res.body.source).toBe('error');
    });

    it('returns error when topic is empty string', async () => {
      const res = await request(app)
        .post('/api/generate/chapter')
        .send({ topic: '   ' });
      expect(res.status).toBe(200);
      expect(res.body.content).toContain('Lipsește topic-ul');
    });
  });

  describe('POST /api/generate/summary', () => {
    it('returns 200 and content with summaryOnly', async () => {
      const res = await request(app)
        .post('/api/generate/summary')
        .send({ topic: 'Rezumat Română', summaryOnly: true });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content');
    });
  });

  describe('POST /api/generate/quiz', () => {
    it('returns 200 and generated quiz content', async () => {
      const res = await request(app)
        .post('/api/generate/quiz')
        .send({ chapter_id: 'ch-1', topic: 'Algebra' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content', 'Mocked generated content');
    });
  });

  describe('POST /api/generate/test', () => {
    it('returns 200 and generated test content', async () => {
      const res = await request(app)
        .post('/api/generate/test')
        .send({ exam_type: 'EN', level: 'gimnaziu' });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content');
    });
  });

  describe('POST /api/tts/speak', () => {
    it('returns audio/mpeg when text is provided', async () => {
      const res = await request(app)
        .post('/api/tts/speak')
        .send({ text: 'Fotosinteza este procesul prin care plantele produc oxigen.' });
      expect(res.status).toBe(200);
      expect(res.headers['content-type']).toMatch(/audio\/mpeg/);
    });

    it('returns 400 when text is missing', async () => {
      const res = await request(app).post('/api/tts/speak').send({});
      expect(res.status).toBe(400);
      expect(res.body).toHaveProperty('error');
    });
  });

  describe('POST /api/generate/chat', () => {
    it('returns 200 and chat content when messages are sent', async () => {
      const res = await request(app)
        .post('/api/generate/chat')
        .send({
          messages: [{ role: 'user', content: 'Ce este fotosinteza?' }],
        });
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content', 'Mocked chat reply');
    });

    it('returns 200 with empty or default content when messages missing', async () => {
      const res = await request(app)
        .post('/api/generate/chat')
        .send({});
      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('content');
    });
  });
});
