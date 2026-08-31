/**
 * Deterministically converts a time string like "08:00" to minutes since midnight.
 */
export function timeToMinutes(timeStr: string): number {
  if (!timeStr) return -1;
  const parts = timeStr.split(':');
  if (parts.length !== 2) return -1;
  
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  
  if (isNaN(hours) || isNaN(minutes)) return -1;
  
  return hours * 60 + minutes;
}

/**
 * Generates deterministic UUIDs or robust ID hashes based on strings.
 * This prevents React key issues when the same data is loaded multiple times.
 */
export function generateId(prefix: string, seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return `${prefix}_${Math.abs(hash).toString(36)}`;
}
