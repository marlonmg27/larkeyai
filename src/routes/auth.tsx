import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { MessageCircle } from "lucide-react";

export const Route = createFileRoute("/auth")({
  component: AuthPage,
  head: () => ({
    meta: [
      { title: "Iniciar sesión — Larkey" },
      { name: "description", content: "Accede a tu cuenta de Larkey o crea una nueva." },
    ],
  }),
});

function AuthPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("¡Bienvenido de vuelta!");
    navigate({ to: "/dashboard", replace: true });
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin + "/dashboard",
        data: phone ? { phone } : undefined,
      },
    });
    setLoading(false);
    if (error) return toast.error(error.message);
    toast.success("¡Cuenta creada! Revisa tu email para confirmar.");
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to="/" className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Larkey</span>
        </Link>

        <Card>
          <CardHeader>
            <CardTitle>Accede a Larkey</CardTitle>
            <CardDescription>Inicia sesión o crea una cuenta para empezar.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">Iniciar sesión</TabsTrigger>
                <TabsTrigger value="signup">Registrarse</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">Email</Label>
                    <Input id="login-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">Contraseña</Label>
                    <Input id="login-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                    {loading ? "Entrando..." : "Iniciar sesión"}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input id="signup-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">Teléfono (opcional)</Label>
                    <Input id="signup-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+34 600 000 000" autoComplete="tel" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Contraseña</Label>
                    <Input id="signup-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} autoComplete="new-password" />
                  </div>
                  <Button type="submit" disabled={loading} className="w-full bg-brand text-brand-foreground hover:bg-brand/90">
                    {loading ? "Creando..." : "Crear cuenta"}
                  </Button>
                </form>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
