import { Link } from "@tanstack/react-router";

import { Footer } from "@/components/landing/Footer";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MetaTokenGuide } from "@/components/dashboard/MetaTokenGuide";
import { useAuth } from "@/hooks/use-auth";
import { useHref, useT } from "@/i18n";

export function GuideView() {
  const t = useT();
  const href = useHref();
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-12">
        <div className="section-container max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {t.guide.h1}
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">{t.guide.intro}</p>

          <Card className="mt-10">
            <CardHeader>
              <CardTitle>{t.guide.cardTitle}</CardTitle>
              <CardDescription>{t.guide.cardDescription}</CardDescription>
            </CardHeader>
            <CardContent>
              <MetaTokenGuide />
              <div className="mt-8">
                <Button asChild className="bg-brand text-brand-foreground hover:bg-brand/90">
                  <Link to={(user ? "/dashboard" : href("login")) as never}>
                    {user ? t.guide.dashboardCta : t.nav.login}
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <Footer />
    </div>
  );
}
