import { Context } from "grammy";

/**
 * Handle /help command
 * Shows available commands and usage information
 */
export async function handleHelp(ctx: Context): Promise<void> {
    const helpMessage = `📚 Available Commands:

/start - Welcome message and introduction
/help - Show this help message
/models - View and change AI model
/checkin - Start morning check-in (body battery, sleep, mood, priorities)
/reflect - Start evening reflection (how the day went, notes for tomorrow)
/today - View today's daily log in a nice format
/viewDailyLog [YYYY-MM-DD] - View daily log for a date (defaults to today)

Daily Flow:
• Morning: Use /checkin to log your energy levels and priorities
• Throughout the day: Send me messages to get help planning or adjusting your day
• Evening: Use /reflect to reflect on how your day went
• View logs: Use /viewDailyLog to see past daily logs

You can also just chat with me anytime, and I'll help you plan your day based on your energy levels!`;

    await ctx.reply(helpMessage);
}
