import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import * as schema from "./schema";

const databasePath = process.env.DATABASE_PATH || "./data/db.sqlite";

// Create SQLite database connection
export const sqlite = new Database(databasePath);

// Create Drizzle instance with schema
export const db = drizzle(sqlite, { schema });

// Export schema for use in other modules
export * from "./schema";
export * from "./types";
