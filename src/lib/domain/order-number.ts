const PREFIX = "ORD";
const PAD = 6;

export function formatOrderNumber(sequence: number) {
  return `${PREFIX}-${String(sequence).padStart(PAD, "0")}`;
}
