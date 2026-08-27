import { useState } from "react";
import { ArrowRight, Check, Copy, KeyRound } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useT } from "@/i18n";

function CopyValue({ label, value }: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  const t = useT();

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  return (
    <span className="mt-2 flex items-center justify-between gap-3 rounded-lg border border-border bg-background/60 p-2 pl-3">
      <span className="min-w-0">
        <span className="block text-xs text-muted-foreground">{label}</span>
        <span className="block truncate font-mono text-sm">{value}</span>
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={copy}
        aria-label={`${t.guide.copy} ${label}`}
      >
        {copied ? <Check className="h-4 w-4 text-brand" /> : <Copy className="h-4 w-4" />}
      </Button>
    </span>
  );
}

export function MetaTokenGuide({ onContinue }: { onContinue?: () => void }) {
  const t = useT();

  return (
    <div className="space-y-6">
      <div className="flex items-start gap-2 rounded-lg border border-brand/30 bg-brand/5 p-4">
        <KeyRound className="mt-0.5 h-4 w-4 shrink-0 text-brand" />
        <p className="text-sm text-muted-foreground">{t.guide.intro2}</p>
      </div>

      <ol className="space-y-4">
        {t.guide.steps.map((step, i) => (
          <li key={i} className="flex gap-3">
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand/10 text-sm font-medium text-brand">
              {i + 1}
            </span>
            <div className="min-w-0 flex-1 text-sm text-muted-foreground">
              {step.text}
              {step.copies?.map((c) => (
                <CopyValue key={c.value} label={c.label} value={c.value} />
              ))}
            </div>
          </li>
        ))}
      </ol>

      {onContinue && (
        <Button
          type="button"
          size="lg"
          onClick={onContinue}
          className="bg-brand text-brand-foreground hover:bg-brand/90"
        >
          {t.guide.continueCta}
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
