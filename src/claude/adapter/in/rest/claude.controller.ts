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
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ClaudeService } from '@claude/application/service/claude.service';
import { ClaudeResponseDto } from '@claude/adapter/in/rest/dto/claude-response.dto';
import { PromptDto } from '@claude/adapter/in/rest/dto/prompt.dto';

@ApiTags('claude')
@Controller('claude')
export class ClaudeController {
  constructor(private readonly claudeService: ClaudeService) {}

  @Post('stream')
  @HttpCode(200)
  @ApiOperation({ summary: 'Get streaming response from Claude' })
  @ApiBody({ type: PromptDto })
  @ApiResponse({ status: 200, description: 'Streaming response from Claude' })
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
  @ApiOperation({ summary: 'Get single response from Claude' })
  @ApiBody({ type: PromptDto })
  @ApiResponse({
    status: 200,
    description: 'Single response from Claude',
    type: ClaudeResponseDto,
  })
  async getSingleResponse(
    @Body(new ValidationPipe()) promptDto: PromptDto,
  ): Promise<ClaudeResponseDto> {
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
