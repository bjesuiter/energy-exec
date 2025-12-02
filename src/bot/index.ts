import { Bot } from "grammy";
import { authMiddleware } from "./middleware/auth";
import { handleStart } from "./commands/start";
import { handleHelp } from "./commands/help";
import { DefaultMessageHandler } from "@/src/lib/message-handler";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

export const bot = new Bot(token);

// Initialize message handler
const messageHandler = new DefaultMessageHandler();

// Apply auth middleware
bot.use(authMiddleware);

// Command handlers
bot.command("start", handleStart);
bot.command("help", handleHelp);

// Handle text messages (non-commands)
bot.on("message:text", async (ctx) => {
    const response = await messageHandler.handleMessage(ctx.message.text, {
        userId: ctx.from.id,
        messageId: ctx.message.message_id,
        timestamp: ctx.message.date * 1000, // Convert to milliseconds
    });

    await ctx.reply(response.text);
});
