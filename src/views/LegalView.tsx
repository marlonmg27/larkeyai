import { Footer } from "@/components/landing/Footer";
import { useT } from "@/i18n";

export function LegalView({ doc }: { doc: "privacy" | "terms" }) {
  const t = useT();
  const content = t.legal[doc];

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1 py-12">
        <article className="section-container max-w-3xl">
          <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {content.h1}
          </h1>
          <p className="mt-3 text-sm text-muted-foreground">{content.updated}</p>

          <div className="mt-10 space-y-8">
            {content.sections.map((section) => (
              <section key={section.title}>
                <h2 className="text-xl font-semibold tracking-tight text-foreground">
                  {section.title}
                </h2>
                <p className="mt-3 leading-relaxed text-muted-foreground">{section.body}</p>
              </section>
            ))}
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
}
