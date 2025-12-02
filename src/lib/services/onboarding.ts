import { getConfig } from "./config";

/**
 * Check if the user is onboarded (has timezone configured)
 * @returns true if user is onboarded, false otherwise
 */
export async function isUserOnboarded(): Promise<boolean> {
    const timezone = await getConfig("timezone");
    return timezone !== null && typeof timezone === "string" && timezone.length > 0;
}

