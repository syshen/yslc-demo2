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
      console.error(jsonStr);
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

const SECONDS = 1000;
const timeout = 15;

describe('Test with order identification', () => {
  const system_prompt = fs.readFileSync('./system_prompt.txt', 'utf-8');
  const testCases:[string, number][] = [
    ['經典芥花油 3箱', 1],
    [`麻煩2店\n週五要6箱芥花油\n謝謝🙏`, 1],
    [`麻煩一店\n週五要6箱芥花油\n謝謝🙏`, 1],
    [`麻煩了\n芥花油20公升1箱\n麻煩週五下午2:00後到貨 感恩`, 1],
    [`赤峰送\n\n芥花油2箱，麻煩算9月帳款\n\n謝謝`, 1],
    [`麻煩協助更正以下\n7/29赤峰店叫貨芥花油未提供貨單\n\n`, 0],
    [`您好，不好意思\n之後我們的貨品都麻煩安排在下午2:00-4:00到貨\n謝謝🙏`, 0],
  ];

  it.each(testCases)("Identify single order message %# for %s with OpenAI", async (message, expected_orders) => {
    const resp = await chat_ai('openai', system_prompt, message);
    expect(resp).toHaveProperty('message');

    const result = JSON.parse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(expected_orders);
    // expect(result.orders[0].item).toBe('澳廚經典芥花油-20L');
    // expect(result.orders[0].quantity).toBe(3);
    // expect(result.orders[0].subtotal).toBe(15000);
  }, 10 * SECONDS);

  it.each(testCases)("Identify single order message %# for %s with Anthropic", async (message, expected_orders) => {
    const resp = await chat_ai('anthropic', system_prompt, message);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result.orders).toHaveLength(expected_orders);
    // expect(result.orders[0].item).toBe('澳廚經典芥花油-20L');
    // expect(result.orders[0].quantity).toBe(3);
    // expect(result.orders[0].subtotal).toBe(15000);
    // expect(result.elapsedTime).toBeLessThan(3000);
  }, timeout * SECONDS);
});

describe('Test multiple orders identification', () => {
  const system_prompt = fs.readFileSync('./system_prompt.txt', 'utf-8');
  const testCases:[string, number][] = [
    [`天母店麻煩送\n\n椰子汽泡水1箱\n\n豆奶7箱\n\n杏仁奶3箱\n\n謝謝`, 3],
    [`赤峰店叫貨\n\n椰子氣泡水一箱\n\n覆盆莓康普茶\n\n檸檬薄荷康普茶\n\n各兩箱\n\n伯爵茶補充包\n舒壓茶補充包\n各一包\n\n謝謝`, 5],
  ];

  it.each(testCases)('Multiple orders identification for %s with OpenAI', async (message, expected_orders) => {
    const resp = await chat_ai('openai', system_prompt, message);
    expect(resp).toHaveProperty('message');

    const result = JSON.parse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(expected_orders);
  }, timeout * SECONDS);

  it.each(testCases)('Multiple orders identification for %s with Anthropic', async (message, expected_orders) => {
    const resp = await chat_ai('anthropic', system_prompt, message);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result.orders).toHaveLength(expected_orders);
  }, timeout * SECONDS);
});

describe('Test orders identification - similar product offerings', () => {
  const system_prompt = fs.readFileSync('./system_prompt-2.txt', 'utf-8');
  it('Minimal query with OpenAI', async () => {
    const resp = await chat_ai('openai', system_prompt, `大直：\n需到貨\n15L* 1\n20L*2`);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(2);
  }, timeout * SECONDS);

  it('Minimal query with Anthropic', async () => {
    const resp = await chat_ai('anthropic', system_prompt, `大直：\n需到貨\n15L* 1\n20L*2`);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(2);
  }, timeout * SECONDS);
});

describe('Test orders identification - oil only', () => {
  const system_prompt = fs.readFileSync('./system_prompt-oil-only.txt', 'utf-8');
  it('Minimal query with OpenAI', async () => {
    const resp = await chat_ai('openai', system_prompt, `麻煩週三國光二店要8箱 謝謝🙏`);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(1);
  }, timeout * SECONDS);

  it('Minimal query with Anthropic', async () => {
    const resp = await chat_ai('anthropic', system_prompt, `麻煩週三國光二店要8箱 謝謝🙏`);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result).toHaveProperty('orders');
    expect(result.orders).toHaveLength(1);
  }, timeout * SECONDS);
});

