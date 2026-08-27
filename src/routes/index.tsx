import { createFileRoute, redirect } from "@tanstack/react-router";

/** Language gateway: sends visitors to the Spanish or English version of the home page. */
export const Route = createFileRoute("/")({
  beforeLoad: () => {
    const prefersEnglish =
      typeof navigator !== "undefined" &&
      (navigator.language ?? "").toLowerCase().startsWith("en");
    throw redirect({ to: prefersEnglish ? "/en/" : "/es/", statusCode: 301 });
  },
});
