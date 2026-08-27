import { createFileRoute } from "@tanstack/react-router";

import { ContactView } from "@/views/ContactView";
import { pageHead } from "@/i18n/seo";

export const Route = createFileRoute("/es/contacto")({
  component: ContactView,
  head: () => pageHead("contact", "es"),
});
