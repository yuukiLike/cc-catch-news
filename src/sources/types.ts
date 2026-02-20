export interface RawArticle {
  sourceId: string;
  title: string;
  url: string;
  score?: number;
  commentCount?: number;
  author?: string;
  createdAt?: Date;
  sourceName: string;
  meta?: Record<string, unknown>;
}

export interface SourcePlugin {
  name: string;
  label: string;
  enabled: boolean;
  fetch(since?: Date): Promise<RawArticle[]>;
}
