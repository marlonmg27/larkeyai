import { z } from "zod";

/** Validación compartida entre el formulario y la server function. */
export const whatsappOnboardingSchema = z.object({
  displayName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el nombre de tu negocio" })
    .max(80, { message: "Máximo 80 caracteres" }),
  phoneNumberId: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el Phone number ID" })
    .max(64, { message: "Máximo 64 caracteres" }),
  wabaId: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el WABA ID" })
    .max(64, { message: "Máximo 64 caracteres" }),
  accessToken: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el access token" })
    .max(512, { message: "Máximo 512 caracteres" }),
});

export type WhatsAppOnboardingValues = z.infer<typeof whatsappOnboardingSchema>;
