import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { themeInitScript } from "@/components/ThemeToggle";
import { Toaster } from "@/components/ui/sonner";
import { onAuthChange } from "@/lib/auth/token";
import { SiteShell } from "@/components/layout/SiteShell";
import { localeFromPathname } from "@/i18n/config";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

export function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  const pathname = useRouterState({ select: (st) => st.location.pathname });
  const isEn = localeFromPathname(pathname) === "en";
  const copy = isEn
    ? {
        title: "This page didn't load",
        body: "Something went wrong on our end. Please try again in a moment.",
        retry: "Try again",
        home: "Go home",
        homeHref: "/en",
      }
    : {
        title: "No pudimos cargar esta página",
        body: "Algo salió mal de nuestro lado. Intenta de nuevo en un momento.",
        retry: "Reintentar",
        home: "Ir al inicio",
        homeHref: "/es",
      };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md rounded-2xl border bg-card p-6 text-center shadow-sm">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">{copy.title}</h1>
        <p className="mt-2 text-sm text-muted-foreground">{copy.body}</p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-all duration-200 hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            {copy.retry}
          </button>
          <a
            href={copy.homeHref}
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-all duration-200 hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring active:scale-95"
          >
            {copy.home}
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Larkey — Asistentes especializados en tu atención al cliente" },
      {
        name: "description",
        content:
          "Larkey te da un asistente inteligente para manejar a tus clientes, las herramientas necesarias para realizar cualquier función adicional que desees y una plataforma para conectar múltiples canales de mensajería",
      },
      { name: "author", content: "Larkey" },
      { property: "og:title", content: "Larkey — Agente de IA para tus clientes" },
      {
        property: "og:description",
        content:
          "Larkey es un asistente con todas las herramientas necesarias para brindarle la mejor experiencia de usuario a tus clientes. Tú defines las reglas y él responde.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: "@larkey" },
      { name: "twitter:title", content: "Larkey — Agente de IA para atención al cliente" },
      {
        name: "twitter:description",
        content:
          "Larkey es un asistente con todas las herramientas necesarias para brindarle la mejor experiencia de usuario a tus clientes. Tú defines las reglas y él responde.",
      },
      { name: "facebook-domain-verification", content: "oxjjuezvnft5kx4ik14pizs7lprv9a" },
      { name: "google-site-verification", content: "ILEmUV07akKmLvw9M_wt51fhQg9MhhXSFb9OPhb67lA" },
    ],
    links: [
      {
        rel: "preload",
        href: "/fonts/inter-latin-wght-normal.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <html lang={localeFromPathname(pathname)} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const router = useRouter();

  useEffect(() => {
    return onAuthChange(() => {
      router.invalidate();
      queryClient.invalidateQueries();
    });
  }, [router, queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <SiteShell>
        <Outlet />
      </SiteShell>
      <Toaster />
    </QueryClientProvider>
  );
}
