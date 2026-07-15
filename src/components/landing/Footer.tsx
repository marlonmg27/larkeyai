import { MessageCircle, Mail } from "lucide-react";

const links = [
  { label: "Cómo funciona", href: "#como-funciona" },
  { label: "Precios", href: "#precios" },
  { label: "FAQ", href: "#faq" },
  { label: "Iniciar sesión", href: "#" },
  { label: "Privacidad", href: "#" },
  { label: "Términos", href: "#" },
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card py-12">
      <div className="section-container">
        <div className="grid gap-8 md:grid-cols-2 md:items-start md:justify-between">
          <div className="max-w-sm">
            <div className="flex items-center gap-2 text-foreground">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-brand text-brand-foreground">
                <MessageCircle className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold tracking-tight">Larkey</span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Agentes de IA que atienden WhatsApp para negocios que quieren escalar su atención sin perder calidad.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2">
            <div>
              <h4 className="text-sm font-semibold text-foreground">Links</h4>
              <ul className="mt-3 space-y-2">
                {links.map((link) => (
                  <li key={link.label}>
                    <a
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="text-sm font-semibold text-foreground">Contacto</h4>
              <a
                href="mailto:hola@larkey.io"
                className="mt-3 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <Mail className="h-4 w-4" />
                hola@larkey.io
              </a>
            </div>
          </div>
        </div>

        <div className="mt-12 border-t border-border pt-6 text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Larkey. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
