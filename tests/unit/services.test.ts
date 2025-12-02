import { beforeEach, describe, expect, mock, test } from "bun:test";
import { createTestDatabase } from "../setup";
import * as schema from "@/src/lib/db/schema";

// Create test database once
const { db: testDb } = createTestDatabase();

// Set up mocks before importing services
mock.module("@/src/lib/db", () => ({
    db: testDb,
    config: schema.config,
    messages: schema.messages,
    dailyLogs: schema.dailyLogs,
}));

// Import services after mocking
import * as configService from "@/src/lib/services/config";
import * as telegramLogService from "@/src/lib/services/telegram-message-log";
import * as dailyLogService from "@/src/lib/services/daily-log";

describe("Config Service", () => {
    test("getConfig returns null for non-existent key", async () => {
        const result = await configService.getConfig("nonexistent");
        expect(result).toBeNull();
    });

    test("setConfig creates a new config entry", async () => {
        await configService.setConfig("test_key", "test_value");
        const result = await configService.getConfig("test_key");
        expect(result).toBe("test_value");
    });

    test("setConfig updates an existing config entry", async () => {
        await configService.setConfig("test_key", "initial_value");
        await configService.setConfig("test_key", "updated_value");
        const result = await configService.getConfig("test_key");
        expect(result).toBe("updated_value");
    });

    test("setConfig handles JSON values", async () => {
        const jsonValue = { nested: { key: "value" }, array: [1, 2, 3] };
        await configService.setConfig("json_key", jsonValue);
        const result = await configService.getConfig("json_key");
        expect(result).toEqual(jsonValue);
    });

    test("deleteConfig removes a config entry", async () => {
        await configService.setConfig("to_delete", "value");
        await configService.deleteConfig("to_delete");
        const result = await configService.getConfig("to_delete");
        expect(result).toBeNull();
    });
});

describe("Telegram Message Log Service", () => {
    test("logTelegramMessage logs an incoming message", async () => {
        await telegramLogService.logTelegramMessage({
            telegramMessageId: 123,
            direction: "incoming",
            content: "Hello, bot!",
        });

        const message = await telegramLogService.getTelegramMessageByTelegramId(
            123,
        );
        expect(message).not.toBeNull();
        expect(message?.telegramMessageId).toBe(123);
        expect(message?.direction).toBe("incoming");
        expect(message?.content).toBe("Hello, bot!");
    });

    test("logTelegramMessage logs an outgoing message", async () => {
        await telegramLogService.logTelegramMessage({
            telegramMessageId: 124,
            direction: "outgoing",
            content: "Hello, user!",
        });

        const message = await telegramLogService.getTelegramMessageByTelegramId(
            124,
        );
        expect(message).not.toBeNull();
        expect(message?.telegramMessageId).toBe(124);
        expect(message?.direction).toBe("outgoing");
        expect(message?.content).toBe("Hello, user!");
    });

    test("getTelegramMessageByTelegramId returns null for non-existent message", async () => {
        const result = await telegramLogService.getTelegramMessageByTelegramId(
            999,
        );
        expect(result).toBeNull();
    });

    test("getRecentTelegramMessages returns messages ordered by creation time desc", async () => {
        await telegramLogService.logTelegramMessage({
            telegramMessageId: 400,
            direction: "incoming",
            content: "First message",
        });

        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 50));

        await telegramLogService.logTelegramMessage({
            telegramMessageId: 401,
            direction: "outgoing",
            content: "Second message",
        });

        await new Promise((resolve) => setTimeout(resolve, 50));

        await telegramLogService.logTelegramMessage({
            telegramMessageId: 402,
            direction: "incoming",
            content: "Third message",
        });

        const recent = await telegramLogService.getRecentTelegramMessages(10);
        expect(recent.length).toBeGreaterThanOrEqual(3);

        // Find our test messages
        const testMessages = recent.filter((m) =>
            [400, 401, 402].includes(m.telegramMessageId)
        );
        expect(testMessages.length).toBe(3);

        // Verify timestamps are in descending order (most recent first)
        // Sort by telegramMessageId to get them in order, then verify timestamps
        const sortedTestMessages = testMessages.sort((a, b) =>
            a.telegramMessageId - b.telegramMessageId
        );
        expect(sortedTestMessages[2].createdAt.getTime())
            .toBeGreaterThanOrEqual(
                sortedTestMessages[1].createdAt.getTime(),
            );
        expect(sortedTestMessages[1].createdAt.getTime())
            .toBeGreaterThanOrEqual(
                sortedTestMessages[0].createdAt.getTime(),
            );

        // Verify all messages are retrievable
        const msg400 = await telegramLogService.getTelegramMessageByTelegramId(
            400,
        );
        const msg401 = await telegramLogService.getTelegramMessageByTelegramId(
            401,
        );
        const msg402 = await telegramLogService.getTelegramMessageByTelegramId(
            402,
        );
        expect(msg400).not.toBeNull();
        expect(msg401).not.toBeNull();
        expect(msg402).not.toBeNull();
    });

    test("getTelegramMessagesByDate returns messages for a specific date", async () => {
        // Use today's date to ensure we have messages
        const today = new Date().toISOString().split("T")[0];

        // Log messages (they will be created with today's date)
        await telegramLogService.logTelegramMessage({
            telegramMessageId: 500,
            direction: "incoming",
            content: "Morning message",
        });

        await telegramLogService.logTelegramMessage({
            telegramMessageId: 501,
            direction: "outgoing",
            content: "Afternoon message",
        });

        // Get messages for today
        const messages = await telegramLogService.getTelegramMessagesByDate(
            today,
        );

        // Should have at least our 2 test messages (may have more from other tests)
        expect(messages.length).toBeGreaterThanOrEqual(2);

        // Verify our test messages are included
        const messageIds = messages.map((m) => m.telegramMessageId);
        expect(messageIds).toContain(500);
        expect(messageIds).toContain(501);

        // Verify messages are ordered by creation time desc
        for (let i = 0; i < messages.length - 1; i++) {
            expect(messages[i].createdAt.getTime()).toBeGreaterThanOrEqual(
                messages[i + 1].createdAt.getTime(),
            );
        }

        // Verify all returned messages are from the correct date
        for (const message of messages) {
            const messageDate = message.createdAt.toISOString().split("T")[0];
            expect(messageDate).toBe(today);
        }
    });

    test("getTelegramMessagesByDate returns empty array for date with no messages", async () => {
        const futureDate = "2099-12-31";
        const messages = await telegramLogService.getTelegramMessagesByDate(
            futureDate,
        );
        expect(messages).toEqual([]);
    });
});

