import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ, faqs } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

const SITE_URL = "https://larkeyai.lovable.app";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Larkey — Asistentes que responden por ti" },
      { name: "description", content: "Larkey te da un asistente conversacional que atiende WhatsApp, Instagram, Telegram, Messenger y WebApps. Tú lo supervisas, él responde." },
      { property: "og:title", content: "Larkey — Asistentes que responden por ti" },
      { property: "og:description", content: "Larkey te da un asistente conversacional que atiende WhatsApp, Instagram, Telegram, Messenger y WebApps. Tú lo supervisas, él responde." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@graph": [
            {
              "@type": "Organization",
              name: "Larkey",
              url: SITE_URL,
              description:
                "Larkey diseña y pone en marcha asistentes conversacionales de IA que atienden WhatsApp y otros canales de mensajería para negocios.",
              email: "marlonmolinag12@gmail.com",
            },
            {
              "@type": "WebSite",
              name: "Larkey",
              url: SITE_URL,
              inLanguage: "es-MX",
              publisher: { "@type": "Organization", name: "Larkey", url: SITE_URL },
            },
            {
              "@type": "FAQPage",
              mainEntity: faqs.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: { "@type": "Answer", text: faq.answer },
              })),
            },
          ],
        }),
      },
    ],
  }),
});

function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Header />
      <main className="flex-1">
        <Hero />
        <HowItWorks />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
