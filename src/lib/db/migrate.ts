import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { db } from "./index";
import { join } from "path";

/**
 * Run database migrations
 * This should be called on application startup
 */
export async function runMigrations(): Promise<void> {
    const migrationsFolder = join(import.meta.dir, "./migrations");

    try {
        console.log("🔄 Running database migrations...");
        migrate(db, { migrationsFolder });
        console.log("✅ Database migrations completed");
    } catch (error) {
        console.error("❌ Failed to run database migrations:", error);
        throw error;
    }
}
