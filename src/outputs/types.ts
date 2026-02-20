export interface DigestItem {
  rank: number;
  title: string;
  url: string;
  score: number;
  summary: string;
  tags: string[];
  sourceName: string;
}

export interface FormattedDigest {
  generatedAt: Date;
  items: DigestItem[];
}

export interface OutputPlugin {
  name: string;
  label: string;
  enabled: boolean;
  send(digest: FormattedDigest): Promise<void>;
}
