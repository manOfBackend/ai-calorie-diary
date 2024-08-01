import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { ClaudeApiPort } from '@claude/application/port/out/claude-api.port';
import { ClaudeResponse } from '@claude/domain/claude-response';

@Injectable()
export class ClaudeApiAdapter implements ClaudeApiPort {
  private readonly API_KEY: string;
  private readonly API_URL = 'https://api.anthropic.com/v1/messages';

  constructor(private configService: ConfigService) {
    this.API_KEY = this.configService.get<string>('CLAUDE_API_KEY');
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.API_URL,
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.API_KEY,
        'anthropic-version': '2023-06-01',
      },
    });
  }

  private createRequestBody(prompt: string, stream: boolean) {
    return {
      model: 'claude-3-sonnet-20240229',
      max_tokens: 1024,
      messages: [{ role: 'user', content: prompt }],
      stream,
    };
  }

  async streamResponse(prompt: string): Promise<AsyncIterable<ClaudeResponse>> {
    const body = this.createRequestBody(prompt, true);
    const axiosInstance = this.createAxiosInstance();
    const response = await axiosInstance.post('', body, {
      responseType: 'stream',
    });

    return (async function* () {
      for await (const chunk of response.data) {
        const lines = chunk.toString().split('\n').filter(Boolean);
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              yield { content: data.delta.text };
            }
          }
        }
      }
    })();
  }

  async singleResponse(prompt: string): Promise<ClaudeResponse> {
    const body = this.createRequestBody(prompt, false);
    const axiosInstance = this.createAxiosInstance();
    const response = await axiosInstance.post('', body);
    const content = response.data.content[0].text;
    return { content };
  }
}
