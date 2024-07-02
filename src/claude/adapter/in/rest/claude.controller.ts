import { Controller, Post, Body, Res, ValidationPipe } from '@nestjs/common';
import { Response } from 'express';
import { ClaudeService } from '../../../application/service/claude.service';
import { PromptDto } from './dto/prompt.dto';

@Controller('claude')
export class ClaudeController {
  constructor(private readonly claudeService: ClaudeService) {}

  @Post('stream')
  async getStreamingResponse(
    @Body(new ValidationPipe()) promptDto: PromptDto,
    @Res() res: Response,
  ): Promise<void> {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    try {
      const stream = await this.claudeService.getStreamingResponse(
        promptDto.prompt,
      );
      for await (const chunk of stream) {
        res.write(`data: ${JSON.stringify(chunk)}\n\n`);
      }
    } catch (error) {
      console.error('Streaming error:', error);
      res
        .status(500)
        .json({ error: 'An error occurred while streaming the response' });
    } finally {
      res.end();
    }
  }

  @Post()
  async getSingleResponse(
    @Body(new ValidationPipe()) promptDto: PromptDto,
  ): Promise<{ content: string }> {
    return this.claudeService.getSingleResponse(promptDto.prompt);
  }
}
