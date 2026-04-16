/**
 * Generates sample test images using the x.ai Aurora image generation API
 * and saves them as JPEGs to tests/pics/.
 *
 * Usage:
 *   bun run scripts/generate-test-pics.ts
 *
 * Requires AI_PROVIDER_URL and AI_API_KEY in .env (same as the main app).
 */
import { writeFileSync, mkdirSync, existsSync } from "fs";
import { join } from "path";

// Load .env (Bun auto-loads .env, but this makes it explicit for the reader)
const AI_PROVIDER_URL = process.env.AI_PROVIDER_URL;
const AI_API_KEY = process.env.AI_API_KEY;
const IMAGE_MODEL = process.env.AI_IMAGE_MODEL ?? "grok-imagine-image";

if (!AI_PROVIDER_URL || !AI_API_KEY) {
  console.error("AI_PROVIDER_URL and AI_API_KEY must be set in .env");
  process.exit(1);
}

const OUT_DIR = join(import.meta.dir, "../tests/pics");
if (!existsSync(OUT_DIR)) mkdirSync(OUT_DIR, { recursive: true });

const PROMPTS: Array<{ filename: string; prompt: string }> = [
  {
    filename: "dog-park.jpg",
    prompt:
      "A happy golden retriever playing fetch in a sunny green park, natural daylight, wide shot",
  },
  {
    filename: "mountain-sunset.jpg",
    prompt:
      "A dramatic mountain landscape at golden hour, snow-capped peaks, vibrant orange and purple sky",
  },
  {
    filename: "city-night.jpg",
    prompt:
      "A city skyline at night with glowing lights reflecting on a river, long exposure style",
  },
  {
    filename: "cat-indoors.jpg",
    prompt:
      "A tabby cat sitting on a sunny windowsill indoors, warm light, cozy home interior visible",
  },
];

async function generateImage(prompt: string): Promise<Buffer> {
  const res = await fetch(`${AI_PROVIDER_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${AI_API_KEY}`,
    },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      response_format: "b64_json",
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`API error ${res.status}: ${body}`);
  }

  const json = (await res.json()) as {
    data: Array<{ b64_json?: string; url?: string }>;
  };
  const item = json.data[0];

  if (item.b64_json) {
    return Buffer.from(item.b64_json, "base64");
  }

  if (item.url) {
    // Some providers return a URL instead of base64
    const imgRes = await fetch(item.url);
    if (!imgRes.ok) throw new Error(`Failed to fetch image from URL: ${item.url}`);
    return Buffer.from(await imgRes.arrayBuffer());
  }

  throw new Error("No image data in response");
}

let success = 0;
let fail = 0;

for (const { filename, prompt } of PROMPTS) {
  const dest = join(OUT_DIR, filename);
  if (existsSync(dest)) {
    console.log(`  skip  ${filename} (already exists)`);
    success++;
    continue;
  }

  process.stdout.write(`  gen   ${filename} … `);
  try {
    const buf = await generateImage(prompt);
    writeFileSync(dest, buf);
    console.log(`saved (${buf.byteLength} bytes)`);
    success++;
  } catch (err) {
    console.log(`FAILED: ${(err as Error).message}`);
    fail++;
  }
}

console.log(`\nDone: ${success} ok, ${fail} failed`);
if (fail > 0) process.exit(1);
