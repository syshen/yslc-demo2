import Anthropic from '@anthropic-ai/sdk';
import dotenv from 'dotenv';
import { AIService } from './ai_service';

dotenv.config();

export class AnthropicAIService implements AIService {
  private client: Anthropic;

  constructor() {
    this.client = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });
  }

  async generateResponse(
    { system_prompt, prompt, model = 'claude-3-5-sonnet-20240620' }:
    { system_prompt: string, prompt: string, model?: string }
): Promise<{ message: string | null, elapsedTime: number }> {
    const start = performance.now();
    const chatCompletion = await this.client.messages.create({
        max_tokens: 1024,
        system: [{
          text: system_prompt,
          type: 'text',
        }],
        messages: [
          { role: 'user', content: prompt },
        ],
        model,
      });
      const end = performance.now();
      const elapsedTime = end - start;
      return {
        message: (chatCompletion.content[0] as Anthropic.TextBlock).text,
        elapsedTime,
      };
  }
}
