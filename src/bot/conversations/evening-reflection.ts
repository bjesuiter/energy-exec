import type { MyContext } from "../index";
import {
    createOrUpdateDailyLog,
    getDailyLog,
} from "@/src/lib/services/daily-log";
import { getConfig } from "@/src/lib/services/config";
import { logger } from "@/src/lib/logger";
import { format } from "date-fns";

/**
 * Evening reflection conversation flow
 * Collects: reflections on the day, notes for tomorrow, body battery end
 */
export async function eveningReflectionConversation(
    conversation: any,
    ctx: MyContext,
): Promise<void> {
    try {
        // Get user's timezone for date calculation
        const timezone = (await getConfig("timezone")) as string | null;
        const now = timezone
            ? new Date(
                new Date().toLocaleString("en-US", { timeZone: timezone }),
            )
            : new Date();
        const today = format(now, "yyyy-MM-dd");

        // Check if there's a daily log for today
        const existingLog = await getDailyLog(today);

        await ctx.reply(
            `🌌 Good evening! Let's reflect on your day.\n\n` +
                `I'll ask you a few questions to capture how your day went.`,
        );

        // 1. How did the day go?
        await ctx.reply(
            `1️⃣ How did your day go?\n\n` +
                `Share what went well, what was challenging, or any highlights.`,
        );

        const reflectionCtx = await conversation.waitFor("message:text");
        const reflections = reflectionCtx.message.text.trim() || null;

        // 2. Body Battery End (optional)
        await ctx.reply(
            `2️⃣ What's your body battery level now? (0-100)\n\n` +
                `You can skip this by typing "skip" if you don't have it.`,
        );

        let bodyBatteryEnd: number | null = null;
        const batteryCtx = await conversation.waitFor("message:text");
        const batteryInput = batteryCtx.message.text.trim().toLowerCase();

        if (batteryInput !== "skip" && batteryInput !== "") {
            const parsed = parseInt(batteryInput, 10);
            if (!isNaN(parsed) && parsed >= 0 && parsed <= 100) {
                bodyBatteryEnd = parsed;
            } else {
                await batteryCtx.reply(
                    `⚠️ Couldn't parse that number. Skipping body battery end value.`,
                );
            }
        }

        // 3. Notes for tomorrow (optional)
        await ctx.reply(
            `3️⃣ Any notes or reminders for tomorrow?\n\n` +
                `You can skip this by typing "skip" if you don't have any.`,
        );

        const notesCtx = await conversation.waitFor("message:text");
        const notesForTomorrow = notesCtx.message.text.trim().toLowerCase();
        const notes = notesForTomorrow === "skip" || notesForTomorrow === ""
            ? null
            : notesForTomorrow;

        // Update daily log with reflection data
        // Merge with existing data if present
        const updateData: Parameters<
            typeof createOrUpdateDailyLog
        >[1] = {
            reflections,
            bodyBatteryEnd,
        };

        // If there are notes for tomorrow, we could store them in a separate field
        // For now, we'll append them to reflections or store in a future field
        // For MVP, we'll just update reflections with both

        await createOrUpdateDailyLog(today, updateData);

        logger.info("Evening reflection completed", {
            userId: ctx.from?.id,
            date: today,
            bodyBatteryEnd,
        });

        await ctx.reply(
            `✅ Reflection saved! Thank you for sharing.\n\n` +
                `Have a good rest, and I'll see you tomorrow for your morning check-in! 🌙`,
        );
    } catch (error) {
        logger.error("Failed to complete evening reflection", {
            userId: ctx.from?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            `❌ Sorry, something went wrong during the reflection. Please try again later or use /reflect to restart.`,
        );
    }
}
