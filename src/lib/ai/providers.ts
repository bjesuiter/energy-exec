import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { createGoogleGenerativeAI } from "@ai-sdk/google";

let cachedOpenAIProvider: ReturnType<typeof createOpenAICompatible> | null =
    null;
let cachedGoogleProvider: ReturnType<typeof createGoogleGenerativeAI> | null =
    null;

/**
 * Get or create opencode-zen OpenAI-compatible provider instance (cached)
 * @returns OpenAI-compatible provider configured for opencode-zen
 * @throws Error if required environment variables are not set
 */
export function getZenOpenAICompatible() {
    if (cachedOpenAIProvider) {
        return cachedOpenAIProvider;
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

    cachedOpenAIProvider = createOpenAICompatible({
        name: "opencode-zen",
        apiKey,
        baseURL: baseUrl,
    });

    return cachedOpenAIProvider;
}

/**
 * Get or create Google AI provider instance (cached)
 * @returns Google AI provider configured for opencode-zen
 * @throws Error if required environment variables are not set
 */
export function getZenGoogle() {
    if (cachedGoogleProvider) {
        return cachedGoogleProvider;
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

    // Use with model id: "	gemini-3-pro"
    cachedGoogleProvider = createGoogleGenerativeAI({
        apiKey,
        baseURL: baseUrl,
    });

    return cachedGoogleProvider;
}
