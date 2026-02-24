/**
 * URL 工具 — 标准化 + 哈希
 *
 * 用于文章去重：不同来源可能带不同的 tracking 参数（utm_*、ref），
 * 标准化后用 SHA256 生成唯一指纹。
 */
import { createHash } from "node:crypto";

/** 去掉 URL 中的 fragment、tracking 参数、尾部斜杠，参数排序 */
export function normalizeUrl(raw: string): string {
  try {
    const url = new URL(raw);
    url.hash = "";
    for (const param of ["utm_source", "utm_medium", "utm_campaign", "ref"]) {
      url.searchParams.delete(param);
    }
    url.searchParams.sort();
    let normalized = url.toString();
    if (normalized.endsWith("/")) {
      normalized = normalized.slice(0, -1);
    }
    return normalized;
  } catch {
    return raw;
  }
}

/** 标准化 URL 后取 SHA256 hex，作为去重 key */
export function hashUrl(url: string): string {
  return createHash("sha256").update(normalizeUrl(url)).digest("hex");
}
