import type {
    MessageContext,
    MessageHandler,
    MessageResponse,
} from "./interfaces";
import { logTelegramMessage } from "./services/telegram-message-log";
import { logger } from "./logger";

/**
 * Default message handler implementation
 * Processes incoming messages and generates responses
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

            // For now, return a simple echo response
            // This will be replaced with AI integration in Phase 4
            const responseText =
                `You said: "${text}"\n\nI'm still learning! More features coming soon.`;

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
            throw error; // Re-throw to let caller handle it
        }
    }
}
