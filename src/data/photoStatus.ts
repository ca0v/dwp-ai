import type { PhotoStatus } from "./types.ts";

const validTransitions: Record<PhotoStatus, PhotoStatus[]> = {
  queued: ["analyzing", "error"],
  analyzing: ["needs-review", "error"],
  "needs-review": ["ready", "error"],
  ready: ["error"],
  error: ["queued"],
};

export function canTransition(from: PhotoStatus, to: PhotoStatus): boolean {
  return validTransitions[from]?.includes(to) ?? false;
}

export function assertTransition(from: PhotoStatus, to: PhotoStatus): void {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid status transition: ${from} → ${to}`);
  }
}

export function statusLabel(status: PhotoStatus): string {
  const labels: Record<PhotoStatus, string> = {
    queued: "Queued",
    analyzing: "Analyzing…",
    "needs-review": "Needs Review",
    ready: "Ready",
    error: "Error",
  };
  return labels[status];
}

export function statusIcon(status: PhotoStatus): string {
  const icons: Record<PhotoStatus, string> = {
    queued: "⏳",
    analyzing: "🔍",
    "needs-review": "✏️",
    ready: "✅",
    error: "❌",
  };
  return icons[status];
}
