import { z } from "zod";
import { InquiryStatus } from "@prisma/client";

const optionalPhone = z
  .string()
  .trim()
  .max(30, "Телефонот е предолг.")
  .regex(/^$|^[+0-9()\s.-]{6,30}$/, "Внесете важечки телефонски број.")
  .optional()
  .or(z.literal(""));

export const inquiryWriteSchema = z.object({
  itemId: z.string().uuid("Предметот не е валиден."),
  name: z.string().trim().min(2, "Внесете име.").max(80, "Името е предолго."),
  email: z.string().trim().email("Внесете важечка е-пошта.").max(120),
  phone: optionalPhone,
  message: z.string().trim().min(10, "Напишете кратка порака.").max(2000, "Пораката е предолга."),
});

export const inquiryStatusSchema = z.nativeEnum(InquiryStatus);

export type InquiryWriteInput = z.infer<typeof inquiryWriteSchema>;
