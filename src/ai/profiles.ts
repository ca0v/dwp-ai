import { readFileSync } from "fs";

interface Profile {
  name: string;
  systemPrompt: string;
}

type ProfileMap = Record<string, Profile>;

let _profiles: ProfileMap | null = null;

function loadProfiles(): ProfileMap {
  if (_profiles) return _profiles;
  try {
    _profiles = JSON.parse(readFileSync("config/profiles.json", "utf-8"));
    return _profiles!;
  } catch {
    _profiles = {
      general: {
        name: "General",
        systemPrompt:
          "Analyze this image and return relevant tags as a JSON array of {tag, confidence} objects.",
      },
    };
    return _profiles;
  }
}

export function getActiveProfile(): Profile {
  const profiles = loadProfiles();
  const key = (process.env.AI_PROFILE ?? "general").toLowerCase();
  return profiles[key] ?? profiles["general"];
}

export function getActiveSystemPrompt(): string {
  return getActiveProfile().systemPrompt;
}

export function listProfileKeys(): string[] {
  return Object.keys(loadProfiles());
}
