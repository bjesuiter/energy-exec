import type { MyContext } from "../index";

/**
 * Handle /checkin command
 * Starts the morning check-in conversation
 */
export async function handleCheckin(ctx: MyContext): Promise<void> {
    await ctx.conversation.enter("morningCheckinConversation", {
        overwrite: true,
    });
}
