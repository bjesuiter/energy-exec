import { bot } from "./index";

const nodeEnv = process.env.NODE_ENV || "development";
const webhookUrl = process.env.WEBHOOK_URL;

/**
 * Start the bot using long polling (for development)
 */
export async function startLongPolling(): Promise<void> {
    console.log("🔄 Starting bot with long polling (development mode)");
    await bot.start();
    console.log("✅ Bot is running with long polling");
}

/**
 * Set up webhook and return the webhook info (for production)
 */
export async function setupWebhook(): Promise<void> {
    if (!webhookUrl) {
        throw new Error(
            "WEBHOOK_URL environment variable is required for production mode",
        );
    }

    console.log(`🔗 Setting up webhook: ${webhookUrl}`);
    await bot.api.setWebhook(webhookUrl);
    console.log("✅ Webhook configured successfully");
}

/**
 * Start the bot based on NODE_ENV
 * - Development: Long polling
 * - Production: Webhook (requires WEBHOOK_URL)
 */
export async function startBot(): Promise<void> {
    if (nodeEnv === "production") {
        await setupWebhook();
    } else {
        await startLongPolling();
    }
}
