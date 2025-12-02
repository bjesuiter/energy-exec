import { createServer } from "./server";
import { bot } from "./bot";
import { startBot } from "./bot/connection";

const nodeEnv = process.env.NODE_ENV || "development";
const port = parseInt(process.env.PORT || "3000", 10);

async function main() {
    // Create server with bot for webhook handling (production)
    const server = createServer(nodeEnv === "production" ? bot : undefined);

    // Start server
    server.listen(port, ({ hostname, port: serverPort }) => {
        console.log(`🦊 Server running at http://${hostname}:${serverPort}`);
    });

    // Start bot (long polling for dev, webhook for prod)
    await startBot();
}

main().catch((error) => {
    console.error("Failed to start application:", error);
    process.exit(1);
});
