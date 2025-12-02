import type {
    MessageContext,
    MessageHandler,
    MessageResponse,
} from "./interfaces";
import { logTelegramMessage } from "./services/telegram-message-log";
import { logger } from "./logger";
import { buildPrompt } from "./ai/prompts";
import { getConfig } from "./services/config";
import { getZenGoogle, getZenOpenAICompatible } from "./ai/providers";
import { generateText } from "ai";
import type { ModelType } from "@/src/bot/commands/models";

/**
 * Default message handler implementation
 * Processes incoming messages and generates responses using AI
 */
export class DefaultMessageHandler implements MessageHandler {
    async handleMessage(
        text: string,
        context: MessageContext,
    ): Promise<MessageResponse> {
        try {
            // Log incoming message
            await logTelegramMessage({
                telegramMessageId: context.messageId,
                direction: "incoming",
                content: text,
            });

            // Get user timezone for context
            const timezone = await getConfig("timezone");

            // Build prompt with context
            const messages = buildPrompt(text, {
                timezone: typeof timezone === "string" ? timezone : undefined,
            });

            // Get selected model (default to big-pickle)
            const selectedModel = ((await getConfig("model")) as ModelType) ||
                "big-pickle";

            // Generate AI response
            logger.debug("Generating AI response", {
                messageCount: messages.length,
                model: selectedModel,
            });

            let model;
            if (selectedModel === "gemini-3-pro") {
                const google = getZenGoogle();
                model = google("gemini-3-pro");
            } else {
                const opencodeZen = getZenOpenAICompatible();
                model = opencodeZen("big-pickle");
            }

            const result = await generateText({
                model,
                messages: messages.map((msg) => ({
                    role: msg.role,
                    content: msg.content,
                })),
            });

            const responseText = result.text;

            logger.debug("AI response generated", {
                responseLength: responseText.length,
            });

            // Log outgoing response
            await logTelegramMessage({
                telegramMessageId: context.messageId + 1, // Approximate ID
                direction: "outgoing",
                content: responseText,
            });

            return { text: responseText };
        } catch (error) {
            logger.error("Failed to handle message", {
                userId: context.userId,
                messageId: context.messageId,
                error: error instanceof Error ? error.message : String(error),
            });

            // Return a fallback message if AI fails
            const fallbackMessage =
                "Sorry, I'm having trouble processing your message right now. Please try again in a moment.";

            // Log fallback response
            await logTelegramMessage({
                telegramMessageId: context.messageId + 1,
                direction: "outgoing",
                content: fallbackMessage,
            }).catch(() => {
                // Ignore logging errors for fallback
            });

            return { text: fallbackMessage };
        }
    }
}
