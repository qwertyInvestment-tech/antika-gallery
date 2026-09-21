import { ItemStatus } from "@prisma/client";
import { assertItemStatusTransition, canTransitionItemStatus } from "../src/lib/domain/item-status";
import { formatItemReference } from "../src/lib/domain/reference-number";

function expect(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(message);
  }
}

expect(formatItemReference(1) === "ANT-000001", "Референтниот број мора да биде ANT-000001");
expect(canTransitionItemStatus(ItemStatus.DRAFT, ItemStatus.AVAILABLE), "DRAFT → AVAILABLE мора да биде дозволено");
expect(!canTransitionItemStatus(ItemStatus.SOLD, ItemStatus.AVAILABLE), "SOLD не смее да се врати во AVAILABLE");

try {
  assertItemStatusTransition(ItemStatus.SOLD, ItemStatus.ARCHIVED);
  throw new Error("SOLD → ARCHIVED требаше да фрли грешка");
} catch (error) {
  if (error instanceof Error && error.message.includes("требаше")) {
    throw error;
  }
}

console.log("domain-check: ok");
