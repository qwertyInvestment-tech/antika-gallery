import { FulfillmentMethod, OrderStatus, ReservationStatus } from "@prisma/client";
import { z } from "zod";

export const fulfillmentMethodSchema = z.nativeEnum(FulfillmentMethod);
export const reservationStatusSchema = z.nativeEnum(ReservationStatus);
export const orderStatusSchema = z.nativeEnum(OrderStatus);

export const reserveItemSchema = z.object({
  itemId: z.string().uuid("Предметот не е валиден."),
  inquiryId: z.string().uuid("Изберете барање."),
  fulfillmentMethod: fulfillmentMethodSchema.default(FulfillmentMethod.PICKUP),
  notes: z.string().trim().max(2000).optional().or(z.literal("")),
});

export const reservationIdSchema = z.object({
  reservationId: z.string().uuid("Резервацијата не е валидна."),
});
