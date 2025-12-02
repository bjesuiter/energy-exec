import { bot } from "./index";
import { logger } from "@/src/lib/logger";

const nodeEnv = process.env.NODE_ENV || "development";
const webhookUrl = process.env.WEBHOOK_URL;

/**
 * Start the bot using long polling (for development)
 */
export async function startLongPolling(): Promise<void> {
    try {
        logger.info("🔄 Starting bot with long polling (development mode)");
        await bot.start();
        logger.info("✅ Bot is running with long polling");
    } catch (error) {
        logger.error("Failed to start bot with long polling", {
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

/**
 * Set up webhook and return the webhook info (for production)
 */
export async function setupWebhook(): Promise<void> {
    if (!webhookUrl) {
        const error = new Error(
            "WEBHOOK_URL environment variable is required for production mode",
        );
        logger.error("Webhook setup failed", {
            error: error.message,
        });
        throw error;
    }

    try {
        logger.info("🔗 Setting up webhook", { webhookUrl });
        await bot.api.setWebhook(webhookUrl);
        logger.info("✅ Webhook configured successfully");
    } catch (error) {
        logger.error("Failed to set up webhook", {
            webhookUrl,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}

/**
 * Start the bot based on NODE_ENV
 * - Development: Long polling
 * - Production: Webhook (requires WEBHOOK_URL)
 */
export async function startBot(): Promise<void> {
    try {
        if (nodeEnv === "production") {
            await setupWebhook();
        } else {
            await startLongPolling();
        }
    } catch (error) {
        logger.error("Failed to start bot", {
            nodeEnv,
            error: error instanceof Error ? error.message : String(error),
        });
        throw error;
    }
}