describe('Non-identifiable orders', () => {
  const system_prompt = fs.readFileSync('./system_prompt-check-orders.txt', 'utf-8');
  const testCases:[string, boolean][] = [
    [`麻煩協助更正以下\n7/29赤峰店叫貨芥花油未提供貨單\n\n`, false],
    [`您好，不好意思\n之後我們的貨品都麻煩安排在下午2:00-4:00到貨\n謝謝🙏`, false],
    ['經典芥花油 3箱', true],
    [`天母店麻煩送\n\n椰子汽泡水1箱\n\n豆奶7箱\n\n杏仁奶3箱\n\n謝謝`, true],
    [`大直：\n需到貨\n15L* 1\n20L*2`, true],
    ['嗨！我已經從824 LINE Bank (帳號末五碼：77539) 轉帳新臺幣$7,560元到您的帳戶囉 (永豐商業銀行，帳號末五碼：03699)！請確認一下！', false],
  ];

  it.each(testCases)("Message without any order %# for %s with OpenAI", async (message, hasOrder) => {
    const resp = await chat_ai('openai', system_prompt, message);
    expect(resp).toHaveProperty('message');

    const result = JSON.parse(resp.message!);
    // console.log(result);
    expect(result).toHaveProperty('hasOrders');
    expect(result.hasOrders).toBe(hasOrder);
  }, timeout * SECONDS);

  it.each(testCases)("Message without any order %# for %s with Anthropic", async (message, hasOrder) => {
    const resp = await chat_ai('anthropic', system_prompt, message);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result).toHaveProperty('hasOrders');
    expect(result.hasOrders).toBe(hasOrder);
  }, timeout * SECONDS);
});

describe("Identify account numbers", () => {
  const system_prompt = fs.readFileSync('./system_prompt-acc-number.txt', 'utf-8');
  const testCases:[string, boolean, string | string[] | null][] = [
    [`麻煩協助更正以下\n7/29赤峰店叫貨芥花油未提供貨單\n\n`, false, null],
    [`您好，不好意思\n之後我們的貨品都麻煩安排在下午2:00-4:00到貨\n謝謝🙏`, false, null],
    ['經典芥花油 3箱', false, null],
    [`天母店麻煩送\n\n椰子汽泡水1箱\n\n豆奶7箱\n\n杏仁奶3箱\n\n謝謝`, false, null],
    [`大直：\n需到貨\n15L* 1\n20L*2`, false, null],
    ['嗨！我已經從824 LINE Bank (帳號末五碼：77539) 轉帳新臺幣$7,560元到您的帳戶囉 (永豐商業銀行，帳號末五碼：03699)！請確認一下！', true, ["77539", "03699"]],
  ];

  it.each(testCases)("Account number identification (%#) for %s with OpenAI", async (message, hasAccount, account) => {
    const resp = await chat_ai('openai', system_prompt, message);
    expect(resp).toHaveProperty('message');

    const result = JSON.parse(resp.message!);
    // console.log(result);
    expect(result).toHaveProperty('hasAccount');
    expect(result.hasAccount).toBe(hasAccount);
    if (hasAccount) {
      if (account instanceof Array) {
        expect(account).toContain(result.account);
      } else {
        expect(result.account).toBe(account);
      }
    }
  }, timeout * SECONDS);

  it.each(testCases)("Account number identification (%#) for %s with Anthropic", async (message, hasAccount, account) => {
    const resp = await chat_ai('anthropic', system_prompt, message);
    expect(resp).toHaveProperty('message');
    const result = tryJSONParse(resp.message!);
    expect(result).toHaveProperty('hasAccount');
    expect(result.hasAccount).toBe(hasAccount);
    if (hasAccount) {
      if (account instanceof Array) {
        expect(account).toContain(result.account);
      } else {
        expect(result.account).toBe(account);
      }
    }
  }, timeout * SECONDS);
});
