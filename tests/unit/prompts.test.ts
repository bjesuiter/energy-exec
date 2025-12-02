import { describe, it, expect } from "bun:test";
import { BASE_SYSTEM_PROMPT, buildPrompt } from "@/src/lib/ai/prompts";

describe("AI Prompts", () => {
    describe("BASE_SYSTEM_PROMPT", () => {
        it("should contain key information about Energy Exec", () => {
            expect(BASE_SYSTEM_PROMPT).toContain("Energy Exec");
            expect(BASE_SYSTEM_PROMPT).toContain("energy levels");
            expect(BASE_SYSTEM_PROMPT).toContain("daily plans");
        });
    });

    describe("buildPrompt", () => {
        it("should build basic prompt with user message", () => {
            const messages = buildPrompt("Hello!");

            expect(messages).toHaveLength(2);
            expect(messages[0].role).toBe("system");
            expect(messages[0].content).toContain(BASE_SYSTEM_PROMPT);
            expect(messages[1].role).toBe("user");
            expect(messages[1].content).toBe("Hello!");
        });

        it("should include timezone in system prompt when provided", () => {
            const messages = buildPrompt("What's my schedule?", {
                timezone: "America/New_York",
            });

            expect(messages[0].content).toContain("timezone");
            expect(messages[0].content).toContain("America/New_York");
        });

        it("should include current day log when provided", () => {
            const dayLog = {
                date: "2025-12-02",
                bodyBatteryStart: 75,
                bodyBatteryEnd: 60,
            };

            const messages = buildPrompt("Plan my day", {
                currentDayLog: dayLog,
            });

            expect(messages[0].content).toContain("Current day's information");
            expect(messages[0].content).toContain("2025-12-02");
            expect(messages[0].content).toContain("75");
        });

        it("should include recent history when provided", () => {
            const history = [
                { date: "2025-12-01", bodyBatteryStart: 80 },
                { date: "2025-11-30", bodyBatteryStart: 70 },
            ];

            const messages = buildPrompt("How have I been?", {
                recentHistory: history,
            });

            expect(messages[0].content).toContain("Recent history");
            expect(messages[0].content).toContain("2025-12-01");
        });

        it("should include all context when all provided", () => {
            const messages = buildPrompt("Help me plan", {
                timezone: "Europe/Berlin",
                currentDayLog: { date: "2025-12-02" },
                recentHistory: [{ date: "2025-12-01" }],
            });

            expect(messages[0].content).toContain("Europe/Berlin");
            expect(messages[0].content).toContain("Current day's information");
            expect(messages[0].content).toContain("Recent history");
        });
    });
});

