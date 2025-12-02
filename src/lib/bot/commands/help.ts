import { Context } from "grammy";

/**
 * Handle /help command
 * Shows available commands and usage information
 */
export async function handleHelp(ctx: Context): Promise<void> {
    const helpMessage = `📚 Available Commands:

/start - Welcome message and introduction
/help - Show this help message

More commands will be available as features are added:
• Morning check-ins
• Day planning
• Evening reflections
• History viewing

For now, you can start by sending /start to begin!`;

    await ctx.reply(helpMessage);
}

