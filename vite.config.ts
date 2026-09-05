// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
    // Public pages rendered to static HTML at build time. Private routes
    // (/dashboard, /instrucciones) are never listed and auto-discovery is off.
    pages: [
      { path: "/" },
      { path: "/es" },
      { path: "/es/precios" },
      { path: "/es/faq" },
      { path: "/es/contacto" },
      { path: "/es/guia" },
      { path: "/es/acceso" },
      { path: "/es/legal/privacidad" },
      { path: "/es/legal/terminos" },
      { path: "/en" },
      { path: "/en/pricing" },
      { path: "/en/faq" },
      { path: "/en/contact" },
      { path: "/en/whatsapp-setup-guide" },
      { path: "/en/login" },
      { path: "/en/legal/privacy" },
      { path: "/en/legal/terms" },
    ],
    prerender: { enabled: true, autoStaticPathsDiscovery: false },
  },
});

