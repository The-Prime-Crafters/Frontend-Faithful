/**
 * Safe JSON utilities to prevent app crashes from JSON.parse errors
 */

/**
 * Safely parse JSON with fallback value
 * @param jsonString - JSON string to parse
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback value
 */
export function safeJsonParse<T>(jsonString: string | null | undefined, fallback: T): T {
  if (!jsonString || typeof jsonString !== 'string') {
    console.warn('⚠️ SafeJsonParse: Invalid input, using fallback');
    return fallback;
  }

  try {
    const parsed = JSON.parse(jsonString);
    return parsed as T;
  } catch (error) {
    console.error('❌ SafeJsonParse: Failed to parse JSON', error);
    console.error('❌ JSON string was:', jsonString.substring(0, 100));
    return fallback;
  }
}

/**
 * Safely stringify object with error handling
 * @param obj - Object to stringify
 * @param fallback - Fallback string if stringification fails
 * @returns JSON string or fallback
 */
export function safeJsonStringify(obj: any, fallback: string = '{}'): string {
  if (obj === null || obj === undefined) {
    return fallback;
  }

  try {
    return JSON.stringify(obj);
  } catch (error) {
    console.error('❌ SafeJsonStringify: Failed to stringify object', error);
    return fallback;
  }
}

/**
 * Validate if a string is valid JSON
 * @param jsonString - String to validate
 * @returns true if valid JSON, false otherwise
 */
export function isValidJson(jsonString: string): boolean {
  if (!jsonString || typeof jsonString !== 'string') {
    return false;
  }

  try {
    JSON.parse(jsonString);
    return true;
  } catch {
    return false;
  }
}

/**
 * Parse JSON from SecureStore with type safety
 * @param stored - Stored value from SecureStore
 * @param fallback - Fallback value if parsing fails
 * @returns Parsed object or fallback
 */
export function parseStoredData<T>(stored: string | null | undefined, fallback: T): T {
  if (!stored) {
    return fallback;
  }

  return safeJsonParse(stored, fallback);
}
