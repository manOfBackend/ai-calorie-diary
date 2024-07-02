import { Injectable, Inject } from '@nestjs/common';
import { ClaudeUseCase } from '../port/in/claude.use-case';
import { ClaudeApiPort } from '../port/out/claude-api.port';
import { ClaudeResponse } from '../../domain/claude-response';

@Injectable()
export class ClaudeService implements ClaudeUseCase {
  constructor(
    @Inject('ClaudeApiPort')
    private readonly claudeApiPort: ClaudeApiPort,
  ) {}

  async getStreamingResponse(
    prompt: string,
  ): Promise<AsyncIterable<ClaudeResponse>> {
    return this.claudeApiPort.streamResponse(prompt);
  }

  async getSingleResponse(prompt: string): Promise<ClaudeResponse> {
    return this.claudeApiPort.singleResponse(prompt);
  }
}
