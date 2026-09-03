import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useT } from "@/i18n";

export function FAQ({ hideHeading = false }: { hideHeading?: boolean }) {
  const t = useT();

  return (
    <section id="faq" className="py-20 lg:py-28">
      <div className="section-container">
        <div className="mx-auto max-w-3xl">
          {!hideHeading && (
            <div className="mb-12 text-center">
              <h2 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">{t.faq.h1}</h2>
              <p className="mt-4 text-lg text-muted-foreground">{t.faq.subtitle}</p>
            </div>
          )}

          <Accordion type="single" collapsible className="w-full">
            {t.faq.items.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border">
                <AccordionTrigger className="text-left text-base font-medium text-foreground">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-base leading-relaxed text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
