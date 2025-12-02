import { desc, eq } from "drizzle-orm";
import { type DailyLog, type DailyLogInsert, dailyLogs, db } from "../db";

/**
 * Get a daily log entry by date
 * @param date Date in YYYY-MM-DD format
 * @returns The daily log entry, or null if not found
 */
export async function getDailyLog(date: string): Promise<DailyLog | null> {
    const result = await db
        .select()
        .from(dailyLogs)
        .where(eq(dailyLogs.date, date))
        .limit(1)
        .all();

    if (result.length === 0) {
        return null;
    }

    return result[0];
}

/**
 * Create or update a daily log entry
 * @param date Date in YYYY-MM-DD format
 * @param data Partial daily log data to update
 * @returns The created or updated daily log entry
 */
export async function createOrUpdateDailyLog(
    date: string,
    data: Partial<Omit<DailyLogInsert, "date" | "updatedAt">>,
): Promise<DailyLog> {
    const now = new Date();

    const insertData: DailyLogInsert = {
        date,
        ...data,
        updatedAt: now,
    };

    const result = await db
        .insert(dailyLogs)
        .values(insertData)
        .onConflictDoUpdate({
            target: dailyLogs.date,
            set: {
                ...data,
                updatedAt: now,
            },
        })
        .returning()
        .all();

    return result[0];
}

/**
 * Get recent daily log entries ordered by date (most recent first)
 * @param limit Maximum number of entries to return
 * @returns Array of daily log entries
 */
export async function getRecentDailyLogs(limit: number): Promise<DailyLog[]> {
    return await db
        .select()
        .from(dailyLogs)
        .orderBy(desc(dailyLogs.date))
        .limit(limit)
        .all();
}
