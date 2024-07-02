import { Test, TestingModule } from '@nestjs/testing';
import { ClaudeController } from './claude.controller';
import { ClaudeService } from '../../../application/service/claude.service';
import { PromptDto } from './dto/prompt.dto';

describe('ClaudeController', () => {
  let controller: ClaudeController;
  let mockClaudeService: jest.Mocked<ClaudeService>;

  beforeEach(async () => {
    mockClaudeService = {
      getStreamingResponse: jest.fn(),
      getSingleResponse: jest.fn(),
      claudeApiPort: {
        streamResponse: jest.fn(),
        singleResponse: jest.fn(),
      },
    } as unknown as jest.Mocked<ClaudeService>;

    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClaudeController],
      providers: [
        {
          provide: ClaudeService,
          useValue: mockClaudeService,
        },
      ],
    }).compile();

    controller = module.get<ClaudeController>(ClaudeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getStreamingResponse', () => {
    it('should stream responses', async () => {
      const mockStream = (async function* () {
        yield { content: 'test response' };
      })();
      mockClaudeService.getStreamingResponse.mockResolvedValue(mockStream);

      const mockResponse = {
        setHeader: jest.fn(),
        write: jest.fn(),
        end: jest.fn(),
      };

      await controller.getStreamingResponse(
        { prompt: 'test prompt' } as PromptDto,
        mockResponse as any,
      );

      expect(mockClaudeService.getStreamingResponse).toHaveBeenCalledWith(
        'test prompt',
      );
      expect(mockResponse.setHeader).toHaveBeenCalledTimes(3);
      expect(mockResponse.write).toHaveBeenCalledWith(
        'data: {"content":"test response"}\n\n',
      );
      expect(mockResponse.end).toHaveBeenCalled();
    });
  });

  describe('getSingleResponse', () => {
    it('should return a single response', async () => {
      const mockResponse = { content: 'test response' };
      mockClaudeService.getSingleResponse.mockResolvedValue(mockResponse);

      const result = await controller.getSingleResponse({
        prompt: 'test prompt',
      } as PromptDto);

      expect(mockClaudeService.getSingleResponse).toHaveBeenCalledWith(
        'test prompt',
      );
      expect(result).toEqual({ content: 'test response' });
    });
  });
});
