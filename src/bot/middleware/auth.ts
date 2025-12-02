import { Context, NextFunction } from "grammy";

const authorizedUserId = process.env.AUTHORIZED_USER_ID;
if (!authorizedUserId) {
    throw new Error("AUTHORIZED_USER_ID environment variable is required");
}

const authorizedUserIdNum = parseInt(authorizedUserId, 10);
if (isNaN(authorizedUserIdNum)) {
    throw new Error("AUTHORIZED_USER_ID must be a valid number");
}

/**
 * Middleware to check if the user is authorized
 * Only allows messages from the authorized user ID
 */
export async function authMiddleware(
    ctx: Context,
    next: NextFunction,
): Promise<void> {
    // Early return if user ID cannot be identified
    const userId = ctx.from?.id;
    if (!userId) {
        await ctx.reply("Error: Could not identify user.");
        return; // Stop execution, don't call next()
    }

    // Early return if user is not authorized
    if (userId !== authorizedUserIdNum) {
        await ctx.reply("Access denied. This bot is private.");
        return; // Stop execution, don't call next()
    }

    // User is authorized, continue to route handler
    await next();
}
