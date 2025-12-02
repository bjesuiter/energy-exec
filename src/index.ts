import { createServer } from "./server";
import { bot } from "./bot";
import { startBot } from "./bot/connection";
import { runMigrations } from "./lib/db/migrate";
import { logger } from "./lib/logger";

const nodeEnv = process.env.NODE_ENV || "development";
const port = parseInt(process.env.PORT || "3000", 10);

async function main() {
    try {
        // Run database migrations first
        await runMigrations();

        // In production, initialize bot before starting server to handle webhooks
        // In development, bot will be started with long polling after server starts
        if (nodeEnv === "production") {
            logger.info("🔧 Initializing bot for production...");
            await bot.init();
            logger.info("✅ Bot initialized");
        }

        // Create server with bot for webhook handling (production)
        const server = createServer(nodeEnv === "production" ? bot : undefined);

        // Start server
        server.listen(port, ({ hostname, port: serverPort }) => {
            logger.info("🦊 Server running", {
                hostname,
                port: serverPort,
                nodeEnv,
            });
        });

        // Start bot (long polling for dev, webhook for prod)
        await startBot();
    } catch (error) {
        logger.error("Failed to start application", {
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        process.exit(1);
    }
}

main().catch((error) => {
    logger.error("Unhandled error in main", {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
    });
    process.exit(1);
});
