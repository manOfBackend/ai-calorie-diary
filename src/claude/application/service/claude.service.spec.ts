import { Test, TestingModule } from '@nestjs/testing';
import { ClaudeService } from './claude.service';
import { CLAUDE_API_PORT, ClaudeApiPort } from '../port/out/claude-api.port';

describe('ClaudeService', () => {
  let service: ClaudeService;
  let mockClaudeApiPort: jest.Mocked<ClaudeApiPort>;

  beforeEach(async () => {
    mockClaudeApiPort = {
      streamResponse: jest.fn(),
      singleResponse: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ClaudeService,
        {
          provide: CLAUDE_API_PORT,
          useValue: mockClaudeApiPort,
        },
      ],
    }).compile();

    service = module.get<ClaudeService>(ClaudeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStreamingResponse', () => {
    it('should call claudeApiPort.streamResponse', async () => {
      const mockStream = (async function* () {
        yield { content: 'test' };
      })();
      mockClaudeApiPort.streamResponse.mockResolvedValue(mockStream);

      const result = await service.getStreamingResponse('test prompt');

      expect(mockClaudeApiPort.streamResponse).toHaveBeenCalledWith(
        'test prompt',
      );
      expect(result).toBe(mockStream);
    });
  });

  describe('getSingleResponse', () => {
    it('should call claudeApiPort.singleResponse', async () => {
      const mockResponse = { content: 'test response' };
      mockClaudeApiPort.singleResponse.mockResolvedValue(mockResponse);

      const result = await service.getSingleResponse('test prompt');

      expect(mockClaudeApiPort.singleResponse).toHaveBeenCalledWith(
        'test prompt',
      );
      expect(result).toEqual(mockResponse);
    });
  });
});
