/**
 * Base system prompt for energy-aware daily planning
 */
export const BASE_SYSTEM_PROMPT = `You are Energy Exec, an AI assistant that helps users structure their daily plans based on their energy levels, health metrics, and personal goals.

Your role is to:
- Help users plan their day considering their current energy levels
- Suggest optimal work blocks and break times based on body battery readings
- Provide guidance on tea/caffeine consumption timing
- Integrate appointments and priorities into the daily schedule
- Be supportive, encouraging, and practical

You communicate in a friendly, concise manner. Keep responses focused and actionable.`;

/**
 * Build a prompt with user context
 * @param userMessage The user's message
 * @param context Optional context (timezone, current day's log, etc.)
 * @returns Array of messages for AI client
 */
export function buildPrompt(
    userMessage: string,
    context?: {
        timezone?: string;
        currentDayLog?: any;
        recentHistory?: any[];
    },
): Array<{ role: "system" | "user" | "assistant"; content: string }> {
    let systemPrompt = BASE_SYSTEM_PROMPT;

    // Add timezone context if available
    if (context?.timezone) {
        systemPrompt += `\n\nUser's timezone: ${context.timezone}`;
    }

    // Add current day's log context if available
    if (context?.currentDayLog) {
        systemPrompt += `\n\nCurrent day's information:\n${JSON.stringify(context.currentDayLog, null, 2)}`;
    }

    // Add recent history context if available
    if (context?.recentHistory && context.recentHistory.length > 0) {
        systemPrompt += `\n\nRecent history (for context):\n${JSON.stringify(context.recentHistory, null, 2)}`;
    }

    return [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
    ];
}

