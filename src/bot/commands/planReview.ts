import type { MyContext } from "../index";
import { getDailyLog } from "@/src/lib/services/daily-log";
import { getConfig } from "@/src/lib/services/config";
import { formatInTimeZone } from "date-fns-tz";
import { logger } from "@/src/lib/logger";
import { generatePlanReview } from "@/src/lib/services/planner";

/**
 * Handle /planReview command
 * Generates an AI review of today's plan and reflections
 */
export async function handlePlanReview(ctx: MyContext): Promise<void> {
    try {
        // Get user's timezone for display (dates stored in UTC)
        const timezone = (await getConfig("timezone")) as string | null;

        // Get today's date in UTC for database lookup
        const now = new Date();
        const today = formatInTimeZone(now, "UTC", "yyyy-MM-dd");

        // Get daily log
        const dailyLog = await getDailyLog(today);

        logger.debug("Retrieved daily log for /planReview", {
            userId: ctx.from?.id,
            date: today,
            hasPlan: !!dailyLog?.generatedPlan,
            hasReflections: !!dailyLog?.reflections,
        });

        if (!dailyLog) {
            await ctx.reply(
                `❌ No daily log found for today.\n\n` +
                    `Use /checkin to create a morning check-in first.`,
            );
            return;
        }

        if (!dailyLog.generatedPlan) {
            await ctx.reply(
                `❌ No plan found for today.\n\n` +
                    `Use /checkin to generate a plan for today, or /updatePlan to create one.`,
            );
            return;
        }

        if (!dailyLog.reflections) {
            await ctx.reply(
                `❌ No reflections found for today.\n\n` +
                    `Use /reflect to add your reflections first, then I can review your plan.`,
            );
            return;
        }

        // Generate review
        await ctx.reply(
            `🤖 Generating an AI review of your plan and reflections...`,
        );

        const review = await generatePlanReview(dailyLog, timezone);

        await ctx.reply(
            `📊 *Plan Review & Suggestions for Tomorrow*\n\n${review}`,
            { parse_mode: "Markdown" },
        );
    } catch (error) {
        logger.error("Failed to generate plan review", {
            userId: ctx.from?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            `❌ Sorry, I couldn't generate a plan review right now. Please try again later.`,
        );
    }
}

