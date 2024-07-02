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
          yield Buffer.from(
            'data: {"type":"content_block_delta","delta":{"text":"test response"}}\n\n',
          );
        },
      };
      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue({ data: mockStream }),
      });

      const result = adapter.streamResponse('test prompt');

      await expect(result).resolves.toBeDefined();
      const streamResult = await result;
      for await (const chunk of streamResult) {
        expect(chunk).toEqual({ content: 'test response' });
      }
    });
  });

  describe('singleResponse', () => {
    it('should return a single response', async () => {
      (axios.create as jest.Mock).mockReturnValue({
        post: jest.fn().mockResolvedValue({
          data: { content: [{ text: 'test response' }] },
        }),
      });

      const result = await adapter.singleResponse('test prompt');

      expect(result).toEqual({ content: 'test response' });
    });
  });
});
