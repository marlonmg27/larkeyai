import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/landing/Footer";
import { PlanCards, type PlanRow } from "@/components/pricing/PlanCards";
import { PacksSection } from "@/components/dashboard/PacksSection";
import { useAuth } from "@/hooks/use-auth";

const SITE_URL = "https://larkeyai.lovable.app";

export const Route = createFileRoute("/precios")({
  component: PreciosPage,
  head: () => ({
    meta: [
      { title: "Precios y planes — Larkey" },
      {
        name: "description",
        content:
          "Planes de suscripción de Larkey y paquetes de mensajes adicionales. Pagas por mensajes reales, sin permanencia y con 14 días de prueba gratis.",
      },
      { property: "og:title", content: "Precios y planes — Larkey" },
      {
        property: "og:description",
        content:
          "Compara los planes Basic, Standard, Pro y Enterprise de Larkey, y compra paquetes de mensajes adicionales cuando los necesites.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: SITE_URL + "/precios" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: SITE_URL + "/precios" }],
  }),
});

function PreciosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  function handleSelectPlan(plan: PlanRow) {
    try {
      sessionStorage.setItem("larkey:selected_plan", plan.id);
    } catch {
      // sessionStorage puede no estar disponible; no es crítico
    }
    navigate({ to: user ? "/dashboard" : "/auth" });
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-16 lg:py-20">
        <div className="section-container">
          <div className="mx-auto max-w-2xl text-center">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Precios y planes
            </h1>
            <p className="mt-4 text-lg text-muted-foreground">
              Escala tu atención sin contratar más gente. Pagas por mensajes reales, sin permanencia y con
              14 días de prueba gratis.
            </p>
          </div>

          <div className="mt-12">
            <PlanCards onSelectPlan={handleSelectPlan} ctaLabel="Elegir plan" />
          </div>

          <div className="mt-16">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Paquetes de mensajes adicionales
            </h2>
            <p className="mt-2 text-muted-foreground">
              Si te quedas corto de mensajes en el mes, compra un paquete extra sin cambiar de plan.
            </p>
            <div className="mt-6">
              {user ? (
                <PacksSection />
              ) : (
                <Card>
                  <CardContent className="flex flex-col items-start gap-4 py-8">
                    <p className="text-sm text-muted-foreground">
                      Los paquetes de mensajes se compran desde tu panel. Crea tu cuenta o inicia sesión
                      para ver los paquetes disponibles y sus precios.
                    </p>
                    <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                      <Link to="/auth">Iniciar sesión</Link>
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
