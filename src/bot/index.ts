import { Bot } from "grammy";
import { authMiddleware } from "./middleware/auth";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { handleStart } from "./commands/start";
import { handleHelp } from "./commands/help";
import { DefaultMessageHandler } from "@/src/lib/message-handler";
import { logger } from "@/src/lib/logger";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

export const bot = new Bot(token);

// Initialize message handler
const messageHandler = new DefaultMessageHandler();
// Apply auth middleware
bot.use(authMiddleware);

// Apply error handling middleware first (catches all errors)
bot.use(errorHandlerMiddleware);

// Command handlers
bot.command("start", handleStart);
bot.command("help", handleHelp);

// Handle text messages (non-commands)
bot.on("message:text", async (ctx) => {
    try {
        logger.debug("Received text message", {
            userId: ctx.from.id,
            messageId: ctx.message.message_id,
            textLength: ctx.message.text.length,
        });

        const response = await messageHandler.handleMessage(ctx.message.text, {
            userId: ctx.from.id,
            messageId: ctx.message.message_id,
            timestamp: ctx.message.date * 1000, // Convert to milliseconds
        });

        await ctx.reply(response.text);

        logger.debug("Sent response", {
            userId: ctx.from.id,
            responseLength: response.text.length,
        });
    } catch (error) {
        // Error handler middleware will catch this, but log here for context
        logger.error("Failed to handle text message", {
            userId: ctx.from.id,
            messageId: ctx.message.message_id,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error; // Re-throw to let error handler middleware handle it
    }
});
