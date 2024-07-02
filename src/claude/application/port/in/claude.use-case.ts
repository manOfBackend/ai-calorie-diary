import { ClaudeResponse } from '../../../domain/claude-response';

export interface ClaudeUseCase {
  getStreamingResponse(prompt: string): Promise<AsyncIterable<ClaudeResponse>>;
  getSingleResponse(prompt: string): Promise<ClaudeResponse>;
}
