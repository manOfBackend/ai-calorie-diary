import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosRequestConfig } from 'axios';
import { ClaudeApiPort } from '../../../application/port/out/claude-api.port';
import { ClaudeResponse } from '../../../domain/claude-response';

@Injectable()
export class ClaudeApiAdapter implements ClaudeApiPort {
  private readonly API_KEY: string;
  private readonly API_URL = 'https://api.anthropic.com/v1/messages';

  constructor(private configService: ConfigService) {
    this.API_KEY = this.configService.get<string>('CLAUDE_API_KEY');
  }

  private createAxiosConfig(
    prompt: string,
    stream: boolean,
  ): AxiosRequestConfig {
    return {
      method: 'post',
      url: this.API_URL,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.API_KEY,
      },
      data: {
        prompt,
        model: 'claude-3-sonnet-20240229',
        max_tokens_to_sample: 300,
        stream,
      },
      responseType: stream ? 'stream' : 'json',
    } as AxiosRequestConfig;
  }

  async streamResponse(prompt: string): Promise<AsyncIterable<ClaudeResponse>> {
    const config = this.createAxiosConfig(prompt, true);
    const response = await axios(config);

    return (async function* () {
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.completion) {
              yield { content: data.completion };
            }
          }
        }
      }
    })();
  }

  async singleResponse(prompt: string): Promise<ClaudeResponse> {
    const config = this.createAxiosConfig(prompt, false);
    const response = await axios(config);
    return { content: response.data.completion };
  }
}
