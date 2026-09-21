export function tokenizeAdminSearch(q: string | undefined) {
  if (!q) return [];
  const normalized = q
    .trim()
    .replace(/[—–−‐‑]/g, " ")
    .replace(/[.,;:!?()[\]{}"'`«»„“”+/\\|_]+/g, " ");
  const tokens = normalized
    .split(/\s+/)
    .map((token) => token.trim())
    .filter((token) => token.length >= 2);

  if (tokens.length > 0) return tokens;
  const fallback = q.trim();
  return fallback ? [fallback] : [];
}
