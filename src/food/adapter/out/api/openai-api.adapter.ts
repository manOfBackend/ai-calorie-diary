import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OpenAIApiPort } from '@food/application/port/out/openai-api.port';
import { FoodAnalysis } from '@food/domain/food-analysis';

@Injectable()
export class OpenAIApiAdapter implements OpenAIApiPort {
  private openai: OpenAI;

  constructor(private configService: ConfigService) {
    this.openai = new OpenAI({
      apiKey: this.configService.getOrThrow<string>('OPENAI_API_KEY'),
      organization: this.configService.getOrThrow<string>('OPENAI_ORG_ID'),
      project: this.configService.getOrThrow<string>('OPENAI_PROJECT_ID'),
    });
  }

  async analyzeFood(
    image: Express.Multer.File,
    description: string,
  ): Promise<FoodAnalysis> {
    const response = await this.openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a food analysis AI. Analyze the food image and description, then provide a JSON response with the following structure:
          {
            "ingredients": string[],
            "totalCalories": number,
            "breakdown": {
              [ingredient: string]: number
            }
          }`,
        },
        {
          role: 'user',
          content: [
            {
              type: 'text',
              text: `Analyze this food image and the given description: ${description}. Provide ingredients, total calories, and calorie breakdown.`,
            },
            {
              type: 'image_url',
              image_url: {
                url: `data:${image.mimetype};base64,${image.buffer.toString(
                  'base64',
                )}`,
              },
            },
          ],
        },
      ],
      max_tokens: 500,
      response_format: { type: 'json_object' },
    });

    const analysisResult = JSON.parse(response.choices[0].message.content);
    return new FoodAnalysis(
      analysisResult.ingredients,
      analysisResult.totalCalories,
      analysisResult.breakdown,
    );
  }
}
