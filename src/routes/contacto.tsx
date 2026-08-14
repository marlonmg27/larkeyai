import { createFileRoute } from "@tanstack/react-router";
import { Mail, MessageCircle } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { ENTERPRISE_EMAIL, ENTERPRISE_MAILTO } from "@/components/pricing/PlanCards";

const SITE_URL = "https://larkeyai.lovable.app";

export const Route = createFileRoute("/contacto")({
  component: ContactoPage,
  head: () => ({
    meta: [
      { title: "Contacto — Larkey" },
      {
        name: "description",
        content:
          "Escríbenos para activar tu asistente de WhatsApp con Larkey, pedir una cotización Enterprise o resolver dudas sobre tu WhatsApp Business Account.",
      },
      { property: "og:title", content: "Contacto — Larkey" },
      {
        property: "og:description",
        content:
          "Hablemos: activación de tu asistente, cotizaciones a medida y ayuda con tu WhatsApp Business Account o tu app de Meta.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/contacto" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/contacto" }],
  }),
});

function ContactoPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-16 lg:py-24">
        <div className="section-container mx-auto max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Contacto
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Cuéntanos cómo funciona tu negocio y te ayudamos a poner en marcha tu asistente. Respondemos
            por correo lo antes posible.
          </p>

          <Card className="mt-10">
            <CardHeader>
              <div className="mb-2 grid h-10 w-10 place-items-center rounded-lg bg-brand/10 text-brand">
                <Mail className="h-5 w-5" />
              </div>
              <CardTitle className="text-xl">Escríbenos por email</CardTitle>
              <CardDescription>La vía más rápida para empezar o cotizar un plan a medida.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href={`mailto:${ENTERPRISE_EMAIL}`}
                className="inline-flex items-center gap-2 text-base font-medium text-foreground transition-colors hover:text-brand"
              >
                <Mail className="h-4 w-4" />
                {ENTERPRISE_EMAIL}
              </a>
              <div>
                <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <a href={ENTERPRISE_MAILTO}>Solicitar cotización</a>
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6 border-brand/30 bg-brand/5">
            <CardContent className="flex items-start gap-3 py-6">
              <MessageCircle className="mt-0.5 h-5 w-5 shrink-0 text-brand" />
              <p className="text-sm text-muted-foreground">
                ¿Aún no tienes una WhatsApp Business Account o una app de Meta? Escríbenos a{" "}
                <a href={`mailto:${ENTERPRISE_EMAIL}`} className="font-medium text-foreground underline">
                  {ENTERPRISE_EMAIL}
                </a>{" "}
                y te acompañamos en el proceso.
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
