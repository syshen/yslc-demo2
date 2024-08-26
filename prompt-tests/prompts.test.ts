import fs from 'fs';
import { AIService } from './ai_service';
import { OpenAIService } from './openai';
import { AnthropicAIService } from './anthropic';

class AIServiceFactory {
  static createService(type: 'openai' | 'anthropic'): AIService {
    switch (type) {
      case 'openai':
        return new OpenAIService();
      case 'anthropic':
        return new AnthropicAIService();
      default:
        throw new Error('Unsupported AI service type');
    }
  }
}

function extractJSON(text: string): string | null {
  const jsonRegex = /\{[\s\S]*\}/;
  const match = text.match(jsonRegex);

  if (match) {
    return match[0];
  }

  return null;
}

function tryJSONParse(text: string) {
  const jsonStr = extractJSON(text);
  if (jsonStr) {
    try {
      return JSON.parse(jsonStr);
    } catch(error) {
      console.error(text);
      throw error;
    }
  }
  return null;
}
async function chat_ai(type: 'openai' | 'anthropic', system_prompt: string, user_prompt: string, model?:string) {
  const service = AIServiceFactory.createService(type);
  return service.generateResponse({ system_prompt, prompt: user_prompt, model });
}

describe('test', () => {
  it('should work', () => {
    expect(1 + 1).toBe(2);
  });
});

describe('Test with order identification', () => {
  const system_prompt = fs.readFileSync('./system_prompt.txt', 'utf-8');

  it('Single product with OpenAI', async () => {
    const resp = await chat_ai('openai', system_prompt, '經典芥花油 3箱');
    expect(resp).toHaveProperty('message');

    const result = JSON.parse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].item).toBe('澳廚經典芥花油-20L');
    expect(result.orders[0].quantity).toBe(3);
    expect(result.orders[0].subtotal).toBe(15000);
    expect(result.elapsedTime).toBeLessThan(3000);
  });

  it('Single product with Anthropic', async () => {
    const resp = await chat_ai('anthropic', system_prompt, '經典芥花油 3箱');
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result.orders).toHaveLength(1);
    expect(result.orders[0].item).toBe('澳廚經典芥花油-20L');
    expect(result.orders[0].quantity).toBe(3);
    expect(result.orders[0].subtotal).toBe(15000);
    expect(result.elapsedTime).toBeLessThan(3000);
  });

  it('Minimal query with Anthropic', async () => {
    const resp = await chat_ai('anthropic', system_prompt, `大直：
需到貨
15L* 1
20L*2`);
    expect(resp).toHaveProperty('message');
    const result = JSON.parse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(2);
  });
});
