// src/llm/localGenerator.ts
import { pipeline, type TextGenerationPipeline } from "@xenova/transformers";

export type ChatMessage = {
  role: "system" | "user";
  content: string;
};

let generator: TextGenerationPipeline | null = null;
const MAX_TOTAL_TOKENS = 1024;  // GPT-2’s positional embedding limit

export async function generateAnswer(messages: ChatMessage[]): Promise<string> {
  // 1) Lazy-load the model
  if (!generator) {
    generator = (await pipeline("text-generation", "Xenova/gpt2")) as TextGenerationPipeline;
  }

  // 2) Build the prompt
  const prompt = messages.map(m => m.content).join("\n\n");

  // 3) Compute a safe max_length
  const maxLen = Math.min(prompt.length + 100, MAX_TOTAL_TOKENS);

  // 4) Generate text (no `stop` in config)
  const output = await generator(prompt, {
    max_length: maxLen,
    temperature: 0.2,
  });

  // 5) Extract the raw generated text
  const fullText = (output as any)[0].generated_text as string;

  // 6) Remove the prompt prefix
  let answer = fullText.slice(prompt.length).trim();

  // 7) Manually stop at the first blank line if present
  const stopAt = answer.indexOf("\n\n");
  if (stopAt !== -1) {
    answer = answer.slice(0, stopAt).trim();
  }

  // 8) In case any of the prompt text snuck back in, strip it out
  answer = answer.replace(prompt, "").trim();

  return answer;
}
