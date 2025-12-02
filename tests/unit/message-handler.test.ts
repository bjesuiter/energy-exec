import { beforeEach, describe, expect, it, mock } from "bun:test";
import { DefaultMessageHandler } from "@/src/lib/message-handler";
import type { MessageContext } from "@/src/lib/interfaces";
import * as telegramMessageLog from "@/src/lib/services/telegram-message-log";
import * as configService from "@/src/lib/services/config";
import { generateText } from "ai";

// Mock the telegram message log service
mock.module("@/src/lib/services/telegram-message-log", () => ({
    logTelegramMessage: mock(() => Promise.resolve()),
}));

// Mock the config service
mock.module("@/src/lib/services/config", () => ({
    getConfig: mock(() => Promise.resolve(null)),
}));

// Mock the AI providers
mock.module("@/src/lib/ai/providers", () => ({
    getOpencodeZen: mock(() => {
        // Return a function that can be called with model name
        return mock(() => ({}));
    }),
}));

// Mock the AI SDK
mock.module("ai", () => ({
    generateText: mock(() => Promise.resolve({ text: "Mock AI response" })),
}));

describe("DefaultMessageHandler", () => {
    let handler: DefaultMessageHandler;
    let context: MessageContext;

    beforeEach(() => {
        handler = new DefaultMessageHandler();
        context = {
            userId: 12345,
            messageId: 100,
            timestamp: Date.now(),
        };
        // Reset mocks
        (telegramMessageLog.logTelegramMessage as ReturnType<typeof mock>)
            .mockClear();
        (configService.getConfig as ReturnType<typeof mock>).mockClear();
        (generateText as ReturnType<typeof mock>).mockClear();
        // Reset generateText to default success response
        (generateText as ReturnType<typeof mock>).mockResolvedValue({
            text: "Mock AI response",
        });
    });

    it("should handle a simple text message", async () => {
        const response = await handler.handleMessage("Hello!", context);

        expect(response.text).toBe("Mock AI response");
    });

    it("should log incoming message", async () => {
        await handler.handleMessage("Test message", context);

        expect(telegramMessageLog.logTelegramMessage).toHaveBeenCalledWith({
            telegramMessageId: context.messageId,
            direction: "incoming",
            content: "Test message",
        });
    });

    it("should log outgoing response", async () => {
        const response = await handler.handleMessage("Test", context);

        expect(telegramMessageLog.logTelegramMessage).toHaveBeenCalledTimes(2);
        expect(telegramMessageLog.logTelegramMessage).toHaveBeenLastCalledWith({
            telegramMessageId: context.messageId + 1,
            direction: "outgoing",
            content: response.text,
        });
    });

    it("should handle empty message", async () => {
        const response = await handler.handleMessage("", context);

        expect(response.text).toBe("Mock AI response");
    });

    it("should handle long messages", async () => {
        const longMessage = "A".repeat(1000);
        const response = await handler.handleMessage(longMessage, context);

        expect(response.text).toBe("Mock AI response");
    });

    it("should return fallback message on AI error", async () => {
        // Mock generateText to throw an error
        (generateText as ReturnType<typeof mock>).mockRejectedValueOnce(
            new Error("AI service unavailable"),
        );

        const response = await handler.handleMessage("Test", context);

        expect(response.text).toContain("Sorry");
        expect(response.text).toContain("trouble");
    });

    it("should include timezone in prompt when available", async () => {
        (configService.getConfig as ReturnType<typeof mock>).mockResolvedValue(
            "America/New_York",
        );

        await handler.handleMessage("plan my day", context);

        // Verify config was called
        expect(configService.getConfig).toHaveBeenCalledWith("timezone");
    });
});
