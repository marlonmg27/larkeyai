import { z } from "zod";

/** Canales de mensajería soportados. Hoy solo WhatsApp. */
export const messagingChannels = ["whatsapp"] as const;
export type MessagingChannel = (typeof messagingChannels)[number];

/** Validación compartida entre el formulario y la server function. */
export const whatsappOnboardingSchema = z.object({
  channel: z.enum(messagingChannels),
  displayName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el nombre de tu negocio" })
    .max(80, { message: "Máximo 80 caracteres" }),
  userName: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el nombre del usuario" })
    .max(80, { message: "Máximo 80 caracteres" }),
  email: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el email" })
    .max(160, { message: "Máximo 160 caracteres" })
    .email({ message: "Ingresa un email válido" }),
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
  // Solo se usa para verificar el número con la Graph API. No se reenvía al backend.
  accessToken: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el access token" })
    .max(512, { message: "Máximo 512 caracteres" }),
});

export type WhatsAppOnboardingValues = z.infer<typeof whatsappOnboardingSchema>;
