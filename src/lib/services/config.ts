import { eq } from "drizzle-orm";
import { config, db } from "../db";
import type { JsonValue } from "../db/types";

/**
 * Get a configuration value by key
 * @param key Configuration key
 * @returns The configuration value, or null if not found
 */
export async function getConfig(key: string): Promise<JsonValue | null> {
    const result = await db.select().from(config).where(eq(config.key, key))
        .limit(1).all();

    if (result.length === 0) {
        return null;
    }

    return result[0].value;
}

/**
 * Set a configuration value (insert or update)
 * @param key Configuration key
 * @param value Configuration value (will be serialized as JSON)
 */
export async function setConfig(key: string, value: JsonValue): Promise<void> {
    const now = new Date();

    await db
        .insert(config)
        .values({
            key,
            value,
            updatedAt: now,
        })
        .onConflictDoUpdate({
            target: config.key,
            set: {
                value,
                updatedAt: now,
            },
        })
        .run();
}

/**
 * Delete a configuration entry by key
 * @param key Configuration key to delete
 */
export async function deleteConfig(key: string): Promise<void> {
    await db.delete(config).where(eq(config.key, key)).run();
}
