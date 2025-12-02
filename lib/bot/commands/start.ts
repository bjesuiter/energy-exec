import { Context } from "grammy";

/**
 * Handle /start command
 * Welcomes the user and provides initial information
 */
export async function handleStart(ctx: Context): Promise<void> {
    const welcomeMessage = `👋 Welcome to Energy Exec!

I'm your AI-powered daily planning assistant that helps you structure your day based on your energy levels and health metrics.

To get started, I'll help you:
• Set up your timezone
• Log your morning check-ins (body battery, sleep, mood)
• Generate energy-aware day plans
• Track your progress over time

Send /help to see all available commands.`;

    await ctx.reply(welcomeMessage);
}
