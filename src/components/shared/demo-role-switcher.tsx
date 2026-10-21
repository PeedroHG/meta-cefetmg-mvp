"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  ShieldCheck,
  ScanLine,
  Presentation,
  ClipboardCheck,
  Stamp,
  Sparkles,
  ChevronUp,
  RotateCcw,
  KeyRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/db/schema";
import { ROLE_META_CONFIG } from "@/lib/utils";
import {
  switchDemoRoleAction,
  switchSpecificDemoUserAction,
  resetDemoDatabaseAction,
} from "@/features/auth/actions";

interface DemoRoleSwitcherProps {
  currentRole?: UserRole | null;
  currentUserName?: string | null;
}

const DEMO_ROLES: {
  role: UserRole;
  title: string;
  subtitle: string;
  icon: typeof ShieldCheck;
  dotColor: string;
}[] = [
  {
    role: "VISITANTE",
    title: "1. Visitante (Passaporte META)",
    subtitle: "Beatriz • Selos Coloridos vs P&B",
    icon: Stamp,
    dotColor: "#D81B60",
  },
  {
    role: "AVALIADOR",
    title: "2. Avaliador Oficial (Banca)",
    subtitle: "Prof. Marcos • Ficha Mobile & 1-Click",
    icon: ClipboardCheck,
    dotColor: "#1E3A8A",
  },
  {
    role: "EXPOSITOR",
    title: "3. Expositor (Estande #4821)",
    subtitle: "Pedro • Emissor Selo QR 60s",
    icon: Presentation,
    dotColor: "#1565C0",
  },
  {
    role: "COLABORADOR",
    title: "4. Colaborador (Recepção/Brindes)",
    subtitle: "Lucas • Check-in e Troca de Selos",
    icon: ScanLine,
    dotColor: "#F57C00",
  },
  {
    role: "MASTER",
    title: "5. Organizador Master (Web/Desktop)",
    subtitle: "Profa. Helena • Gestão, SIGAA e Notas",
    icon: ShieldCheck,
    dotColor: "#6A1B4D",
  },
];

function getShortDemoName(fullName: string) {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] || "";
  if (/^(prof\.?|profa\.?|dr\.?|dra\.?)$/i.test(first) && parts.length > 1) {
    const second = parts[1];
    if (/^(dr\.?|dra\.?)$/i.test(second) && parts.length > 2) {
      return `${first} ${parts[2]}`;
    }
    return `${first} ${second}`;
  }
  return first;
}

export function DemoRoleSwitcher({
  currentRole,
  currentUserName,
}: DemoRoleSwitcherProps) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleSelectRole = (role: UserRole) => {
    startTransition(async () => {
      const res = await switchDemoRoleAction(role);
      if (res.success && res.redirectTo) {
        setOpen(false);
        toast.success(
          `Modo Apresentação: ${ROLE_META_CONFIG[role].label}`
        );
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  };

  const handleOnboardingEvaluatorDemo = () => {
    startTransition(async () => {
      const res = await switchSpecificDemoUserAction("user-aval-3");
      if (res.success && res.redirectTo) {
        setOpen(false);
        toast.info(
          "Simulando 1º Acesso de Avaliador com senha provisória!"
        );
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  };

  const handleResetDemo = () => {
    startTransition(async () => {
      await resetDemoDatabaseAction();
      setOpen(false);
      toast.success("Dados da 35ª META restaurados ao estado inicial!");
      router.refresh();
    });
  };

  const activeConfig = currentRole ? ROLE_META_CONFIG[currentRole] : null;
  const isMaster = currentRole === "MASTER";

  return (
    <>
      {open && (
        <div
          className="no-print fixed inset-0 z-50 bg-slate-950/50 backdrop-blur-xs"
          onClick={() => setOpen(false)}
        />
      )}

      <div
        className={`no-print fixed z-50 ${
          isMaster
            ? "bottom-5 right-5"
            : "bottom-[82px] left-1/2 w-full max-w-[440px] -translate-x-1/2 px-3 pointer-events-none flex flex-col items-end"
        }`}
      >
        {open && (
          <div className="pointer-events-auto mb-2.5 w-full max-w-[380px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="h-1.5 w-full bg-meta-gradient" />
            <div className="p-3.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4 text-[#D81B60]" />
                  <span className="font-display text-xs font-bold text-slate-900 dark:text-white">
                    Alternar Perfil (Demo 35ª META)
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleResetDemo}
                    disabled={isPending}
                    title="Restaurar dados iniciais do Seed"
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-2 py-1 text-[10px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Resetar
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpen(false)}
                    className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {DEMO_ROLES.map((item) => {
                  const Icon = item.icon;
                  const isActive = currentRole === item.role;
                  return (
                    <button
                      key={item.role}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleSelectRole(item.role)}
                      className={`flex w-full items-center gap-2.5 rounded-xl border p-2 text-left transition-all ${
                        isActive
                          ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-slate-800"
                          : "border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
                      }`}
                    >
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
                        style={{ backgroundColor: item.dotColor }}
                      >
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span
                            className={`truncate text-xs font-bold ${
                              isActive
                                ? "text-white"
                                : "text-slate-900 dark:text-slate-100"
                            }`}
                          >
                            {item.title}
                          </span>
                          {isActive && (
                            <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[9px] font-bold text-emerald-300">
                              Ativo
                            </span>
                          )}
                        </div>
                        <p
                          className={`truncate text-[10px] ${
                            isActive
                              ? "text-slate-300"
                              : "text-slate-500 dark:text-slate-400"
                          }`}
                        >
                          {item.subtitle}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div className="mt-2.5 border-t border-slate-200 pt-2 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleOnboardingEvaluatorDemo}
                  className="flex w-full items-center justify-between rounded-lg border border-dashed border-[#1E3A8A]/40 bg-[#1E3A8A]/5 px-2.5 py-1.5 text-left text-[11px] font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/10 dark:border-[#818CF8]/40 dark:bg-[#818CF8]/10 dark:text-[#818CF8]"
                >
                  <span className="flex items-center gap-1.5">
                    <KeyRound className="h-3 w-3" />
                    Testar 1º Acesso (Senha Provisória)
                  </span>
                  <span className="font-mono text-[10px] font-bold">
                    Prof. Eduardo
                  </span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Pílula Compacta com Borda no Gradiente da 35ª META */}
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="pointer-events-auto group relative inline-flex items-center rounded-full p-[1.5px] shadow-lg transition-transform active:scale-95"
          style={{
            backgroundImage:
              "linear-gradient(90deg, #1E3A8A 0%, #1565C0 22%, #6A1B4D 48%, #D81B60 70%, #F57C00 88%, #FBC02D 100%)",
          }}
        >
          <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-950/95 px-2.5 py-1 text-[10px] font-semibold text-white">
            <Sparkles className="h-3 w-3 text-[#FBC02D]" />
            <span>
              Demo:{" "}
              <strong className="font-display">
                {activeConfig ? activeConfig.shortLabel : "Perfis"}
              </strong>
            </span>
            {currentUserName && (
              <span className="text-slate-400">
                • {getShortDemoName(currentUserName)}
              </span>
            )}
            <ChevronUp
              className={`h-3 w-3 text-slate-400 transition-transform ${
                open ? "rotate-180" : ""
              }`}
            />
          </span>
        </button>
      </div>
    </>
  );
}
