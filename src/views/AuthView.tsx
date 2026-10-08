import { useEffect, useState } from "react";
import { useNavigate, Link } from "@tanstack/react-router";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";

import { supabase } from "@/integrations/supabase/client";
import {
  getBackendAuthEnabled,
  loginWithBackend,
  registerWithBackend,
} from "@/lib/auth/auth.functions";
import { getBackendSession, storeBackendSession } from "@/lib/auth/session";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useHref, useT } from "@/i18n";

export function AuthView() {
  const navigate = useNavigate();
  const t = useT();
  const href = useHref();
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [tenantName, setTenantName] = useState("");

  const loadBackendAuthEnabled = useServerFn(getBackendAuthEnabled);
  const loginBackend = useServerFn(loginWithBackend);
  const registerBackend = useServerFn(registerWithBackend);

  const backendAuth = useQuery({
    queryKey: ["backend-auth-enabled"],
    queryFn: () => loadBackendAuthEnabled(),
  });
  const backendAuthOn = backendAuth.data?.enabled === true;

  useEffect(() => {
    if (getBackendSession()) {
      navigate({ to: "/dashboard", replace: true });
      return;
    }
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (backendAuthOn) {
        const result = await loginBackend({
          data: { email, password },
        });
        storeBackendSession(result);
        toast.success(t.auth.welcomeBack);
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t.auth.welcomeBack);
      navigate({ to: "/dashboard", replace: true });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.loginFailed);
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (backendAuthOn) {
        const phoneTrimmed = phone.replace(/[\s()-]/g, "").trim();
        const result = await registerBackend({
          data: {
            email,
            password,
            first_name: firstName,
            last_name: lastName,
            tenant_name: tenantName,
            ...(phoneTrimmed ? { phone_number: phoneTrimmed } : {}),
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || "UTC",
            locale: document.documentElement.lang?.slice(0, 10) || "en",
          },
        });
        storeBackendSession(result);
        toast.success(t.auth.accountReady);
        navigate({ to: "/dashboard", replace: true });
        return;
      }

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin + "/dashboard",
          data: phone ? { phone } : undefined,
        },
      });
      if (error) {
        toast.error(error.message);
        return;
      }
      toast.success(t.auth.accountCreated);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t.auth.signupFailed);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <Link to={href("home") as never} className="mb-6 flex items-center justify-center gap-2">
          <div className="grid h-9 w-9 place-items-center rounded-lg bg-brand text-brand-foreground">
            <MessageCircle className="h-5 w-5" />
          </div>
          <span className="text-xl font-semibold tracking-tight">Larkey</span>
        </Link>

        <Card>
          <CardHeader>
            <h1 className="text-2xl font-semibold leading-none tracking-tight">{t.auth.cardTitle}</h1>
            <CardDescription>{t.auth.cardDescription}</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="login">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="login">{t.auth.loginTab}</TabsTrigger>
                <TabsTrigger value="signup">{t.auth.signupTab}</TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email">{t.auth.email}</Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="login-password">{t.auth.password}</Label>
                    <Input
                      id="login-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || backendAuth.isLoading}
                    className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    {loading ? t.auth.loginLoading : t.auth.loginSubmit}
                  </Button>
                </form>
              </TabsContent>

              <TabsContent value="signup" className="mt-6">
                <form onSubmit={handleSignup} className="space-y-4">
                  {backendAuthOn ? (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="signup-first-name">{t.auth.firstName}</Label>
                        <Input
                          id="signup-first-name"
                          type="text"
                          value={firstName}
                          onChange={(e) => setFirstName(e.target.value)}
                          required
                          autoComplete="given-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-last-name">{t.auth.lastName}</Label>
                        <Input
                          id="signup-last-name"
                          type="text"
                          value={lastName}
                          onChange={(e) => setLastName(e.target.value)}
                          required
                          autoComplete="family-name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="signup-tenant-name">{t.auth.tenantName}</Label>
                        <Input
                          id="signup-tenant-name"
                          type="text"
                          value={tenantName}
                          onChange={(e) => setTenantName(e.target.value)}
                          required
                          autoComplete="organization"
                        />
                      </div>
                    </>
                  ) : null}
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">{t.auth.email}</Label>
                    <Input
                      id="signup-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      autoComplete="email"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-phone">{t.auth.phoneOptional}</Label>
                    <Input
                      id="signup-phone"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+52 662 000 0000"
                      autoComplete="tel"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">{t.auth.password}</Label>
                    <Input
                      id="signup-password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={backendAuthOn ? 8 : 6}
                      autoComplete="new-password"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={loading || backendAuth.isLoading}
                    className="w-full bg-brand text-brand-foreground hover:bg-brand/90"
                  >
                    {loading ? t.auth.signupLoading : t.auth.signupSubmit}
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
