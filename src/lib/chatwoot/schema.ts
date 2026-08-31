import { z } from "zod";

/**
 * Paso 1 del onboarding: creación de la cuenta en la plataforma de conversaciones.
 * La contraseña solo se usa para la llamada al backend; nunca se guarda ni se registra.
 */
export const chatwootAccountSchema = z
  .object({
    email: z
      .string()
      .trim()
      .nonempty({ message: "Ingresa el email" })
      .max(160, { message: "Máximo 160 caracteres" })
      .email({ message: "Ingresa un email válido" }),
    password: z
      .string()
      .nonempty({ message: "Ingresa una contraseña" })
      .min(8, { message: "Mínimo 8 caracteres" })
      .max(128, { message: "Máximo 128 caracteres" }),
    confirmPassword: z.string().nonempty({ message: "Confirma la contraseña" }),
  })
  .refine((v) => v.password === v.confirmPassword, {
    path: ["confirmPassword"],
    message: "Las contraseñas no coinciden",
  });

export type ChatwootAccountValues = z.infer<typeof chatwootAccountSchema>;
