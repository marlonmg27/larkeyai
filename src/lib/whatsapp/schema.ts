import { z } from "zod";

/** Canales de mensajería soportados. Hoy solo WhatsApp. */
export const messagingChannels = ["whatsapp"] as const;
export type MessagingChannel = (typeof messagingChannels)[number];

/** Validación compartida entre el formulario y la server function. */
export const whatsappOnboardingSchema = z.object({
  channel: z.enum(messagingChannels),
  wabaName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el nombre de la cuenta de WhatsApp" })
    .max(80, { message: "Máximo 80 caracteres" }),
  // El email se captura en el paso 1 (cuenta de la plataforma de conversaciones).
  // Siempre normalizado en E.164 por el formulario (+<prefijo><nacional>).
  phoneNumber: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el número de teléfono" })
    .max(16, { message: "Número demasiado largo" })
    .regex(/^\+[1-9]\d{7,14}$/, { message: "Ingresa un número válido con código de país" }),
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
  // En el formulario se muestra como "Api Key"; internamente sigue siendo el access token.
  // La verificación con Graph API está activa (ver whatsapp.functions.ts).
  accessToken: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa la Api Key" })
    .max(512, { message: "Máximo 512 caracteres" }),
});



export type WhatsAppOnboardingValues = z.infer<typeof whatsappOnboardingSchema>;
