import type { MyContext } from "../index";
import { createOrUpdateDailyLog } from "@/src/lib/services/daily-log";
import { getConfig } from "@/src/lib/services/config";
import { logger } from "@/src/lib/logger";
import { format } from "date-fns";

/**
 * Parses body battery value from text
 */
function parseBodyBattery(text: string): number | null {
    const num = parseInt(text.trim(), 10);
    if (isNaN(num) || num < 0 || num > 100) {
        return null;
    }
    return num;
}

/**
 * Morning check-in conversation flow
 * Collects: body battery, sleep notes, mood, priorities, appointments
 */
export async function morningCheckinConversation(
    conversation: any,
    ctx: MyContext,
): Promise<void> {
    try {
        // Get user's timezone for date calculation
        const timezone = (await getConfig("timezone")) as string | null;
        const now = timezone
            ? new Date(
                new Date().toLocaleString("de-DE", { timeZone: timezone }),
            )
            : new Date();
        const today = format(now, "yyyy-MM-dd");

        await ctx.reply(
            `🌅 Good morning! Let's start your day with a quick check-in.\n\n` +
                `I'll ask you a few questions to understand your energy levels and priorities for today.`,
        );

        // 1. Body Battery
        let bodyBatteryStart: number | null = null;
        await ctx.reply(
            `1️⃣ What's your body battery level this morning? (0-100)\n\n` +
                `This is typically from your Garmin watch, or you can estimate based on how you feel.`,
        );

        while (bodyBatteryStart === null) {
            const batteryCtx = await conversation.waitFor("message:text");
            const input = batteryCtx.message.text.trim();

            const parsed = parseBodyBattery(input);
            if (parsed !== null) {
                bodyBatteryStart = parsed;
            } else {
                await batteryCtx.reply(
                    `❌ Please enter a number between 0 and 100.\n\n` +
                        `Examples: 75, 50, 100`,
                );
            }
        }

        // 2. Sleep Notes
        await ctx.reply(
            `2️⃣ How was your sleep last night?\n\n` +
                `Tell me about sleep quality, duration, or any issues (e.g., "7 hours, woke up twice", "restless, only 5 hours").`,
        );

        const sleepCtx = await conversation.waitFor("message:text");
        const sleepNotes = sleepCtx.message.text.trim() || null;

        // 3. Current Mood/Feeling
        await ctx.reply(
            `3️⃣ How are you feeling right now?\n\n` +
                `Describe your current state - motivation level, energy, mood, any physical sensations (e.g., "motivated but tired", "dizzy, low energy", "energetic and focused").`,
        );

        const moodCtx = await conversation.waitFor("message:text");
        const moodText = moodCtx.message.text.trim() || null;
        // Store mood as JSON object (can be parsed/extracted later)
        const mood = moodText ? { text: moodText } : null;

        // 4. Most Important Task
        await ctx.reply(
            `4️⃣ What's the most important task you need to accomplish today?`,
        );

        const priorityCtx = await conversation.waitFor("message:text");
        const priorityText = priorityCtx.message.text.trim() || null;
        // Store as JSON array (can add more priorities later)
        const priorities = priorityText ? [priorityText] : null;

        // 5. Appointments/Meetings
        await ctx.reply(
            `5️⃣ Do you have any important appointments or meetings today?\n\n` +
                `List them or say "none" if you don't have any.\n` +
                `Examples: "Meeting at 2pm", "Doctor appointment at 10am", "none"`,
        );

        const appointmentsCtx = await conversation.waitFor("message:text");
        const appointmentsText = appointmentsCtx.message.text.trim()
            .toLowerCase();
        // Parse appointments - if "none", store null, otherwise store as array
        const appointments =
            appointmentsText === "none" || appointmentsText === "no"
                ? null
                : appointmentsText
                ? [appointmentsText]
                : null;

        // Save to daily log
        await createOrUpdateDailyLog(today, {
            bodyBatteryStart,
            sleepNotes,
            mood,
            priorities,
            appointments,
        });

        logger.info("Morning check-in completed", {
            userId: ctx.from?.id,
            date: today,
            bodyBatteryStart,
        });

        await ctx.reply(
            `✅ Check-in complete! I've saved your information for today.\n\n` +
                `Would you like me to generate a day plan based on your energy levels? Just send me a message and I'll help you plan your day!`,
        );
    } catch (error) {
        logger.error("Failed to complete morning check-in", {
            userId: ctx.from?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            `❌ Sorry, something went wrong during the check-in. Please try again later or use /checkin to restart.`,
        );
    }
}
