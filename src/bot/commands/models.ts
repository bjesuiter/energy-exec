import type { MyContext } from "../index";
import { getConfig, setConfig } from "@/src/lib/services/config";
import { logger } from "@/src/lib/logger";

export type ModelType = "big-pickle" | "gemini-3-pro";

const MODEL_DISPLAY_NAMES: Record<ModelType, string> = {
    "big-pickle": "big-pickle (free)",
    "gemini-3-pro": "gemini-3-pro",
};

/**
 * Handle /models command
 * Shows current model and allows switching between models
 */
export async function handleModels(ctx: MyContext): Promise<void> {
    try {
        const currentModel = (await getConfig("model")) as ModelType | null;
        const currentModelName = currentModel
            ? MODEL_DISPLAY_NAMES[currentModel]
            : "big-pickle (free)"; // Default

        const message = `🤖 Current Model: ${currentModelName}\n\n` +
            `Available models:\n` +
            `1. big-pickle (free) - OpenAI-compatible\n` +
            `2. gemini-3-pro - Google Gemini\n\n` +
            `To switch models, reply with:\n` +
            `• "1" or "big-pickle" for big-pickle (free)\n` +
            `• "2" or "gemini-3-pro" for gemini-3-pro`;

        await ctx.reply(message);
    } catch (error) {
        logger.error("Failed to handle /models command", {
            userId: ctx.from?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            "Sorry, I couldn't retrieve the model information. Please try again later.",
        );
    }
}

/**
 * Handle model selection from user message
 * Called when user sends a message that looks like a model selection
 */
export async function handleModelSelection(
    ctx: MyContext,
    text: string,
): Promise<boolean> {
    const normalizedText = text.toLowerCase().trim();

    let selectedModel: ModelType | null = null;

    // Check for model selection patterns
    if (
        normalizedText === "1" ||
        normalizedText === "big-pickle" ||
        normalizedText.includes("big-pickle")
    ) {
        selectedModel = "big-pickle";
    } else if (
        normalizedText === "2" ||
        normalizedText === "gemini-3-pro" ||
        normalizedText.includes("gemini-3-pro")
    ) {
        selectedModel = "gemini-3-pro";
    }

    if (!selectedModel) {
        return false; // Not a model selection
    }

    try {
        await setConfig("model", selectedModel);
        logger.info("Model changed", {
            userId: ctx.from?.id,
            model: selectedModel,
        });

        await ctx.reply(
            `✅ Model changed to: ${MODEL_DISPLAY_NAMES[selectedModel]}\n\n` +
                `Your next messages will use this model.`,
        );

        return true; // Handled
    } catch (error) {
        logger.error("Failed to change model", {
            userId: ctx.from?.id,
            model: selectedModel,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            "Sorry, I couldn't change the model. Please try again later.",
        );
        return true; // Handled (even if failed)
    }
}

