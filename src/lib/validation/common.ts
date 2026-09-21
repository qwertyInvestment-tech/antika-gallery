import { z } from "zod";

export const slugSchema = z
  .string()
  .trim()
  .min(1)
  .max(180)
  .regex(/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u, "Невалиден идентификатор за адреса.");

export const moneySchema = z
  .string()
  .regex(/^\d+(\.\d{1,2})?$/, "Невалидна цена.")
  .or(z.number().nonnegative());
