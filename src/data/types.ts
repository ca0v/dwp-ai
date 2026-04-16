export type PhotoStatus = "queued" | "analyzing" | "needs-review" | "ready" | "error";

export interface Photo {
  id: string;
  filename: string;
  mimeType: string;
  size: number;
  createdAt: string;
  uploadedAt: string;
  status: PhotoStatus;
}

export interface Tag {
  id: string;
  valueNormalized: string;
  displayValue: string;
  createdAt: string;
}

export interface PhotoTag {
  photoId: string;
  tagId: string;
  source: "ai" | "user";
  confidence: number;
  approved: boolean;
  approvedAt?: string;
}

export interface SearchQueryLog {
  id: string;
  queryText: string;
  resolvedTags: string[];
  resultCount: number;
  createdAt: string;
}

export interface StoreData {
  photos: Photo[];
  tags: Tag[];
  photoTags: PhotoTag[];
  searchQueryLogs: SearchQueryLog[];
}