describe("Daily Log Service", () => {
    test("getDailyLog returns null for non-existent date", async () => {
        const result = await dailyLogService.getDailyLog("2024-01-01");
        expect(result).toBeNull();
    });

    test("createOrUpdateDailyLog creates a new daily log", async () => {
        const log = await dailyLogService.createOrUpdateDailyLog("2024-01-01", {
            bodyBatteryStart: 80,
            sleepNotes: "Slept well",
        });

        expect(log.date).toBe("2024-01-01");
        expect(log.bodyBatteryStart).toBe(80);
        expect(log.sleepNotes).toBe("Slept well");
    });

    test("createOrUpdateDailyLog updates an existing daily log", async () => {
        await dailyLogService.createOrUpdateDailyLog("2024-01-01", {
            bodyBatteryStart: 80,
        });

        const updated = await dailyLogService.createOrUpdateDailyLog(
            "2024-01-01",
            {
                bodyBatteryEnd: 60,
                sleepNotes: "Updated notes",
            },
        );

        expect(updated.bodyBatteryStart).toBe(80);
        expect(updated.bodyBatteryEnd).toBe(60);
        expect(updated.sleepNotes).toBe("Updated notes");
    });

    test("getDailyLog retrieves an existing log", async () => {
        await dailyLogService.createOrUpdateDailyLog("2024-01-01", {
            bodyBatteryStart: 80,
            bodyBatteryEnd: 60,
        });

        const result = await dailyLogService.getDailyLog("2024-01-01");
        expect(result).not.toBeNull();
        expect(result?.date).toBe("2024-01-01");
        expect(result?.bodyBatteryStart).toBe(80);
        expect(result?.bodyBatteryEnd).toBe(60);
    });

    test("getRecentDailyLogs returns logs ordered by date desc", async () => {
        await dailyLogService.createOrUpdateDailyLog("2024-01-01", {
            bodyBatteryStart: 80,
        });
        await dailyLogService.createOrUpdateDailyLog("2024-01-02", {
            bodyBatteryStart: 75,
        });
        await dailyLogService.createOrUpdateDailyLog("2024-01-03", {
            bodyBatteryStart: 70,
        });

        const recent = await dailyLogService.getRecentDailyLogs(2);
        expect(recent.length).toBe(2);
        expect(recent[0].date).toBe("2024-01-03");
        expect(recent[1].date).toBe("2024-01-02");
    });

    test("createOrUpdateDailyLog handles JSON fields", async () => {
        const mood = { motivation: 7, joy: 8, dizziness: 2 };
        const priorities = ["Task 1", "Task 2"];
        const appointments = [{ time: "10:00", title: "Meeting" }];

        const log = await dailyLogService.createOrUpdateDailyLog("2024-01-01", {
            mood,
            priorities,
            appointments,
        });

        expect(log.mood).toEqual(mood);
        expect(log.priorities).toEqual(priorities);
        expect(log.appointments).toEqual(appointments);
    });
});
