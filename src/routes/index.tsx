import { createFileRoute } from "@tanstack/react-router";
import { Header } from "@/components/landing/Header";
import { Hero } from "@/components/landing/Hero";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { Pricing } from "@/components/landing/Pricing";
import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: LandingPage,
  head: () => ({
    meta: [
      { title: "Larkey — Agentes de IA para WhatsApp" },
      { name: "description", content: "Larkey conecta Chatwoot con agentes de IA que atienden WhatsApp, agendan citas y escalan tu atención." },
      { property: "og:title", content: "Larkey — Agentes de IA para WhatsApp" },
      { property: "og:description", content: "Larkey conecta Chatwoot con agentes de IA que atienden WhatsApp, agendan citas y escalan tu atención." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
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
