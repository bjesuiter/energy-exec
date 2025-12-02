import type { MyContext } from "../index";
import { isUserOnboarded } from "@/src/lib/services/onboarding";

/**
 * Handle /start command
 * Welcomes the user and starts onboarding if needed
 */
export async function handleStart(ctx: MyContext): Promise<void> {
    const onboarded = await isUserOnboarded();

    if (!onboarded) {
        // Start onboarding conversation
        await ctx.conversation.enter("onboardingConversation");
        return;
    }

    // User is already onboarded
    const welcomeMessage = `👋 Welcome back to Energy Exec!

I'm your AI-powered daily planning assistant that helps you structure your day based on your energy levels and health metrics.

You can:
• Log your morning check-ins (body battery, sleep, mood)
• Generate energy-aware day plans
• Track your progress over time

Send /help to see all available commands.`;

    await ctx.reply(welcomeMessage);
}
