import { db, messages } from "../db";

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
