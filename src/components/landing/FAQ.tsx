import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const faqs = [
  {
    question: "¿Qué es Larkey?",
    answer:
      "Larkey es una compañía de agentes de IA. Diseñamos y ponemos en marcha agentes conversacionales afinados al contexto de cada cliente, para que respondan sus mensajes — hoy principalmente en WhatsApp — sin que el dueño del negocio tenga que estar pendiente del celular.",
  },
  {
    question: "¿Tengo que saber de tecnología para usar Larkey?",
    answer:
      "No. Larkey está pensado para cualquier persona, con conocimientos técnicos avanzados o cero. Nosotros nos encargamos de la parte técnica y del entrenamiento del agente; tú solo nos cuentas cómo funciona tu negocio.",
  },
  {
    question: "¿En qué canal responde el agente?",
    answer:
      "Nuestro enfoque principal hoy es WhatsApp, porque es donde la mayoría de nuestros clientes recibe mensajes. Dicho esto, la arquitectura permite integrar el agente en otras plataformas de mensajería según las necesidades de cada proyecto.",
  },
  {
    question: "¿Puedo ver las conversaciones del agente con mis clientes?",
    answer:
      "Sí. Ofrecemos una integración opcional con Chatwoot para que tengas una bandeja de entrada unificada y puedas leer, auditar o retomar cualquier conversación cuando lo necesites.",
  },
  {
    question: "¿El agente está entrenado exclusivamente para mi negocio?",
    answer:
      "Ese es el objetivo. Ajustamos el agente al contexto, tono y flujos de tu negocio para que responda como parte de tu equipo. El nivel de personalización y los detalles del entrenamiento se acuerdan con cada cliente según su caso.",
  },
  {
    question: "¿Cómo se cuenta el consumo de mensajes?",
    answer:
      "Cada mensaje enviado por tu agente cuenta contra el límite de tu plan. Desde tu panel puedes ver el consumo en tiempo real y comprar mensajes adicionales cuando lo necesites.",
  },
];

export function FAQ() {
  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-3xl">
          <div className="mb-12 text-center">
            <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Preguntas frecuentes
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Todo lo que necesitas saber antes de empezar con Larkey.
            </p>
          </div>

          <Accordion type="single" collapsible className="w-full">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-base font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
