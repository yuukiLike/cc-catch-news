import type { SourcePlugin } from "./types.js";
import { hackernewsSource } from "./hackernews.js";
import { productHuntSource } from "./producthunt.js";

export const sources: SourcePlugin[] = [
  hackernewsSource,
  productHuntSource,
  // Add new sources here
];

export const enabledSources = () => sources.filter((s) => s.enabled);
