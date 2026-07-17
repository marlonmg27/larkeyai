import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WhatsAppMockup } from "./WhatsAppMockup";
import { ArrowRight, Sparkles } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden pt-32 pb-20 lg:pb-28">
      <div className="hero-gradient pointer-events-none absolute inset-0" />

      <div className="section-container relative">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="max-w-2xl"
          >
            <Badge
              variant="secondary"
              className="mb-6 gap-1.5 bg-accent text-accent-foreground hover:bg-accent"
            >
              <Sparkles className="h-3.5 w-3.5" />
              Un asistente que trabaja mientras tú descansas
            </Badge>

            <h1 className="text-4xl font-semibold tracking-tight text-foreground sm:text-5xl lg:text-6xl">
              Libérate de responder mensajes. Larkey lo hace por ti.
            </h1>

            <p className="mt-6 text-lg leading-relaxed text-muted-foreground">
              Larkey te da un asistente conversacional que atiende tus chats en
              WhatsApp — tu canal principal — y se extiende a Instagram, Telegram,
              Messenger y WebApps. Tú lo supervisas en tiempo real y tomas el control
              cuando lo necesites.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button size="lg" className="bg-brand text-brand-foreground hover:bg-brand/90">
                Quiero mi asistente
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button size="lg" variant="outline">
                Iniciar sesión
              </Button>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">
              Para empresas y profesionales independientes que viven de conversar con sus clientes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="relative"
          >
            <WhatsAppMockup />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
