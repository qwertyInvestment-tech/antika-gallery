import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().trim().email("Внесете валидна е-пошта."),
  password: z.string().min(1, "Внесете лозинка."),
});

export const registerSchema = z
  .object({
    name: z.string().trim().min(2, "Внесете име.").max(80, "Името е предолго."),
    email: z.string().trim().email("Внесете валидна е-пошта.").max(120),
    password: z
      .string()
      .min(10, "Лозинката мора да има најмалку 10 знаци.")
      .max(100, "Лозинката е предолга."),
    confirmPassword: z.string().min(1, "Потврдете ја лозинката."),
    phone: z
      .string()
      .trim()
      .max(30, "Телефонот е предолг.")
      .regex(/^$|^[+0-9()\s.-]{6,30}$/, "Внесете важечки телефонски број.")
      .optional()
      .or(z.literal("")),
  })
  .refine((value) => value.password === value.confirmPassword, {
    message: "Лозинките не се совпаѓаат.",
    path: ["confirmPassword"],
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
