import { ModerationProvider } from "./provider.js";
import { DeepSeekProvider } from "./adapters/deepseek.js";
import { QwenProvider } from "./adapters/qwen.js";

let cachedProvider: ModerationProvider | null = null;

export function getProvider(): ModerationProvider {
  if (cachedProvider) return cachedProvider;

  const provider = process.env.LLM_PROVIDER ?? "deepseek";

  switch (provider) {
    case "qwen":
      cachedProvider = new QwenProvider();
      break;
    case "deepseek":
    default:
      cachedProvider = new DeepSeekProvider();
      break;
  }

  return cachedProvider;
}

/** For testing — overrides the cached provider with a fake */
export function setProvider(provider: ModerationProvider): void {
  cachedProvider = provider;
}

/** For testing — clears cached provider so factory picks up env again */
export function resetProvider(): void {
  cachedProvider = null;
}
