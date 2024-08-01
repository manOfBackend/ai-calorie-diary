import { ClaudeResponse } from '@claude/domain/claude-response';

export interface ClaudeUseCase {
  getStreamingResponse(prompt: string): Promise<AsyncIterable<ClaudeResponse>>;
  getSingleResponse(prompt: string): Promise<ClaudeResponse>;
}
