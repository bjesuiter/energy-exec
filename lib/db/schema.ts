import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import type { JsonValue } from "./types";

// Config table for storing key-value configuration
export const config = sqliteTable("config", {
    key: text("key").primaryKey(),
    value: text("value", { mode: "json" }).$type<JsonValue>().notNull(),
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Messages table for raw message logging
export const messages = sqliteTable("messages", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    telegramMessageId: integer("telegram_message_id").notNull(),
    direction: text("direction").$type<"incoming" | "outgoing">().notNull(),
    content: text("content").notNull(),
    createdAt: integer("created_at", { mode: "timestamp" }).notNull(),
});

// Daily logs table for structured daily summaries
export const dailyLogs = sqliteTable("daily_logs", {
    id: integer("id").primaryKey({ autoIncrement: true }),
    date: text("date").notNull(), // YYYY-MM-DD format
    bodyBattery: integer("body_battery"), // 0-100, nullable
    sleepNotes: text("sleep_notes"), // nullable
    mood: text("mood", { mode: "json" }).$type<JsonValue>(), // JSON object, nullable
    priorities: text("priorities", { mode: "json" }).$type<JsonValue>(), // JSON array, nullable
    appointments: text("appointments", { mode: "json" }).$type<JsonValue>(), // JSON array, nullable
    generatedPlan: text("generated_plan"), // nullable
    reflections: text("reflections"), // nullable
    updatedAt: integer("updated_at", { mode: "timestamp" }).notNull(),
});

// Type exports for use in services
export type Config = typeof config.$inferSelect;
export type ConfigInsert = typeof config.$inferInsert;

export type Message = typeof messages.$inferSelect;
export type MessageInsert = typeof messages.$inferInsert;

export type DailyLog = typeof dailyLogs.$inferSelect;
export type DailyLogInsert = typeof dailyLogs.$inferInsert;
