import { z } from "zod";

/**
 * Paso 1 del onboarding: creación de la cuenta en la plataforma de conversaciones.
 * Solo se captura el correo: la contraseña inicial la define el backend.
 */
export const chatwootAccountSchema = z.object({
  email: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el email" })
    .max(160, { message: "Máximo 160 caracteres" })
    .email({ message: "Ingresa un email válido" }),
});

export type ChatwootAccountValues = z.infer<typeof chatwootAccountSchema>;
