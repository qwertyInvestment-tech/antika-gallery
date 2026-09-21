import { FulfillmentMethod } from "@prisma/client";

export const fulfillmentLabels: Record<FulfillmentMethod, string> = {
  PICKUP: "Лично преземање",
  ARRANGED_DELIVERY: "Договорена достава",
};

export const fulfillmentMethods = [FulfillmentMethod.PICKUP, FulfillmentMethod.ARRANGED_DELIVERY] as const;
