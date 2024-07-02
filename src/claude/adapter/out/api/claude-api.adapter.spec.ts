import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { ClaudeApiAdapter } from './claude-api.adapter';

jest.mock('axios');

describe('ClaudeApiAdapter', () => {
  let adapter: ClaudeApiAdapter;
  let mockConfigService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('mock-api-key'),
    } as any;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaudeApiAdapter,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    adapter = module.get<ClaudeApiAdapter>(ClaudeApiAdapter);
  });

  it('should be defined', () => {
    expect(adapter).toBeDefined();
  });

  describe('streamResponse', () => {
    it('should return a stream of responses', async () => {
      const mockStream = {
        [Symbol.asyncIterator]: async function* () {
          yield Buffer.from('data: {"completion": "test response"}\n\n');
        },
      };
      (axios as jest.MockedFunction<typeof axios>).mockResolvedValue({
        data: mockStream,
      });

      const result = adapter.streamResponse('test prompt');

      await expect(result).resolves.toBeDefined();
      const streamResult = await result;
      for await (const chunk of streamResult) {
        expect(chunk).toEqual({ content: 'test response' });
      }

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://api.anthropic.com/v1/complete',
          headers: expect.objectContaining({
            'X-API-Key': 'mock-api-key',
          }),
          data: expect.objectContaining({
            prompt: 'test prompt',
            stream: true,
          }),
          responseType: 'stream',
        }),
      );
    });
  });

  describe('singleResponse', () => {
    it('should return a single response', async () => {
      (axios as jest.MockedFunction<typeof axios>).mockResolvedValue({
        data: { completion: 'test response' },
      });

      const result = await adapter.singleResponse('test prompt');

      expect(axios).toHaveBeenCalledWith(
        expect.objectContaining({
          method: 'post',
          url: 'https://api.anthropic.com/v1/complete',
          headers: expect.objectContaining({
            'X-API-Key': 'mock-api-key',
          }),
          data: expect.objectContaining({
            prompt: 'test prompt',
            stream: false,
          }),
          responseType: 'json',
        }),
      );

      expect(result).toEqual({ content: 'test response' });
    });
  });
});
