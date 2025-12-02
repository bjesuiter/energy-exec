import { Bot, Context } from "grammy";
import { ConversationFlavor, conversations } from "@grammyjs/conversations";
import { authMiddleware } from "./middleware/auth";
import { errorHandlerMiddleware } from "./middleware/error-handler";
import { handleStart } from "./commands/start";
import { handleHelp } from "./commands/help";
import { handleModels, handleModelSelection } from "./commands/models";
import { handleCheckin } from "./commands/checkin";
import { handleReflect } from "./commands/reflect";
import { handleViewDailyLog } from "./commands/viewDailyLog";
import { handleToday } from "./commands/today";
import { handleUpdatePlan } from "./commands/updatePlan";
import { logger } from "@/src/lib/logger";
import { onboardingConversation } from "./conversations/onboarding";
import { morningCheckinConversation } from "./conversations/morning-checkin";
import { eveningReflectionConversation } from "./conversations/evening-reflection";
import { updatePlanConversation } from "./conversations/update-plan";
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

// Apply error handling middleware first (catches all errors)
bot.use(errorHandlerMiddleware);

// Apply auth middleware
bot.use(authMiddleware);

// Register conversations
bot.use(createConversation(onboardingConversation));
bot.use(createConversation(morningCheckinConversation));
bot.use(createConversation(eveningReflectionConversation));
bot.use(createConversation(updatePlanConversation));

// Command handlers
bot.command("start", handleStart);
bot.command("help", handleHelp);
bot.command("models", handleModels);
bot.command("checkin", handleCheckin);
bot.command("reflect", handleReflect);
bot.command("viewDailyLog", handleViewDailyLog);
bot.command("today", handleToday);
bot.command("updatePlan", handleUpdatePlan);

// Handle text messages (non-commands)
// Only process model selection outside of conversations
// All other messages are handled within conversation flows
bot.on("message:text", async (ctx) => {
    try {
        // Check if this is a model selection
        const handled = await handleModelSelection(ctx, ctx.message.text);
        if (handled) {
            return; // Model selection was handled
        }

        // If not a model selection and not in a conversation, ignore the message
        // Conversations handle their own messages via conversation.waitFor()
        // We don't send plain messages to LLM anymore - only within conversation flows
        logger.debug("Received text message outside of conversation", {
            userId: ctx.from.id,
            messageId: ctx.message.message_id,
            textLength: ctx.message.text.length,
        });

        // Reply with a helpful message
        await ctx.reply(
            `💬 I can only process messages within conversation flows.\n\n` +
                `Use /checkin, /reflect, or /updatePlan to start a conversation.`,
        );
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
