import type { MyContext } from "../index";

/**
 * Handle /reflect command
 * Starts the evening reflection conversation
 */
export async function handleReflect(ctx: MyContext): Promise<void> {
    await ctx.conversation.enter("eveningReflectionConversation", {
        overwrite: true,
    });
}
