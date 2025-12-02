import { beforeEach, describe, expect, it, mock } from "bun:test";
import { DefaultMessageHandler } from "@/src/lib/message-handler";
import type { MessageContext } from "@/src/lib/interfaces";
import * as telegramMessageLog from "@/src/lib/services/telegram-message-log";

// Mock the telegram message log service
mock.module("@/src/lib/services/telegram-message-log", () => ({
    logTelegramMessage: mock(() => Promise.resolve()),
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
    });

    it("should handle a simple text message", async () => {
        const response = await handler.handleMessage("Hello!", context);

        expect(response.text).toContain("Hello!");
        expect(response.text).toContain("You said:");
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
        // Reset mock to clear previous calls
        (telegramMessageLog.logTelegramMessage as ReturnType<typeof mock>)
            .mockClear();

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

        expect(response.text).toBeTruthy();
        expect(response.text).toContain('You said: ""');
    });

    it("should handle long messages", async () => {
        const longMessage = "A".repeat(1000);
        const response = await handler.handleMessage(longMessage, context);

        expect(response.text).toContain(longMessage);
    });
});
