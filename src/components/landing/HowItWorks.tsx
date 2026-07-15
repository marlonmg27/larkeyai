import { motion } from "framer-motion";
import { Plug, Sliders, Clock } from "lucide-react";

const steps = [
  {
    icon: Plug,
    title: "Conecta Chatwoot",
    description:
      "Vinculamos tu cuenta de Chatwoot en minutos. Sin cambiar de herramienta ni de flujo.",
  },
  {
    icon: Sliders,
    title: "Entrena tu agente",
    description:
      "Define el tono, respuestas habituales y flujos de conversación. Tu agente aprende tu negocio.",
  },
  {
    icon: Clock,
    title: "Atiende 24/7",
    description:
      "Responde automáticamente, califica prospectos y agenda citas mientras tu equipo descansa.",
  },
];

export function HowItWorks() {
  return (
    <section id="como-funciona" className="py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Cómo funciona
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Tres pasos para tener un agente de IA respondiendo tu WhatsApp de forma profesional.
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
