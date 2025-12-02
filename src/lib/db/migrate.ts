import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";
import { join } from "path";
import { logger } from "../logger";

/**
 * Run database migrations
 * This should be called on application startup
 */
export async function runMigrations(): Promise<void> {
    const migrationsFolder = join(import.meta.dir, "./migrations");

    try {
        logger.info("🔄 Running database migrations", { migrationsFolder });
        migrate(db, { migrationsFolder });
        logger.info("✅ Database migrations completed");
    } catch (error) {
        logger.error("Failed to run database migrations", {
            migrationsFolder,
            error: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
        throw error;
    }
}
