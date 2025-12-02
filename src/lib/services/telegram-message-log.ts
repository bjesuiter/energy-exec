import { and, desc, eq, gte, lte } from "drizzle-orm";
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

/**
 * Get Telegram messages for a specific date
 * @param date Date in YYYY-MM-DD format
 * @returns Array of message entries for that date, ordered by creation time (most recent first)
 */
export async function getTelegramMessagesByDate(
    date: string,
): Promise<Message[]> {
    // Parse the date string (YYYY-MM-DD)
    const dateObj = new Date(date + "T00:00:00.000Z");
    const startOfDay = new Date(dateObj);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(dateObj);
    endOfDay.setUTCHours(23, 59, 59, 999);

    return await db
        .select()
        .from(messages)
        .where(
            and(
                gte(messages.createdAt, startOfDay),
                lte(messages.createdAt, endOfDay),
            ),
        )
        .orderBy(desc(messages.createdAt))
        .all();
}
