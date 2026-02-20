import type { OutputPlugin } from "./types.js";
import { discordOutput } from "./discord.js";
import { wechatWorkOutput } from "./wechat-work.js";

export const outputs: OutputPlugin[] = [
  discordOutput,
  wechatWorkOutput,
  // Add new outputs here
];

export const enabledOutputs = () => outputs.filter((o) => o.enabled);
