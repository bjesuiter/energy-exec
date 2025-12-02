import { buildPrompt } from "../ai/prompts";
import { getConfig } from "./config";
import { getZenGoogle, getZenOpenAICompatible } from "../ai/providers";
import { generateText } from "ai";
import type { ModelType } from "@/src/bot/commands/models";
import { logger } from "../logger";
import type { DailyLog } from "../db";

/**
 * Generate a day plan based on check-in data
 * @param dailyLog The daily log with check-in information
 * @param timezone User's timezone
 * @param updateContext Optional context about what changed (for plan updates)
 * @returns Generated day plan text
 */
export async function generateDayPlan(
    dailyLog: DailyLog,
    timezone?: string | null,
    updateContext?: string,
): Promise<string> {
    try {
        // Build a specific prompt for plan generation
        let planPrompt =
            `Based on my morning check-in, generate a structured day plan for me. 

Consider:
- My body battery level: ${dailyLog.bodyBatteryStart ?? "not provided"}
- Sleep quality: ${dailyLog.sleepNotes || "not provided"}
- Current mood/energy: ${
                dailyLog.mood
                    ? (typeof dailyLog.mood === "string"
                        ? dailyLog.mood
                        : (dailyLog.mood as any).text)
                    : "not provided"
            }
- Priorities: ${
                dailyLog.priorities
                    ? (Array.isArray(dailyLog.priorities)
                        ? dailyLog.priorities.join(", ")
                        : String(dailyLog.priorities))
                    : "not provided"
            }
- Appointments: ${
                dailyLog.appointments
                    ? (Array.isArray(dailyLog.appointments)
                        ? dailyLog.appointments.join(", ")
                        : String(dailyLog.appointments))
                    : "none"
            }`;

        // Add update context if provided
        if (updateContext) {
            planPrompt += `\n\nImportant update: ${updateContext}`;
        }

        planPrompt += `\n\nPlease create a day plan that includes:
1. Suggested work blocks (timing and duration based on energy levels)
2. Break times
3. Tea/caffeine recommendations with timing
4. Integration of appointments/meetings
5. When to tackle priorities based on energy

Format the plan clearly with times and be specific about durations. Use a friendly, encouraging tone.`;

        // Build prompt with context
        const messages = buildPrompt(planPrompt, {
            timezone: timezone || undefined,
            currentDayLog: dailyLog,
        });

        // Get selected model (default to big-pickle)
        const selectedModel = ((await getConfig("model")) as ModelType) ||
            "big-pickle";

        logger.debug("Generating day plan", {
            model: selectedModel,
            bodyBattery: dailyLog.bodyBatteryStart,
        });

        let model;
        if (selectedModel === "gemini-3-pro") {
            const google = getZenGoogle();
            model = google("gemini-3-pro");
        } else {
            const opencodeZen = getZenOpenAICompatible();
            model = opencodeZen("big-pickle");
        }

        const result = await generateText({
            model,
            messages: messages.map((msg) => ({
                role: msg.role,
                content: msg.content,
            })),
        });

        const planText = result.text;

        logger.info("Day plan generated", {
            planLength: planText.length,
            model: selectedModel,
        });

        return planText;
    } catch (error) {
        logger.error("Failed to generate day plan", {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
