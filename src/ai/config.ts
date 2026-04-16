import type { AIProvider } from "./provider.ts";
import { GrokProvider } from "./providers/grok.ts";

let _provider: AIProvider | null = null;

export function getProvider(): AIProvider {
  if (_provider) return _provider;

  const url = process.env.AI_PROVIDER_URL;
  const key = process.env.AI_API_KEY;
  const model = process.env.AI_MODEL ?? "grok-4-0709";
  const timeoutMs = Number(process.env.AI_TIMEOUT_MS ?? 30000);

  if (!url || !key) {
    throw new Error("AI_PROVIDER_URL and AI_API_KEY must be set in environment");
  }

  // Currently only Grok/OpenAI-compatible providers are supported.
  // To add a new provider, implement the AIProvider interface and
  // add a condition here based on a new AI_PROVIDER env var.
  _provider = new GrokProvider({ url, key, model, timeoutMs });
  return _provider;
}

export function resetProvider(): void {
  _provider = null;
}
