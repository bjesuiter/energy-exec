import type { MyContext } from "../index";
import { getDailyLog } from "@/src/lib/services/daily-log";
import { getConfig } from "@/src/lib/services/config";
import { formatInTimeZone } from "date-fns-tz";
import { logger } from "@/src/lib/logger";

/**
 * Handle /today command
 * Shows today's daily log in a nice Telegram message format
 */
export async function handleToday(ctx: MyContext): Promise<void> {
    try {
        // Get user's timezone for date calculation
        const timezone = (await getConfig("timezone")) as string | null;
        const tz = timezone || "UTC";

        // Get today's date using timezone-aware formatting
        const now = new Date();
        const today = formatInTimeZone(now, "UTC", "yyyy-MM-dd");
        const formattedDate = formatInTimeZone(now, tz, "EEEE, MMMM d, yyyy");

        // Get daily log
        const dailyLog = await getDailyLog(today);

        if (!dailyLog) {
            await ctx.reply(
                `📅 *No log found for today (${formattedDate})*\n\n` +
                    `Use /checkin to create a morning check-in for today.`,
                { parse_mode: "Markdown" },
            );
            return;
        }

        // Build formatted message with Telegram markdown
        let message = `📅 *${formattedDate} (${today})*\n\n`;

        // Body Battery section
        const batteryParts: string[] = [];
        if (dailyLog.bodyBatteryStart !== null) {
            batteryParts.push(`Start: *${dailyLog.bodyBatteryStart}*`);
        }
        if (dailyLog.bodyBatteryEnd !== null) {
            batteryParts.push(`End: *${dailyLog.bodyBatteryEnd}*`);
        }
        if (
            dailyLog.bodyBatteryStart !== null &&
            dailyLog.bodyBatteryEnd !== null
        ) {
            const diff = dailyLog.bodyBatteryEnd - dailyLog.bodyBatteryStart;
            const diffEmoji = diff >= 0 ? "📈" : "📉";
            batteryParts.push(
                `${diffEmoji} ${diff >= 0 ? "+" : ""}${diff}`,
            );
        }
        if (batteryParts.length > 0) {
            message += `🔋 *Body Battery*\n${batteryParts.join(" • ")}\n\n`;
        }

        // Sleep Notes
        if (dailyLog.sleepNotes) {
            message += `😴 *Sleep*\n${dailyLog.sleepNotes}\n\n`;
        }

        // Mood
        if (dailyLog.mood) {
            const moodObj = dailyLog.mood as any;
            if (moodObj && moodObj.text) {
                message += `💭 *Mood*\n${moodObj.text}\n\n`;
            }
        }

        // Priorities
        if (dailyLog.priorities) {
            const prioritiesArr = dailyLog.priorities as any[];
            if (Array.isArray(prioritiesArr) && prioritiesArr.length > 0) {
                message += `✅ *Priorities*\n`;
                prioritiesArr.forEach((p, i) => {
                    message += `${i + 1}\\. ${p}\n`;
                });
                message += `\n`;
            }
        }

        // Appointments
        if (dailyLog.appointments) {
            const appointmentsArr = dailyLog.appointments as any[];
            if (
                Array.isArray(appointmentsArr) &&
                appointmentsArr.length > 0
            ) {
                message += `📅 *Appointments*\n`;
                appointmentsArr.forEach((a, i) => {
                    message += `${i + 1}\\. ${a}\n`;
                });
                message += `\n`;
            }
        }

        // Generated Plan
        if (dailyLog.generatedPlan) {
            message += `📋 *Generated Plan*\n${dailyLog.generatedPlan}\n\n`;
        }

        // Reflections
        if (dailyLog.reflections) {
            message += `🌙 *Reflections*\n${dailyLog.reflections}\n\n`;
        }

        // Last updated
        const updatedAt = new Date(dailyLog.updatedAt);
        message += `_Last updated: ${
            formatInTimeZone(updatedAt, tz, "HH:mm")
        }_`;

        await ctx.reply(message, { parse_mode: "Markdown" });
    } catch (error) {
        logger.error("Failed to retrieve today's daily log", {
            userId: ctx.from?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            `❌ Sorry, I couldn't retrieve today's daily log. Please try again later.`,
        );
    }
}
