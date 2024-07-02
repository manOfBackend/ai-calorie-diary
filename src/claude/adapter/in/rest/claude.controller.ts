import {
  Controller,
  Post,
  Body,
  Res,
  ValidationPipe,
  HttpCode,
  HttpException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Response } from 'express';
import { ClaudeService } from '../../../application/service/claude.service';
import { PromptDto } from './dto/prompt.dto';

@Controller('claude')
export class ClaudeController {
  constructor(private readonly claudeService: ClaudeService) {}

  @Post('stream')
  @HttpCode(200)
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
      res.write(
        `data: ${JSON.stringify({
          error: 'An error occurred while streaming the response',
        })}\n\n`,
      );
    } finally {
      res.end();
    }
  }

  @Post()
  @HttpCode(200)
  async getSingleResponse(
    @Body(new ValidationPipe()) promptDto: PromptDto,
  ): Promise<{ content: string }> {
    try {
      const response = await this.claudeService.getSingleResponse(
        promptDto.prompt,
      );
      return { content: response.content };
    } catch (error) {
      if (error.response) {
        throw new HttpException(error.response.data, error.response.status);
      }
      throw new InternalServerErrorException('An unexpected error occurred');
    }
  }
}
