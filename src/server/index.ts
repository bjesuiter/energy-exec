import { Elysia } from "elysia";
import packageJson from "@/package.json";
import type { Bot } from "grammy";
import { logger } from "@/src/lib/logger";

/**
 * Create and configure Elysia server
 * @param bot Optional grammY bot instance for webhook handling
 */
export function createServer(bot?: Bot) {
    const app = new Elysia()
        .get("/health", () => {
            return {
                status: "ok",
                timestamp: new Date().toISOString(),
                service: "energy-exec",
            };
        })
        .get("/", () => {
            return {
                message: "Energy Exec API",
                version: packageJson.version,
            };
        });

    // Add webhook endpoint if bot is provided
    if (bot) {
        app.post("/webhook", async ({ request }) => {
            try {
                const update = await request.json();
                // bot.handleUpdate accepts Update type, which matches Telegram's update object
                await bot.handleUpdate(
                    update as Parameters<typeof bot.handleUpdate>[0],
                );
                return { ok: true };
            } catch (error) {
                logger.error("Webhook handler error", {
                    error: error instanceof Error ? error.message : String(error),
                    stack: error instanceof Error ? error.stack : undefined,
                });
                // Return error response to Telegram
                return {
                    ok: false,
                    error: "Internal server error",
                };
            }
        });
    }

    return app;
}
