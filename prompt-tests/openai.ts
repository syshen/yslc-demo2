import OpenAI from 'openai';
import dotenv from 'dotenv';
import { AIService } from './ai_service';

dotenv.config();

export class OpenAIService implements AIService {
  private client: OpenAI;

  constructor() {
    this.client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY || '',
    });
  }

  async generateResponse(
    { system_prompt, prompt, model = 'gpt-4o-mini' }:
    { system_prompt: string, prompt: string, model?: string }
): Promise<{ message: string | null, elapsedTime: number }> {
    const start = performance.now();
    const chatCompletion = await this.client.chat.completions.create({
        messages: [
          { role: 'system', content: system_prompt },
          { role: 'user', content: prompt },
        ],
        model,
      });
      const end = performance.now();
      const elapsedTime = end - start;
      return {
        message: chatCompletion.choices[0].message.content,
        elapsedTime,
      };
  }
}
