import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ClaudeTestModule } from './claude-test.module';

const runRealApiTests = process.env.RUN_REAL_API_TESTS === 'true';

describe.skip('ClaudeController (e2e)', () => {
  let app: INestApplication;

  (runRealApiTests ? describe : describe.skip)('With real API', () => {
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    it('/claude (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/claude')
        .send({ prompt: 'Hello, Claude!' })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('content');
      expect(typeof response.body.content).toBe('string');
      expect(response.body.content.length).toBeGreaterThan(0);
    }, 30000);

    it('/claude/stream (POST)', async () => {
      const response = await request(app.getHttpServer())
        .post('/claude/stream')
        .send({ prompt: 'Hello, Claude!' })
        .expect(200)
        .expect('Content-Type', 'text/event-stream');

      const events = response.text.split('\n\n').filter(Boolean);
      expect(events.length).toBeGreaterThan(0);

      events.forEach((event) => {
        const parsedEvent = JSON.parse(event.replace('data: ', ''));
        expect(parsedEvent).toHaveProperty('content');
        expect(typeof parsedEvent.content).toBe('string');
      });
    }, 30000);

    afterAll(async () => {
      await app.close();
    });
  });

  describe('With mock API', () => {
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [ClaudeTestModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    it('/claude (POST) with mock', async () => {
      const response = await request(app.getHttpServer())
        .post('/claude')
        .send({ prompt: 'Hello, Claude!' })
        .expect(200)
        .expect('Content-Type', /json/);

      expect(response.body).toHaveProperty('content');
      expect(response.body.content).toBe(
        'This is a mock response from Claude API.',
      );
    });

    it('/claude/stream (POST) with mock', async () => {
      const response = await request(app.getHttpServer())
        .post('/claude/stream')
        .send({ prompt: 'Hello, Claude!' })
        .expect(200)
        .expect('Content-Type', 'text/event-stream');

      const events = response.text.split('\n\n').filter(Boolean);
      expect(events.length).toBe(5); // We expect 5 mock responses

      const expectedResponses = [
        'Hello',
        ', how',
        ' can I',
        ' help you',
        ' today?',
      ];
      events.forEach((event, index) => {
        const parsedEvent = JSON.parse(event.replace('data: ', ''));
        expect(parsedEvent).toHaveProperty('content');
        expect(parsedEvent.content).toBe(expectedResponses[index]);
      });
    });

    afterAll(async () => {
      await app.close();
    });
  });
});
