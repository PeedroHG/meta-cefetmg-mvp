"use client";

import React, { useEffect, useTransition } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  ShieldCheck,
  ScanLine,
  Presentation,
  ClipboardCheck,
  Stamp,
  Sun,
  Moon,
  LogOut,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/db/schema";
import { ROLE_META_CONFIG } from "@/lib/utils";
import { MetaLogo } from "@/components/shared/meta-logo";
import { DemoRoleSwitcher } from "@/components/shared/demo-role-switcher";
import { logoutAction } from "@/features/auth/actions";

interface AppShellProps {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    isAccredited: boolean;
  };
  children: React.ReactNode;
}

const ROLE_ICON_MAP = {
  MASTER: ShieldCheck,
  COLABORADOR: ScanLine,
  EXPOSITOR: Presentation,
  AVALIADOR: ClipboardCheck,
  VISITANTE: Stamp,
};

const ROLE_HEADER_BG_MAP: Record<UserRole, string> = {
  MASTER: "bg-[#6A1B4D]",
  COLABORADOR: "bg-[#F57C00]",
  EXPOSITOR: "bg-[#1565C0]",
  AVALIADOR: "bg-[#1E3A8A]",
  VISITANTE: "bg-[#D81B60]",
};

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const roleConfig = ROLE_META_CONFIG[user.role];
  const RoleIcon = ROLE_ICON_MAP[user.role];
  const isMaster = user.role === "MASTER";

  // Sincronização em Tempo Real (Polling leve)
  useEffect(() => {
    let lastUpdatedAt = 0;
    const interval = setInterval(async () => {
      try {
        const res = await fetch("/api/realtime", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (lastUpdatedAt !== 0 && data.updatedAt > lastUpdatedAt) {
          router.refresh();
        }
        lastUpdatedAt = data.updatedAt;
      } catch {
        // Silencioso em offline
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [router]);

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      toast.success("Sessão encerrada.");
      router.push("/login");
      router.refresh();
    });
  };

  // Layout Largo exclusivo para o Organizador Master
  if (isMaster) {
    const navLinks = [
      {
        href: roleConfig.defaultRoute,
        label: `Painel ${roleConfig.shortLabel}`,
        icon: RoleIcon,
      },
      {
        href: "/cronograma",
        label: "Cronograma & Catálogo",
        icon: CalendarDays,
      },
    ];

    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground">
        <div className="h-[3.5px] w-full bg-meta-gradient sticky top-0 z-40" />

        <header className="no-print sticky top-[3.5px] z-30 bg-[#6A1B4D] text-white shadow-xs">
          <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
            <div className="flex items-center gap-4">
              <Link href={roleConfig.defaultRoute} className="focus:outline-none">
                <MetaLogo compact inverted />
              </Link>

              <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-white/20">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const active = pathname === item.href;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold transition-colors ${
                        active
                          ? "bg-white text-[#6A1B4D] shadow-2xs"
                          : "text-white/85 hover:bg-white/15 hover:text-white"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                      {item.label}
                    </Link>
                  );
                })}
              </nav>
            </div>

            <div className="flex items-center gap-2.5">
              <div className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/15 px-3 py-1 text-xs font-bold text-white backdrop-blur-xs">
                <RoleIcon className="h-3.5 w-3.5" />
                <span>{roleConfig.shortLabel}</span>
              </div>

              <div className="hidden sm:flex flex-col text-right leading-tight">
                <span className="text-xs font-bold text-white max-w-[160px] truncate">
                  {user.name}
                </span>
                <span className="text-[11px] text-fuchsia-200 font-mono">
                  {user.username}
                </span>
              </div>

              <button
                type="button"
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-white/25 bg-white/15 text-white transition hover:bg-white/25"
                title="Alternar tema"
              >
                <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              </button>

              <button
                type="button"
                onClick={handleLogout}
                disabled={isPending}
                className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/25 bg-white/15 px-2.5 text-xs font-semibold text-white transition hover:bg-rose-500/80"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden md:inline">Sair</span>
              </button>
            </div>
          </div>
        </header>

        <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-5 pb-20 sm:px-6">
          {children}
        </main>

        <DemoRoleSwitcher currentRole={user.role} currentUserName={user.name} />
      </div>
    );
  }

  const headerBgClass = ROLE_HEADER_BG_MAP[user.role];

  // Shell Nativo Mobile Focado (Visitante, Avaliador, Expositor e Colaborador)
  return (
    <div className="min-h-dvh bg-slate-200/70 dark:bg-[#050811] flex justify-center">
      <div className="relative flex min-h-dvh w-full max-w-[440px] flex-col bg-background text-foreground shadow-[0_0_50px_rgba(15,23,42,0.15)] md:border-x md:border-slate-200/80 dark:md:border-slate-800/80">
        {/* Fita Superior Oficial de 3.5px */}
        <div className="sticky top-0 z-40 h-[3.5px] w-full bg-meta-gradient" />

        {/* App Bar Nativa Compacta Integrada na Cor do Perfil */}
        <header
          className={`no-print sticky top-[3.5px] z-30 flex h-[52px] items-center justify-between gap-2 px-3.5 text-white ${headerBgClass}`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <Link
              href={roleConfig.defaultRoute}
              className="shrink-0 focus:outline-none"
            >
              <MetaLogo compact inverted />
            </Link>
            <div className="inline-flex items-center gap-1 rounded-full border border-white/25 bg-white/20 px-2.5 py-0.5 text-[11px] font-bold text-white shadow-2xs backdrop-blur-xs shrink-0">
              <RoleIcon className="h-3 w-3" />
              <span>{roleConfig.shortLabel}</span>
            </div>
            {user.role === "AVALIADOR" && (
              <span
                title={
                  user.isAccredited
                    ? "Avaliador Credenciado"
                    : "Credenciamento Pendente"
                }
                className={`inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                  user.isAccredited
                    ? "bg-emerald-400/25 text-emerald-100"
                    : "bg-amber-400/25 text-amber-100"
                }`}
              >
                {user.isAccredited ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <AlertCircle className="h-3.5 w-3.5" />
                )}
              </span>
            )}
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            <Link
              href="/cronograma"
              title="Mapa & Catálogo Geral"
              className={`inline-flex h-8 w-8 items-center justify-center rounded-xl border transition ${
                pathname === "/cronograma"
                  ? "border-white bg-white text-slate-900 shadow-2xs"
                  : "border-white/25 bg-white/15 text-white hover:bg-white/25"
              }`}
            >
              <CalendarDays className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white transition hover:bg-white/25"
              title="Alternar tema"
            >
              <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>

            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-white/25 bg-white/15 text-white transition hover:bg-rose-500/80"
              title="Sair"
            >
              <LogOut className="h-3.5 w-3.5" />
            </button>
          </div>
        </header>

        {/* Área de Conteúdo Nativo Mobile (pb-32 garante folga da BottomNav) */}
        <main className="flex-1 px-3.5 pt-3 pb-32">{children}</main>

        <DemoRoleSwitcher currentRole={user.role} currentUserName={user.name} />
      </div>
    </div>
  );
}
