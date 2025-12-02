import type { MyContext } from "../index";

/**
 * Handle /updatePlan command
 * Starts the update plan conversation flow
 */
export async function handleUpdatePlan(ctx: MyContext): Promise<void> {
    await ctx.conversation.enter("updatePlanConversation", {
        overwrite: true,
    });
}
