import { Context, NextFunction } from "grammy";

/**
 * Error handling middleware for the bot
 * Catches errors and logs them, then sends a user-friendly error message
 */
export async function errorHandlerMiddleware(
    ctx: Context,
    next: NextFunction,
): Promise<void> {
    try {
        await next();
    } catch (error) {
        // Log the error with context
        const userId = ctx.from?.id || "unknown";
        const chatId = ctx.chat?.id || "unknown";
        const messageId = ctx.message?.message_id || "unknown";

        console.error("❌ Bot error occurred:", {
            userId,
            chatId,
            messageId,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });

        // Try to send a user-friendly error message
        try {
            await ctx.reply(
                "Sorry, something went wrong. Please try again later or contact support if the issue persists.",
            );
        } catch (replyError) {
            // If we can't send a reply, log that too
            console.error(
                "❌ Failed to send error message to user:",
                replyError,
            );
        }
    }
}
