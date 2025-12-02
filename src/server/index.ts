import { Elysia } from "elysia";
import packageJson from "@/package.json";

const port = parseInt(process.env.PORT || "3000", 10);

/**
 * Create and configure Elysia server
 */
export function createServer() {
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

    return app;
}

/**
 * Start the Elysia server
 */
export function startServer(app: Elysia) {
    app.listen(port, ({ hostname, port: serverPort }) => {
        console.log(`🦊 Server running at http://${hostname}:${serverPort}`);
    });
}
