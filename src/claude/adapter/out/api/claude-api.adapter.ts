import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import { Effect, Stream, pipe } from 'effect';
import { ClaudeApiPort } from '../../../application/port/out/claude-api.port';
import { ClaudeResponse } from '../../../domain/claude-response';

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
    const streamEffect = pipe(
      Effect.tryPromise(() => {
        const body = this.createRequestBody(prompt, true);
        const axiosInstance = this.createAxiosInstance();
        return axiosInstance.post('', body, { responseType: 'stream' });
      }),
      Effect.flatMap((response) =>
        Stream.fromAsyncIterable(
          response.data,
          (error) => new Error(`Error in async iterable: ${error}`),
        ).pipe(
          Stream.flatMap((chunk) =>
            Stream.fromIterable(chunk.toString().split('\n').filter(Boolean)),
          ),
          Stream.filter((line) => line.startsWith('data: ')),
          Stream.map((line) => JSON.parse(line.slice(6))),
          Stream.filter(
            (data) => data.type === 'content_block_delta' && data.delta?.text,
          ),
          Stream.map(
            (data) => ({ content: data.delta.text }) as ClaudeResponse,
          ),
          Stream.runCollect,
        ),
      ),
      Effect.catchAll((error) =>
        Effect.fail(new Error(`Failed to stream response: ${error}`)),
      ),
    );

    return Effect.runPromise(
      Effect.map(streamEffect, (chunk) => ({
        [Symbol.asyncIterator]: async function* () {
          for (const item of chunk) {
            yield item;
          }
        },
      })),
    );
  }

  async singleResponse(prompt: string): Promise<ClaudeResponse> {
    const singleEffect = pipe(
      Effect.tryPromise(() => {
        const body = this.createRequestBody(prompt, false);
        const axiosInstance = this.createAxiosInstance();
        return axiosInstance.post('', body);
      }),
      Effect.map(
        (response) =>
          ({ content: response.data.content[0].text }) as ClaudeResponse,
      ),
      Effect.catchAll((error) =>
        Effect.fail(new Error(`Failed to get single response: ${error}`)),
      ),
    );

    return Effect.runPromise(singleEffect);
  }
}
