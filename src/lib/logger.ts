import { format } from "date-fns";

/**
 * Simple logger utility
 * Can be extended later with more sophisticated logging (e.g., structured logging, file output)
 */

type LogLevel = "info" | "warn" | "error" | "debug";

interface LogContext {
    [key: string]: unknown;
}

/**
 * Log a message with optional context
 */
function log(level: LogLevel, message: string, context?: LogContext): void {
    const timestamp = format(new Date(), "yyyy-MM-dd HH:mm:ss");
    let contextStr = "";
    if (context) {
        const jsonStr = JSON.stringify(context, null, 2);
        // Indent each line of the JSON output
        const indentedJson = jsonStr
            .split("\n")
            .map((line) => `   ${line}`)
            .join("\n");
        contextStr = `\n${indentedJson}`;
    }
    const emoji = {
        info: "ℹ️",
        warn: "⚠️",
        error: "❌",
        debug: "🔍",
    }[level];

    console.log(`${emoji} [${timestamp}] ${message}${contextStr}`);
}

export const logger = {
    info: (message: string, context?: LogContext) =>
        log("info", message, context),
    warn: (message: string, context?: LogContext) =>
        log("warn", message, context),
    error: (message: string, context?: LogContext) =>
        log("error", message, context),
    debug: (message: string, context?: LogContext) =>
        log("debug", message, context),
};
