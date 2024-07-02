import { ClaudeResponse } from '../../../domain/claude-response';

export interface ClaudeApiPort {
  streamResponse(prompt: string): Promise<AsyncIterable<ClaudeResponse>>;
  singleResponse(prompt: string): Promise<ClaudeResponse>;
}
