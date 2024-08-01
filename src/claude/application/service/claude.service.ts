import { Injectable, Inject } from '@nestjs/common';
import { ClaudeResponse } from '@claude/domain/claude-response';
import {
  CLAUDE_API_PORT,
  ClaudeApiPort,
} from '@claude/application/port/out/claude-api.port';
import { ClaudeUseCase } from '@claude/application/port/in/claude.use-case';

@Injectable()
export class ClaudeService implements ClaudeUseCase {
  constructor(
    @Inject(CLAUDE_API_PORT)
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
