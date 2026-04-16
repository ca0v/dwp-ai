export interface TagResult {
  tag: string;
  confidence: number;
}

export interface AIProvider {
  tagImage(base64DataUrl: string, systemPrompt: string): Promise<TagResult[]>;
  expandQuery(query: string, vocabulary: string[]): Promise<string[]>;
}
