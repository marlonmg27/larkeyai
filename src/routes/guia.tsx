import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetaTokenGuide } from "@/components/dashboard/MetaTokenGuide";

export const Route = createFileRoute("/guia")({
  head: () => ({
    meta: [
      { title: "Guía para conectar WhatsApp | Larkey" },
      {
        name: "description",
        content:
          "Pasos para generar tu token de acceso en Meta Business Suite y conectar tu WhatsApp Business con Larkey.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "Guía para conectar WhatsApp | Larkey" },
      {
        property: "og:description",
        content: "Genera tu token en Meta y conecta tu canal de WhatsApp con Larkey.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GuiaPage,
});

function GuiaPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 sm:px-6 lg:py-14">
      <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
        Guía para conectar tu WhatsApp
      </h1>
      <p className="mt-3 text-muted-foreground">
        Antes de conectar tu canal necesitas generar un token de acceso en Meta y otorgarle permisos
        a Larkey. Sigue estos pasos una sola vez.
      </p>

      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Generar tu token en Meta</CardTitle>
          <CardDescription>
            Necesitas acceso de administrador a tu Meta Business Suite y una WhatsApp Business
            Account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MetaTokenGuide />
        </CardContent>
      </Card>

      <div className="mt-8">
        <Button asChild size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
          <Link to="/dashboard">
            Ir al Dashboard
            <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
