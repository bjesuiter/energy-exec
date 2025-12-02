import { desc, eq } from "drizzle-orm";
import { db, type Message, messages } from "../db";

export interface TelegramLogMessageParams {
    telegramMessageId: number;
    direction: "incoming" | "outgoing";
    content: string;
}

/**
 * Log a Telegram message to the database
 * @param params Message parameters including Telegram message ID, direction, and content
 */
export async function logTelegramMessage(
    params: TelegramLogMessageParams,
): Promise<void> {
    const now = new Date();

    await db
        .insert(messages)
        .values({
            telegramMessageId: params.telegramMessageId,
            direction: params.direction,
            content: params.content,
            createdAt: now,
        })
        .run();
}

/**
 * Get a Telegram message by Telegram message ID
 * @param telegramMessageId The Telegram message ID
 * @returns The message entry, or null if not found
 */
export async function getTelegramMessageByTelegramId(
    telegramMessageId: number,
): Promise<Message | null> {
    const result = await db
        .select()
        .from(messages)
        .where(eq(messages.telegramMessageId, telegramMessageId))
        .limit(1)
        .all();

    if (result.length === 0) {
        return null;
    }

    return result[0];
}

/**
 * Get recent Telegram messages ordered by creation time (most recent first)
 * @param limit Maximum number of messages to return
 * @returns Array of message entries
 */
export async function getRecentTelegramMessages(
    limit: number,
): Promise<Message[]> {
    return await db
        .select()
        .from(messages)
        .orderBy(desc(messages.createdAt))
        .limit(limit)
        .all();
}
