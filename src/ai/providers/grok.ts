import type { AIProvider, TagResult } from "../provider.ts";

interface GrokConfig {
  url: string;
  key: string;
  model: string;
  timeoutMs: number;
}

const MAX_RETRIES = 3;
const TRANSIENT_CODES = new Set([429, 500, 502, 503, 504]);

export class GrokProvider implements AIProvider {
  constructor(private config: GrokConfig) {}

  async tagImage(base64DataUrl: string, systemPrompt: string): Promise<TagResult[]> {
    const body = {
      model: this.config.model,
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: [
            { type: "image_url", image_url: { url: base64DataUrl } },
            {
              type: "text",
              text: "Analyze this image and return tags as specified.",
            },
          ],
        },
      ],
      max_tokens: 600,
    };

    const raw = await this.callWithRetry(body);
    return this.parseTagResults(raw);
  }

  async expandQuery(query: string, vocabulary: string[]): Promise<string[]> {
    const body = {
      model: this.config.model,
      messages: [
        {
          role: "system",
          content:
            "You are a tag expansion assistant. Given a search query and a list of available tags, return the most relevant tags from that list. Return ONLY a JSON array of tag strings from the provided vocabulary — no other text.",
        },
        {
          role: "user",
          content: `Query: "${query}"\nAvailable tags: ${vocabulary.join(", ")}\n\nReturn relevant tags as a JSON array.`,
        },
      ],
      max_tokens: 200,
    };

    const raw = await this.callWithRetry(body);
    return this.parseStringArray(raw);
  }

  private async callWithRetry(body: object): Promise<string> {
    let lastError: Error | null = null;
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (attempt > 0) {
        await sleep(Math.pow(2, attempt) * 500);
      }
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.timeoutMs);
        let res: Response;
        try {
          res = await fetch(`${this.config.url}/chat/completions`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${this.config.key}`,
            },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
        } finally {
          clearTimeout(timer);
        }

        if (!res.ok) {
          const errBody = await res.text().catch(() => "");
          if (TRANSIENT_CODES.has(res.status)) {
            lastError = new Error(`HTTP ${res.status}: ${errBody}`);
            continue; // retry
          }
          // Non-retryable
          throw new Error(`AI provider error: HTTP ${res.status}: ${errBody}`);
        }

        const data = (await res.json()) as {
          choices: Array<{ message: { content: string } }>;
        };
        return data.choices?.[0]?.message?.content ?? "";
      } catch (err) {
        if ((err as Error)?.name === "AbortError") {
          lastError = new Error("Request timed out");
        } else if (lastError === null) {
          throw err; // non-transient first failure
        } else {
          lastError = err as Error;
        }
      }
    }
    throw lastError ?? new Error("AI provider request failed");
  }

  private parseTagResults(content: string): TagResult[] {
    try {
      // Try direct parse
      const arr = JSON.parse(content.trim());
      if (Array.isArray(arr)) {
        return arr
          .filter(
            (item) =>
              typeof item === "object" &&
              typeof item.tag === "string" &&
              typeof item.confidence === "number"
          )
          .map((item) => ({
            tag: item.tag.toLowerCase().trim(),
            confidence: Math.min(1, Math.max(0, item.confidence)),
          }));
      }
    } catch {
      // Try to extract JSON array from response text
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        return this.parseTagResults(match[0]);
      }
    }
    return [];
  }

  private parseStringArray(content: string): string[] {
    try {
      const arr = JSON.parse(content.trim());
      if (Array.isArray(arr)) {
        return arr.filter((s): s is string => typeof s === "string");
      }
    } catch {
      const match = content.match(/\[[\s\S]*\]/);
      if (match) {
        return this.parseStringArray(match[0]);
      }
    }
    return [];
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
