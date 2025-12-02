import { Bot } from "grammy";
import { authMiddleware } from "./middleware/auth";
import { handleStart } from "./commands/start";
import { handleHelp } from "./commands/help";

const token = process.env.TELEGRAM_BOT_TOKEN;
if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN environment variable is required");
}

export const bot = new Bot(token);

// Apply auth middleware (currently disabled - allows all users)
bot.use(authMiddleware);

// Command handlers
bot.command("start", handleStart);
bot.command("help", handleHelp);
