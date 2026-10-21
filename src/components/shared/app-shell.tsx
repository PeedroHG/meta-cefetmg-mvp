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

export function AppShell({ user, children }: AppShellProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const roleConfig = ROLE_META_CONFIG[user.role];
  const RoleIcon = ROLE_ICON_MAP[user.role];

  // Sincronização em Tempo Real (Polling leve + BroadcastChannel entre abas)
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
      {/* Barra Superior de 3px no Gradiente Oficial da 35ª META */}
      <div className="h-[3.5px] w-full bg-meta-gradient sticky top-0 z-40" />

      {/* Header Institucional */}
      <header className="no-print sticky top-[3.5px] z-30 border-b border-slate-200/90 bg-white/90 backdrop-blur-md dark:border-slate-800/90 dark:bg-[#0F172A]/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-4">
            <Link href={roleConfig.defaultRoute} className="focus:outline-none">
              <MetaLogo compact />
            </Link>

            {/* Navegação Desktop */}
            <nav className="hidden md:flex items-center gap-1 ml-4 pl-4 border-l border-slate-200 dark:border-slate-800">
              {navLinks.map((item) => {
                const Icon = item.icon;
                const active = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`inline-flex items-center gap-2 rounded-lg px-3 py-2 text-xs font-semibold transition-colors ${
                      active
                        ? "bg-slate-900 text-white dark:bg-slate-800 dark:text-white"
                        : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/60"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Badge de Identidade Visual Rápida do Perfil (Cor da Fita META) */}
            <div
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold shadow-xs ${roleConfig.badgeClass}`}
            >
              <RoleIcon className="h-3.5 w-3.5" />
              <span>{roleConfig.shortLabel}</span>
            </div>

            {/* Indicador de Credenciamento para Avaliador */}
            {user.role === "AVALIADOR" && (
              <span
                className={`hidden lg:inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold ${
                  user.isAccredited
                    ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                    : "border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                }`}
              >
                {user.isAccredited ? (
                  <>
                    <CheckCircle2 className="h-3 w-3" /> Credenciado
                  </>
                ) : (
                  <>
                    <AlertCircle className="h-3 w-3" /> Credenciamento Pendente
                  </>
                )}
              </span>
            )}

            {/* Nome do Usuário */}
            <div className="hidden sm:flex flex-col text-right leading-tight">
              <span className="text-xs font-bold text-slate-900 dark:text-slate-100 max-w-[160px] truncate">
                {user.name}
              </span>
              <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                {user.username}
              </span>
            </div>

            {/* Alternador Light / Dark Mode */}
            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
              title="Alternar tema Claro / Escuro"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Alternar tema</span>
            </button>

            {/* Sair */}
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 text-xs font-semibold text-slate-700 transition hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-rose-950/40 dark:hover:text-rose-300"
              title="Trocar conta ou sair"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span className="hidden md:inline">Sair</span>
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal */}
      <main className="mx-auto w-full max-w-7xl flex-1 px-4 py-6 pb-24 sm:px-6 md:pb-12">
        {children}
      </main>

      {/* Bottom Navigation Bar Fixa no Mobile (<768px) */}
      <nav className="no-print fixed inset-x-0 bottom-0 z-30 flex h-16 items-center justify-around border-t border-slate-200 bg-white/95 px-2 backdrop-blur-md dark:border-slate-800 dark:bg-[#0F172A]/95 md:hidden">
        {navLinks.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 py-1 text-[11px] font-semibold transition-colors ${
                active
                  ? "text-[#1565C0] dark:text-[#60A5FA]"
                  : "text-slate-500 dark:text-slate-400"
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Pílula Flutuante do Modo Apresentação para Professora */}
      <DemoRoleSwitcher currentRole={user.role} currentUserName={user.name} />
    </div>
  );
}
