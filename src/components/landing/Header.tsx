import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { LarkeyMark } from "@/components/brand/LarkeyMark";

export function Header() {
  const { user } = useAuth();
  const navigate = useNavigate();

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success("Sesión cerrada");
    navigate({ to: "/", replace: true });
  }

  return (
    <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md">
      <div className="section-container flex h-16 items-center justify-between">
        <Link to="/" className="flex items-center gap-2 text-foreground">
          <LarkeyMark className="h-8 w-8" />
          <span className="text-lg font-semibold tracking-tight">Larkey</span>
        </Link>

        <nav className="hidden items-center gap-6 text-sm font-medium text-muted-foreground md:flex">
          <a href="#como-funciona" className="transition-colors hover:text-foreground">
            Cómo funciona
          </a>
          <a href="#precios" className="transition-colors hover:text-foreground">
            Precios
          </a>
          <a href="#faq" className="transition-colors hover:text-foreground">
            FAQ
          </a>
        </nav>

        <div className="flex items-center gap-2">
          {user ? (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/dashboard">Dashboard</Link>
              </Button>
              <Button variant="ghost" size="sm" onClick={handleLogout}>
                <LogOut className="mr-1.5 h-4 w-4" /> Salir
              </Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex">
                <Link to="/auth">Iniciar sesión</Link>
              </Button>
              <Button asChild size="sm" className="bg-brand text-brand-foreground hover:bg-brand/90">
                <Link to="/auth">Empezar</Link>
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
