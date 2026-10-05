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
  firstName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el nombre" })
    .max(80, { message: "Máximo 80 caracteres" }),
  lastName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el apellido" })
    .max(80, { message: "Máximo 80 caracteres" }),
  companyName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el nombre del negocio" })
    .max(150, { message: "Máximo 150 caracteres" }),
});

export type ChatwootAccountValues = z.infer<typeof chatwootAccountSchema>;
