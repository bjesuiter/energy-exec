/**
 * Context information for message handling
 */
export interface MessageContext {
    userId: number;
    messageId: number;
    timestamp: number;
}

/**
 * Response from message handler
 */
export interface MessageResponse {
    text: string;
}

/**
 * MessageHandler interface - Telegram-free abstraction for processing messages
 * This allows testing core logic without Telegram dependencies
 */
export interface MessageHandler {
    /**
     * Handle an incoming message
     * @param text Message text content
     * @param context Message context (user ID, message ID, timestamp)
     * @returns Response text to send back
     */
    handleMessage(
        text: string,
        context: MessageContext,
    ): Promise<MessageResponse>;
}
