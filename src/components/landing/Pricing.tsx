import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Básico",
    description: "Para profesionales que quieren dejar de vivir pegados al celular.",
    price: "$TODO",
    period: "/mes",
    messages: "TODO",
    features: [
      "TODO mensajes incluidos/mes",
      "1 asistente afinado a tu operación",
      "WhatsApp como canal principal",
      "Respuestas en horario extendido",
      "Soporte por email",
    ],
    cta: "Empezar",
    popular: false,
  },
  {
    name: "Pro",
    description: "El equilibrio ideal para negocios que reciben mensajes cada día.",
    price: "$TODO",
    period: "/mes",
    messages: "TODO",
    features: [
      "TODO mensajes incluidos/mes",
      "Asistente afinado a tu operación",
      "WhatsApp, Instagram, Telegram y Messenger",
      "Bandeja unificada para supervisar conversaciones en tiempo real y tomar el control",
      "Ajustes de tono y flujos según tu caso",
      "Soporte prioritario",
    ],
    cta: "Elegir Pro",
    popular: true,
  },
  {
    name: "Empresarial",
    description: "Para equipos con alto volumen y necesidades a medida.",
    price: "Personalizado",
    period: "",
    messages: "TODO+",
    features: [
      "TODO+ mensajes incluidos/mes",
      "Asistentes a medida para tu operación",
      "WhatsApp, Instagram, Telegram, Messenger y WebApps",
      "Integraciones dedicadas a tu stack",
      "Onboarding y acompañamiento cercano",
      "Soporte con cuenta asignada",
    ],
    cta: "Contactar ventas",
    popular: false,
  },
];

export function Pricing() {
  return (
    <section id="precios" className="relative border-y border-border bg-secondary/30 py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Planes y precios
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Escala tu atención sin contratar más gente. Pagas por mensajes reales, no por promesas.
          </p>
        </div>

        <div className="mt-16 grid gap-8 lg:grid-cols-3">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
            >
              <Card
                className={`relative flex h-full flex-col ${
                  plan.popular ? "border-brand shadow-lg ring-1 ring-brand" : ""
                }`}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-brand text-brand-foreground hover:bg-brand">
                    Más popular
                  </Badge>
                )}
                <CardHeader>
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="mb-6">
                    <span className="text-4xl font-bold tracking-tight text-foreground">
                      {plan.price}
                    </span>
                    <span className="text-muted-foreground">{plan.period}</span>
                  </div>

                  <div className="mb-6 rounded-lg bg-accent/50 px-3 py-2 text-sm font-medium text-accent-foreground">
                    {plan.messages} mensajes incluidos
                  </div>

                  <ul className="space-y-3">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3 text-sm">
                        <Check className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <div className="p-6 pt-0">
                  <Button
                    className={
                      plan.popular
                        ? "w-full bg-brand text-brand-foreground hover:bg-brand/90"
                        : "w-full"
                    }
                    variant={plan.popular ? "default" : "outline"}
                  >
                    {plan.cta}
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
