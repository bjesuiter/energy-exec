import { Bot, Context } from "grammy";
import { ConversationFlavor, conversations } from "@grammyjs/conversations";
import { authMiddleware } from "./middleware/auth";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { handleStart } from "./commands/start";
import { handleHelp } from "./commands/help";
import { handleModels, handleModelSelection } from "./commands/models";
import { handleCheckin } from "./commands/checkin";
import { handleReflect } from "./commands/reflect";
import { DefaultMessageHandler } from "@/src/lib/message-handler";
import { logger } from "@/src/lib/logger";
import { onboardingConversation } from "./conversations/onboarding";
import { morningCheckinConversation } from "./conversations/morning-checkin";
import { eveningReflectionConversation } from "./conversations/evening-reflection";
import { createConversation } from "@grammyjs/conversations";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

// Create bot with conversation flavor
export type MyContext = Context & ConversationFlavor<Context>;
export const bot = new Bot<MyContext>(token);

// Install conversations plugin
bot.use(conversations());

// Initialize message handler
const messageHandler = new DefaultMessageHandler();

// Apply error handling middleware first (catches all errors)
bot.use(errorHandlerMiddleware);

// Apply auth middleware
bot.use(authMiddleware);

// Register conversations
bot.use(createConversation(onboardingConversation));
bot.use(createConversation(morningCheckinConversation));
bot.use(createConversation(eveningReflectionConversation));

// Command handlers
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("models", handleModels);
bot.command("checkin", handleCheckin);
bot.command("reflect", handleReflect);

// Handle text messages (non-commands)
bot.on("message:text", async (ctx) => {
    try {
        logger.debug("Received text message", {
            userId: ctx.from.id,
            messageId: ctx.message.message_id,
            textLength: ctx.message.text.length,
        });

        // Check if this is a model selection first
        const handled = await handleModelSelection(ctx, ctx.message.text);
        if (handled) {
            return; // Model selection was handled, don't process as regular message
        }

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
