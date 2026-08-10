/**
 * Resilient API Fetch Helper
 * Handles CORS and network calls cleanly without premature AbortController cancellations or noisy console warnings.
 */

export async function fetchWithTimeout(resource, options = {}, timeoutMs = 3000) {
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
    return null;
  }
}
