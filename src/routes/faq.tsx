import { createFileRoute } from "@tanstack/react-router";
import { FAQ, faqs } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

const SITE_URL = "https://larkeyai.lovable.app";

export const Route = createFileRoute("/faq")({
  component: FaqPage,
  head: () => ({
    meta: [
      { title: "Preguntas frecuentes — Larkey" },
      {
        name: "description",
        content:
          "Respuestas a las dudas más comunes sobre Larkey: cómo funciona el asistente de WhatsApp, canales disponibles, personalización y conteo de mensajes.",
      },
      { property: "og:title", content: "Preguntas frecuentes — Larkey" },
      {
        property: "og:description",
        content:
          "Cómo funciona el asistente de Larkey, en qué canales responde, cómo se personaliza y cómo se cuenta el consumo de mensajes.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/faq" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/faq" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((faq) => ({
            "@type": "Question",
            name: faq.question,
            acceptedAnswer: { "@type": "Answer", text: faq.answer },
          })),
        }),
      },
    ],
  }),
});

function FaqPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pt-8">
        <h1 className="section-container text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Preguntas frecuentes
        </h1>
        <FAQ hideHeading />
      </main>
      <Footer />
    </div>
  );
}
