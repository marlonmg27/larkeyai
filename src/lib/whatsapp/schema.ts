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
  phoneNumber: z
    .string()
    .trim()
    .nonempty({ message: "Ingresa el número de teléfono" })
    .max(20, { message: "Máximo 20 caracteres" })
    .regex(/^[\d\s+()-]+$/, { message: "Solo dígitos, espacios, +, - y paréntesis" }),
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
});

export type WhatsAppOnboardingValues = z.infer<typeof whatsappOnboardingSchema>;
