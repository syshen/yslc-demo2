export interface AIService {
  generateResponse: (
    { system_prompt, prompt, model }:
    { system_prompt: string, prompt: string, model?: string })
    => Promise<{ message: string | null, elapsedTime: number }>;
}
