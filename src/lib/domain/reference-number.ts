const PREFIX = "ANT";
const PAD = 6;

export function formatItemReference(sequence: number): string {
  return `${PREFIX}-${String(sequence).padStart(PAD, "0")}`;
}
