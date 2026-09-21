const hits = new Map<string, number[]>();

export function assertRateLimit(key: string, limit = 5, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((time) => now - time < windowMs);
  if (recent.length >= limit) {
    return false;
  }
  recent.push(now);
  hits.set(key, recent);
  return true;
}

const recentHashes = new Map<string, number>();

export function assertNotDuplicate(hash: string, windowMs = 10 * 60 * 1000) {
  const now = Date.now();
  const previous = recentHashes.get(hash);
  if (previous && now - previous < windowMs) {
    return false;
  }
  recentHashes.set(hash, now);
  return true;
}
