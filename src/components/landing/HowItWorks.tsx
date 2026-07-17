import { motion } from "framer-motion";
import { MessagesSquare, Sparkles, Rocket } from "lucide-react";

const steps = [
  {
    icon: MessagesSquare,
    title: "Nos cuentas tu negocio",
    description:
      "Conversamos contigo para entender tu producto, tu tono y las preguntas que recibes cada día. Sin formularios kilométricos ni tecnicismos.",
  },
  {
    icon: Sparkles,
    title: "Afinamos tu agente",
    description:
      "Nuestro equipo entrena y ajusta un agente de IA al contexto exacto de tu negocio. Tú no tocas una línea de código.",
  },
  {
    icon: Rocket,
    title: "Empieza a responder por ti",
    description:
      "Tu agente atiende WhatsApp — y otras plataformas de mensajería — respondiendo prospectos, resolviendo dudas y agendando citas 24/7.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Cómo trabajamos contigo
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tú te enfocas en vender y hacer crecer tu negocio. Nosotros construimos y mantenemos el agente que responde por ti.
          </p>
        </div>

        <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative rounded-2xl border border-border bg-card p-8 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-xl bg-brand text-brand-foreground shadow-sm">
                <step.icon className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-semibold tracking-tight text-foreground">
                {step.title}
              </h3>
              <p className="mt-3 text-base leading-relaxed text-muted-foreground">
                {step.description}
              </p>
              <span className="absolute right-6 top-6 text-5xl font-bold text-foreground/5">
                0{index + 1}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
