import { Mail } from "lucide-react";

import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ENTERPRISE_EMAIL, ENTERPRISE_MAILTO } from "@/components/pricing/PlanCards";
import { useT } from "@/i18n";

export function ContactView() {
  const t = useT();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="section-container max-w-2xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.contact.h1}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t.contact.intro}</p>

          <Card className="mt-10">
            <CardHeader>
              <CardTitle>{t.contact.cardTitle}</CardTitle>
              <CardDescription>{t.contact.cardDescription}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <a
                href={`mailto:${ENTERPRISE_EMAIL}`}
                className="inline-flex items-center gap-2 text-sm font-medium text-foreground hover:underline"
              >
                <Mail className="h-4 w-4 text-brand" />
                {ENTERPRISE_EMAIL}
              </a>
              <div>
                <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <a href={ENTERPRISE_MAILTO}>{t.contact.quoteCta}</a>
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                {t.contact.noWabaBefore}{" "}
                <a href={`mailto:${ENTERPRISE_EMAIL}`} className="font-medium text-foreground hover:underline">
                  {ENTERPRISE_EMAIL}
                </a>{" "}
                {t.contact.noWabaAfter}
              </p>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
