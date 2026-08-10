/**
 * Resilient API Fetch Helper
 * Handles CORS and network calls cleanly without premature AbortController cancellations.
 */

export async function fetchWithTimeout(resource, options = {}, timeoutMs = 8000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(resource, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    if (error.name === "AbortError") {
      console.warn(`Fetch notice (${timeoutMs}ms) for ${resource}. Falling back to direct Supabase data.`);
    } else {
      console.warn(`Fetch notice for ${resource}:`, error.message);
    }
    return null;
  }
}
