import type { MyContext } from "../index";
import { setConfig } from "@/src/lib/services/config";
import { logger } from "@/src/lib/logger";

/**
 * Validates if a timezone string is valid
 * Accepts IANA timezone identifiers (e.g., "America/New_York", "Europe/Berlin")
 * or common abbreviations (e.g., "UTC", "EST", "PST")
 */
function isValidTimezone(timezone: string): boolean {
    // Basic validation - check if it's a non-empty string
    if (
        !timezone || typeof timezone !== "string" ||
        timezone.trim().length === 0
    ) {
        return false;
    }

    // Try to create a date with the timezone to validate it
    try {
        const testDate = new Date();
        const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone: timezone.trim(),
        });
        formatter.format(testDate);
        return true;
    } catch {
        return false;
    }
}

/**
 * Onboarding conversation flow
 * Asks user for their timezone and stores it in config
 */
export async function onboardingConversation(
    conversation: any,
    ctx: MyContext,
): Promise<void> {
    await ctx.reply(
        `👋 Welcome! Let's get you set up.\n\n` +
            `I need to know your timezone to help you plan your day effectively.\n\n` +
            `Please send me your timezone. Examples:\n` +
            `• America/New_York\n` +
            `• Europe/Berlin\n` +
            `• Asia/Tokyo\n` +
            `• UTC\n\n` +
            `You can find your timezone at: https://en.wikipedia.org/wiki/List_of_tz_database_time_zones`,
    );

    let timezone: string | undefined;

    // Wait for user to provide timezone
    while (!timezone) {
        const timezoneCtx = await conversation.waitFor("message:text");

        const input = timezoneCtx.message.text.trim();

        if (isValidTimezone(input)) {
            timezone = input;
        } else {
            await timezoneCtx.reply(
                `❌ That doesn't look like a valid timezone.\n\n` +
                    `Please try again with a valid IANA timezone identifier.\n` +
                    `Examples: America/New_York, Europe/Berlin, Asia/Tokyo, UTC`,
            );
        }
    }

    // Store timezone in config
    try {
        await setConfig("timezone", timezone);
        logger.info("User onboarded successfully", {
            userId: ctx.from?.id,
            timezone,
        });

        await ctx.reply(
            `✅ Great! Your timezone has been set to: ${timezone}\n\n` +
                `You're all set up! You can now start using Energy Exec to plan your days.\n\n` +
                `Send /help to see available commands.`,
        );
    } catch (error) {
        logger.error("Failed to save timezone", {
            userId: ctx.from?.id,
            timezone,
            error: error instanceof Error ? error.message : String(error),
        });
        await ctx.reply(
            `❌ Sorry, I couldn't save your timezone. Please try again later or contact support.`,
        );
    }
}
