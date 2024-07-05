import { Injectable, Inject, Logger } from '@nestjs/common';
import { ClaudeUseCase } from '../port/in/claude.use-case';
import { ClaudeApiPort } from '../port/out/claude-api.port';
import { ClaudeResponse } from '../../domain/claude-response';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class ClaudeService implements ClaudeUseCase {
  private readonly logger = new Logger(ClaudeService.name);

  constructor(
    @Inject('ClaudeApiPort')
    private readonly claudeApiPort: ClaudeApiPort,
  ) {}

  @Cron(CronExpression.EVERY_5_SECONDS)
  async test() {
    this.logger.debug('Running cron job');
  }

  async getStreamingResponse(
    prompt: string,
  ): Promise<AsyncIterable<ClaudeResponse>> {
    return this.claudeApiPort.streamResponse(prompt);
  }

  async getSingleResponse(prompt: string): Promise<ClaudeResponse> {
    return this.claudeApiPort.singleResponse(prompt);
  }
}
