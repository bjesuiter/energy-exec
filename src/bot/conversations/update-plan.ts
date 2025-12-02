import type { MyContext } from "../index";
import {
    createOrUpdateDailyLog,
    getDailyLog,
} from "@/src/lib/services/daily-log";
import { getConfig } from "@/src/lib/services/config";
import { formatInTimeZone } from "date-fns-tz";
import { logger } from "@/src/lib/logger";
import { generateDayPlan } from "@/src/lib/services/planner";
import { buildPrompt } from "@/src/lib/ai/prompts";
import { getZenGoogle, getZenOpenAICompatible } from "@/src/lib/ai/providers";
import { generateText } from "ai";
import type { ModelType } from "../commands/models";

/**
 * Update plan conversation flow
 * Allows users to update their day plan with changes
 */
export async function updatePlanConversation(
    conversation: any,
    ctx: MyContext,
): Promise<void> {
    try {
        // Get user's timezone
        const timezone = (await getConfig("timezone")) as string | null;
        const tz = timezone || "UTC";

        // Get today's date in UTC for database lookup
        const now = new Date();
        const today = formatInTimeZone(now, "UTC", "yyyy-MM-dd");

        // Get current daily log
        const dailyLog = await getDailyLog(today);

        if (!dailyLog) {
            await ctx.reply(
                `📅 *No daily log found for today*\n\n` +
                    `Use /checkin to create a morning check-in first.`,
                { parse_mode: "Markdown" },
            );
            return;
        }

        if (!dailyLog.generatedPlan) {
            await ctx.reply(
                `📋 *No plan found for today*\n\n` +
                    `Complete your morning check-in with /checkin to generate a plan first.`,
                { parse_mode: "Markdown" },
            );
            return;
        }

        // Ask user what they want to update
        await ctx.reply(
            `📋 *Plan Update*\n\n` +
                `What changed or what would you like to update in your plan?\n\n` +
                `Example: "Meeting cancelled, need to shift work blocks earlier"`,
            { parse_mode: "Markdown" },
        );

        // Wait for user's update message
        const updateCtx = await conversation.waitFor("message:text");
        const updateMessage = updateCtx.message.text.trim();

        if (!updateMessage) {
            await ctx.reply(
                `❌ Please provide details about what you'd like to update.`,
            );
            return;
        }

        // Show processing message
        await ctx.reply(
            `🔄 Processing your plan update...`,
        );

        // Build prompt for diff generation
        const diffPrompt =
            `The user wants to update their day plan. Here's the current plan:

${dailyLog.generatedPlan}

User's update request: ${updateMessage}

Please provide ONLY the changes that need to be made to the plan. Be concise and focus on what's different. Don't repeat the entire plan - just show what changed. Format it clearly so the user can see what's new or modified.`;

        // Get selected model
        const selectedModel = ((await getConfig("model")) as ModelType) ||
            "big-pickle";

        // Generate diff response
        let model;
        if (selectedModel === "gemini-3-pro") {
            const google = getZenGoogle();
            model = google("gemini-3-pro");
        } else {
            const opencodeZen = getZenOpenAICompatible();
            model = opencodeZen("big-pickle");
        }

        const messages = buildPrompt(diffPrompt, {
            timezone: timezone || undefined,
            currentDayLog: dailyLog,
        });

        const diffResult = await generateText({
            model,
            messages: messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
        });

        const diffText = diffResult.text;

        // Send diff to user immediately
        await ctx.reply(
            `📋 *Plan Changes*\n\n${diffText}`,
            { parse_mode: "Markdown" },
        );

        // Regenerate full plan in the background
        try {
            // Regenerate full plan with update context
            logger.debug("Regenerating full plan", {
                userId: ctx.from?.id,
                date: today,
                updateMessage,
            });

            const newPlan = await generateDayPlan(
                dailyLog,
                timezone,
                updateMessage,
            );

            logger.debug("Plan regenerated, saving to database", {
                userId: ctx.from?.id,
                date: today,
                planLength: newPlan.length,
            });

            // Save updated plan
            const updatedLog = await createOrUpdateDailyLog(today, {
                generatedPlan: newPlan,
            });

            logger.info("Plan updated successfully", {
                userId: ctx.from?.id,
                date: today,
                savedPlanLength: updatedLog.generatedPlan?.length || 0,
            });

            // Verify the plan was saved (just check that it exists)
            const verifyLog = await getDailyLog(today);
            if (!verifyLog || !verifyLog.generatedPlan) {
                logger.error("Plan save verification failed - plan missing", {
                    userId: ctx.from?.id,
                    date: today,
                });
                throw new Error("Plan was not saved correctly");
            }

            logger.debug("Plan verification passed", {
                userId: ctx.from?.id,
                date: today,
                planExists: !!verifyLog.generatedPlan,
            });

            // Notify user that plan was updated
            await ctx.reply(
                `✅ *Plan updated*\n\n` +
                    `The full plan has been regenerated and saved. Use /today to view the complete updated plan.`,
                { parse_mode: "Markdown" },
            );
        } catch (error) {
            logger.error("Failed to regenerate plan", {
                userId: ctx.from?.id,
                date: today,
                error: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined,
            });
            await ctx.reply(
                `⚠️ I showed you the changes, but couldn't regenerate the full plan right now.\n\n` +
                    `The changes are shown above. You can ask me to regenerate the plan again later.`,
            );
        }
    } catch (error) {
        logger.error("Failed to update plan", {
            userId: ctx.from?.id,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            `❌ Sorry, I couldn't process your plan update. Please try again later.`,
        );
    }
}
