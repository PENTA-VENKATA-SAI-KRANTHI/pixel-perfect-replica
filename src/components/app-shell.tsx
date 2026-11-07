import { Link, useRouterState } from "@tanstack/react-router";
import { LayoutDashboard, Sprout, Landmark, MessageCircle, UserRound, Leaf, Menu } from "lucide-react";
import { useState, type ReactNode } from "react";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { useApp, useT, type DictKey } from "@/lib/app-store";
import { cn } from "@/lib/utils";

const NAV: { to: "/" | "/crops" | "/schemes" | "/assistant" | "/profile"; key: DictKey; icon: typeof Sprout }[] = [
  { to: "/", key: "dashboard", icon: LayoutDashboard },
  { to: "/crops", key: "crops", icon: Sprout },
  { to: "/schemes", key: "schemes", icon: Landmark },
  { to: "/assistant", key: "assistant", icon: MessageCircle },
  { to: "/profile", key: "profile", icon: UserRound },
];

function SidebarBody({ onNav }: { onNav?: () => void }) {
  const t = useT();
  const { profile, lang, setLang } = useApp();
  const path = useRouterState({ select: (s) => s.location.pathname });
  return (
    <div className="flex h-full flex-col gap-6 bg-sidebar p-5 text-sidebar-foreground">
      <div className="flex items-center gap-2.5">
        <div className="grid size-10 place-items-center rounded-xl bg-sidebar-primary text-sidebar-primary-foreground"><Leaf className="size-5" /></div>
        <div>
          <p className="font-display text-lg font-semibold leading-none">AgriMitra AI</p>
          <p className="mt-1 text-xs opacity-70">Smart farming companion</p>
        </div>
      </div>
      <nav className="flex flex-col gap-1">
        {NAV.map((n) => {
          const active = n.to === "/" ? path === "/" : path.startsWith(n.to);
          return (
            <Link key={n.to} to={n.to} onClick={onNav}
              className={cn("flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active ? "bg-sidebar-primary text-sidebar-primary-foreground" : "hover:bg-sidebar-accent")}>
              <n.icon className="size-4" />{t(n.key)}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto space-y-4">
        <div>
          <p className="mb-2 text-xs uppercase tracking-wider opacity-60">{t("language")}</p>
          <div className="grid grid-cols-2 rounded-lg bg-sidebar-accent p-1 text-sm">
            {(["en", "te"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={cn("rounded-md py-1.5 font-medium", lang === l && "bg-sidebar-primary text-sidebar-primary-foreground")}>
                {l === "en" ? "English" : "తెలుగు"}
              </button>
            ))}
          </div>
        </div>
        <Link to="/profile" onClick={onNav} className="flex items-center gap-3 rounded-xl border border-sidebar-border p-3 hover:bg-sidebar-accent">
          <div className="grid size-9 place-items-center rounded-full bg-sidebar-primary font-semibold text-sidebar-primary-foreground">{profile.name.charAt(0)}</div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">{profile.name}</p>
            <p className="truncate text-xs opacity-70">{profile.district}, AP</p>
          </div>
        </Link>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="flex min-h-screen w-full">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 lg:block"><SidebarBody /></aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b bg-background/90 px-4 py-3 backdrop-blur lg:hidden">
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger className="rounded-md p-2 hover:bg-muted" aria-label="Open menu"><Menu className="size-5" /></SheetTrigger>
            <SheetContent side="left" className="w-64 border-0 p-0">
              <SheetTitle className="sr-only">Navigation</SheetTitle>
              <SidebarBody onNav={() => setOpen(false)} />
            </SheetContent>
          </Sheet>
          <span className="font-display font-semibold">AgriMitra AI</span>
        </header>
        <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:px-8 sm:py-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

export function DemoBadge({ children = "Demo data" }: { children?: ReactNode }) {
  return <span className="inline-flex items-center rounded-full border border-accent bg-accent/25 px-2.5 py-0.5 text-xs font-medium text-accent-foreground">{children}</span>;
}
