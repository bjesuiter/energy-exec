import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

let cachedProvider: ReturnType<typeof createOpenAICompatible> | null = null;

/**
 * Get or create opencode-zen provider instance (cached)
 * @returns OpenAI-compatible provider configured for opencode-zen
 * @throws Error if required environment variables are not set
 */
export function getOpencodeZen() {
    if (cachedProvider) {
        return cachedProvider;
    }

    const apiKey = process.env.OPENCODE_ZEN_API_KEY;
    const baseUrl = process.env.OPENCODE_ZEN_BASE_URL;

    if (!apiKey) {
        throw new Error(
            "OPENCODE_ZEN_API_KEY environment variable is required",
        );
    }

    if (!baseUrl) {
        throw new Error(
            "OPENCODE_ZEN_BASE_URL environment variable is required",
        );
    }

    cachedProvider = createOpenAICompatible({
        name: "opencode-zen",
        apiKey,
        baseURL: baseUrl,
    });

    return cachedProvider;
}
