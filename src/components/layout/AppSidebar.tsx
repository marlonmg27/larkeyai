import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Home, LayoutDashboard, Tag, Mail, HelpCircle, LogOut, LogIn, BookOpen, Sparkles } from "lucide-react";
import { toast } from "sonner";

import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { LarkeyMark } from "@/components/brand/LarkeyMark";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { LanguageSwitcher } from "@/components/i18n/LanguageSwitcher";
import { useHref, useT, type PageKey } from "@/i18n";

export function AppSidebar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const t = useT();
  const href = useHref();

  const items: {
    title: string;
    url: string;
    icon: typeof Home;
    authOnly: boolean;
  }[] = [
    { title: t.nav.home, url: href("home"), icon: Home, authOnly: false },
    { title: t.nav.dashboard, url: "/dashboard", icon: LayoutDashboard, authOnly: true },
    { title: t.nav.instructions, url: "/instrucciones", icon: Sparkles, authOnly: true },
    { title: t.nav.guide, url: href("guide"), icon: BookOpen, authOnly: false },
    { title: t.nav.pricing, url: href("pricing"), icon: Tag, authOnly: false },
    { title: t.nav.contact, url: href("contact"), icon: Mail, authOnly: false },
    { title: t.nav.faq, url: href("faq"), icon: HelpCircle, authOnly: false },
  ];

  const visible = items.filter((item) => !item.authOnly || Boolean(user));

  async function handleLogout() {
    await supabase.auth.signOut();
    toast.success(t.nav.loggedOut);
    navigate({ to: href("home") as never, replace: true });
  }

  const loginPath = href("login" satisfies PageKey);

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <Link
          to={href("home") as never}
          className="flex items-center gap-2 px-2 py-1 text-foreground"
        >
          <LarkeyMark className="h-7 w-7 shrink-0" />
          <span className="truncate text-base font-semibold tracking-tight group-data-[collapsible=icon]:hidden">
            Larkey
          </span>
        </Link>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>{t.common.navigation}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {visible.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url} tooltip={item.title}>
                    <Link to={item.url as never} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <div className="px-2 pb-2 group-data-[collapsible=icon]:hidden">
          <LanguageSwitcher />
        </div>
        <SidebarMenu>
          <SidebarMenuItem>
            {user ? (
              <SidebarMenuButton onClick={handleLogout} tooltip={t.nav.logout}>
                <LogOut className="h-4 w-4" />
                <span>{t.nav.logout}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton asChild tooltip={t.nav.login}>
                <Link to={loginPath as never} className="flex items-center gap-2">
                  <LogIn className="h-4 w-4" />
                  <span>{t.nav.login}</span>
                </Link>
              </SidebarMenuButton>
            )}
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
