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
      "Larkey es una plataforma de asistentes conversacionales. Diseñamos y ponemos en marcha un asistente afinado al contexto de tu negocio para que responda tus mensajes — con WhatsApp como canal principal — sin que el dueño del negocio tenga que estar pendiente del celular.",
  },
  {
    question: "¿Tengo que saber de tecnología para usar Larkey?",
    answer:
      "No. Larkey está pensado para cualquier persona, con conocimientos técnicos avanzados o cero. Nosotros nos encargamos de la parte técnica y del entrenamiento; tú solo nos cuentas cómo funciona tu negocio.",
  },
  {
    question: "¿En qué canales responde el asistente?",
    answer:
      "WhatsApp es nuestro producto estrella, porque es donde la mayoría de nuestros clientes recibe mensajes. También podemos extenderlo a Instagram, Telegram, Messenger y WebApps según lo que necesites.",
  },
  {
    question: "¿Puedo ver las conversaciones del asistente con mis clientes?",
    answer:
      "Sí. Desde tu bandeja unificada puedes leer en tiempo real cada interacción entre tu asistente y tus clientes. Si lo necesitas, tomas el control de la conversación con un solo clic.",
  },
  {
    question: "¿El asistente está entrenado exclusivamente para mi negocio?",
    answer:
      "Ese es el objetivo. Ajustamos el asistente a tu contexto, tono y flujos para que responda como parte de tu equipo. El nivel de personalización se acuerda contigo según tu caso.",
  },
  {
    question: "¿Cómo se cuenta el consumo de mensajes?",
    answer:
      "Cada mensaje enviado por tu asistente cuenta contra el límite de tu plan. Desde tu panel puedes ver el consumo en tiempo real y comprar mensajes adicionales cuando lo necesites.",
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
