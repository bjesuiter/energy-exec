import type { MyContext } from "../index";
import { getDailyLog } from "@/src/lib/services/daily-log";
import { getConfig } from "@/src/lib/services/config";
import { format, parse } from "date-fns";
import { logger } from "@/src/lib/logger";

/**
 * Handle /viewDailyLog command
 * Shows daily log for a specified date (defaults to today)
 * Usage: /viewDailyLog [YYYY-MM-DD]
 */
export async function handleViewDailyLog(ctx: MyContext): Promise<void> {
    try {
        // Get user's timezone for date calculation
        const timezone = (await getConfig("timezone")) as string | null;

        // Parse date parameter if provided
        const commandText = ctx.message?.text || "";
        const parts = commandText.split(" ").filter((p) => p.length > 0);
        const dateParam = parts.length > 1 ? parts[1] : null;

        let targetDate: Date;
        let dateString: string;

        if (dateParam) {
            // Try to parse the provided date
            try {
                const parsed = parse(dateParam, "yyyy-MM-dd", new Date());
                if (isNaN(parsed.getTime())) {
                    await ctx.reply(
                        `❌ Invalid date format. Please use YYYY-MM-DD format.\n\n` +
                            `Example: /viewDailyLog 2024-12-01`,
                    );
                    return;
                }
                targetDate = parsed;
                dateString = format(targetDate, "yyyy-MM-dd");
            } catch (error) {
                await ctx.reply(
                    `❌ Invalid date format. Please use YYYY-MM-DD format.\n\n` +
                        `Example: /viewDailyLog 2024-12-01`,
                );
                return;
            }
        } else {
            // Default to today
            targetDate = timezone
                ? new Date(
                    new Date().toLocaleString("de-DE", { timeZone: timezone }),
                )
                : new Date();
            dateString = format(targetDate, "yyyy-MM-dd");
        }

        // Get daily log
        const dailyLog = await getDailyLog(dateString);

        if (!dailyLog) {
            await ctx.reply(
                `📅 No log found for ${dateString}.\n\n` +
                    `Use /checkin to create a morning check-in for today.`,
            );
            return;
        }

        // Format the log nicely
        const formattedDate = format(targetDate, "EEEE, MMMM d, yyyy");
        let message = `📅 Daily Log: ${formattedDate}\n\n`;

        // Body Battery
        if (dailyLog.bodyBatteryStart !== null) {
            message += `🔋 Body Battery Start: ${dailyLog.bodyBatteryStart}\n`;
        }
        if (dailyLog.bodyBatteryEnd !== null) {
            message += `🔋 Body Battery End: ${dailyLog.bodyBatteryEnd}\n`;
        }
        if (
            dailyLog.bodyBatteryStart !== null &&
            dailyLog.bodyBatteryEnd !== null
        ) {
            const diff = dailyLog.bodyBatteryEnd - dailyLog.bodyBatteryStart;
            const diffEmoji = diff >= 0 ? "📈" : "📉";
            message += `${diffEmoji} Change: ${diff >= 0 ? "+" : ""}${diff}\n`;
        }

        // Sleep Notes
        if (dailyLog.sleepNotes) {
            message += `\n😴 Sleep: ${dailyLog.sleepNotes}\n`;
        }

        // Mood (already parsed by Drizzle with mode: "json")
        if (dailyLog.mood) {
            const moodObj = dailyLog.mood as any;
            if (moodObj && moodObj.text) {
                message += `\n💭 Mood: ${moodObj.text}\n`;
            }
        }

        // Priorities (already parsed by Drizzle with mode: "json")
        if (dailyLog.priorities) {
            const prioritiesArr = dailyLog.priorities as any[];
            if (Array.isArray(prioritiesArr) && prioritiesArr.length > 0) {
                message += `\n✅ Priorities:\n`;
                prioritiesArr.forEach((p, i) => {
                    message += `  ${i + 1}. ${p}\n`;
                });
            }
        }

        // Appointments (already parsed by Drizzle with mode: "json")
        if (dailyLog.appointments) {
            const appointmentsArr = dailyLog.appointments as any[];
            if (
                Array.isArray(appointmentsArr) &&
                appointmentsArr.length > 0
            ) {
                message += `\n📅 Appointments:\n`;
                appointmentsArr.forEach((a, i) => {
                    message += `  ${i + 1}. ${a}\n`;
                });
            }
        }

        // Generated Plan
        if (dailyLog.generatedPlan) {
            message += `\n📋 Generated Plan:\n${dailyLog.generatedPlan}\n`;
        }

        // Reflections
        if (dailyLog.reflections) {
            message += `\n🌙 Reflections:\n${dailyLog.reflections}\n`;
        }

        // Last updated
        const updatedAt = new Date(dailyLog.updatedAt);
        message += `\n🕒 Last updated: ${
            format(updatedAt, "yyyy-MM-dd HH:mm:ss")
        }`;

        await ctx.reply(message);
    } catch (error) {
        logger.error("Failed to retrieve daily log", {
            userId: ctx.from?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            `❌ Sorry, I couldn't retrieve the daily log. Please try again later.`,
        );
    }
}
