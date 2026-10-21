"use client";

import React, { useTransition } from "react";
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
import { logoutAction } from "@/features/auth/actions";

const ROLE_ICON_MAP = {
  MASTER: ShieldCheck,
  COLABORADOR: ScanLine,
  EXPOSITOR: Presentation,
  AVALIADOR: ClipboardCheck,
  VISITANTE: Stamp,
};

export const ROLE_GRADIENT_MAP: Record<UserRole, string> = {
  MASTER: "bg-gradient-to-b from-[#6A1B4D] via-[#58143F] to-[#450F31]",
  COLABORADOR: "bg-gradient-to-b from-[#F57C00] via-[#EA580C] to-[#C2410C]",
  EXPOSITOR: "bg-gradient-to-b from-[#1565C0] via-[#1D4ED8] to-[#0F3E8A]",
  AVALIADOR: "bg-gradient-to-b from-[#1E3A8A] via-[#1D4ED8] to-[#172554]",
  VISITANTE: "bg-gradient-to-b from-[#D81B60] via-[#C2185B] to-[#9C1449]",
};

interface UnifiedRoleHeaderProps {
  user: {
    id: string;
    name: string;
    role: UserRole;
    isAccredited?: boolean;
  };
  children: React.ReactNode;
}

export function UnifiedRoleHeader({ user, children }: UnifiedRoleHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  const roleConfig = ROLE_META_CONFIG[user.role];
  const RoleIcon = ROLE_ICON_MAP[user.role];
  const gradientClass = ROLE_GRADIENT_MAP[user.role];

  const handleLogout = () => {
    startTransition(async () => {
      await logoutAction();
      toast.success("Sessão encerrada.");
      router.push("/login");
      router.refresh();
    });
  };

  return (
    <header
      className={`no-print rounded-b-[28px] ${gradientClass} px-4 pt-3.5 pb-4 text-white shadow-md`}
    >
      {/* Linha Superior: Logo + Badge + Ações Rápidas (Cronograma, Tema, Sair) */}
      <div className="flex items-center justify-between gap-2">
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
      </div>

      {/* Conteúdo Específico do Cabeçalho do Perfil */}
      <div className="mt-3.5">{children}</div>
    </header>
  );
}
