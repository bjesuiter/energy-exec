import type {
    MessageContext,
    MessageHandler,
    MessageResponse,
} from "./interfaces";
import { logTelegramMessage } from "./services/telegram-message-log";

/**
 * Default message handler implementation
 * Processes incoming messages and generates responses
 */
export class DefaultMessageHandler implements MessageHandler {
    async handleMessage(
        text: string,
        context: MessageContext,
    ): Promise<MessageResponse> {
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
    }
}
