import { z } from "zod";
import { ItemRequestStatus } from "@prisma/client";

const optionalPhone = z
  .string()
  .trim()
  .max(30, "Телефонот е предолг.")
  .regex(/^$|^[+0-9()\s.-]{6,30}$/, "Внесете важечки телефонски број.")
  .optional()
  .or(z.literal(""));

export const wantedRequestSchema = z.object({
  name: z.string().trim().min(2, "Внесете име.").max(80, "Името е предолго."),
  email: z.string().trim().email("Внесете важечка е-пошта.").max(120),
  phone: optionalPhone,
  description: z.string().trim().min(10, "Опишете што барате.").max(1000, "Описот е предолг."),
  details: z.string().trim().max(2000, "Деталите се предолги.").optional().or(z.literal("")),
});

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2, "Внесете име.").max(80, "Името е предолго."),
  email: z.string().trim().email("Внесете важечка е-пошта.").max(120),
  phone: optionalPhone,
  message: z.string().trim().min(10, "Напишете порака.").max(2000, "Пораката е предолга."),
  website: z.string().max(0).optional().or(z.literal("")),
});

export const requestStatusSchema = z.nativeEnum(ItemRequestStatus);

export type WantedRequestInput = z.infer<typeof wantedRequestSchema>;
