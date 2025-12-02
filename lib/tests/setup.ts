import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import * as schema from "../db/schema";
import { join } from "path";

/**
 * Create an in-memory SQLite database for testing
 * @returns Object containing the database instance and Drizzle db client
 */
export function createTestDatabase() {
    // Create in-memory SQLite database
    const sqlite = new Database(":memory:");

    // Create Drizzle instance with schema
    const db = drizzle(sqlite, { schema });

    // Run migrations to set up tables
    const migrationsFolder = join(import.meta.dir, "../db/migrations");

    migrate(db, { migrationsFolder });

    return { sqlite, db };
}
