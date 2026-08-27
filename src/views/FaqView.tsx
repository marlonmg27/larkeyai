import { FAQ } from "@/components/landing/FAQ";
import { Footer } from "@/components/landing/Footer";
import { useT } from "@/i18n";

export function FaqView() {
  const t = useT();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 pt-8">
        <h1 className="section-container text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          {t.faq.h1}
        </h1>
        <FAQ hideHeading />
      </main>
      <Footer />
    </div>
  );
}
