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
      "Larkey es un servicio de agentes de IA que atienden tus conversaciones de WhatsApp a través de Chatwoot. Responde prospectos, agenda citas y escala tu atención sin necesidad de contratar más personas.",
  },
  {
    question: "¿Necesito tener Chatwoot?",
    answer:
      "Sí. Larkey se conecta a tu cuenta de Chatwoot para leer y responder mensajes de WhatsApp. Si aún no usas Chatwoot, podemos orientarte en la configuración inicial.",
  },
  {
    question: "¿Cómo se cuenta el consumo de mensajes?",
    answer:
      "Cada mensaje enviado por el agente de IA se cuenta contra el límite de tu plan. Puedes comprar mensajes adicionales desde tu panel en cualquier momento. Tu backend puede actualizar el consumo directamente en la base de datos de Larkey.",
  },
  {
    question: "¿Puedo cambiar de plan?",
    answer:
      "Sí. Puedes cambiar entre planes o comprar mensajes extra desde el área de cliente. El cambio se aplica de forma inmediata o al siguiente ciclo de facturación según la opción que elijas.",
  },
  {
    question: "¿Qué pasa si supero los mensajes incluidos?",
    answer:
      "Si te acercas al límite, te avisamos con anticipación. Puedes comprar un paquete adicional de mensajes para seguir atendiendo sin interrupciones mientras definimos el siguiente plan.",
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
