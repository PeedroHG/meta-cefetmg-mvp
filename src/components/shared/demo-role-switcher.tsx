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
    role: "MASTER",
    title: "1. Organizador Master",
    subtitle: "Profa. Helena • Gestão, SIGAA e Notas",
    icon: ShieldCheck,
    dotColor: "#6A1B4D",
  },
  {
    role: "COLABORADOR",
    title: "2. Colaborador (Recepção/Brindes)",
    subtitle: "Lucas • Credenciamento e Débito de Selos",
    icon: ScanLine,
    dotColor: "#F57C00",
  },
  {
    role: "EXPOSITOR",
    title: "3. Expositor (Estande #4821)",
    subtitle: "Pedro • NeuroGlove, Selo QR e Status",
    icon: Presentation,
    dotColor: "#1565C0",
  },
  {
    role: "AVALIADOR",
    title: "4. Avaliador Oficial (Banca)",
    subtitle: "Prof. Marcos • Ficha META e Assinatura 1-Click",
    icon: ClipboardCheck,
    dotColor: "#1E3A8A",
  },
  {
    role: "VISITANTE",
    title: "5. Visitante (Passaporte META)",
    subtitle: "Beatriz • Recomendações e Selos (Cor vs P&B)",
    icon: Stamp,
    dotColor: "#D81B60",
  },
];

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
        toast.success(`Modo Apresentação: alternado para ${ROLE_META_CONFIG[role].label}`);
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
          "Simulando 1º Acesso de Avaliador com senha provisória + cadastro de assinatura!"
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
      toast.success("Dados de demonstração da 35ª META restaurados ao estado inicial!");
      router.refresh();
    });
  };

  const activeConfig = currentRole ? ROLE_META_CONFIG[currentRole] : null;

  return (
    <div className="no-print fixed bottom-20 right-4 z-50 md:bottom-6 md:right-6">
      {open && (
        <div className="mb-3 w-80 sm:w-96 overflow-hidden rounded-2xl border border-slate-200 bg-white/95 shadow-2xl backdrop-blur-md dark:border-slate-800 dark:bg-[#0F172A]/95">
          <div className="h-1.5 w-full bg-meta-gradient" />
          <div className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#D81B60]" />
                <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                  Modo Apresentação (35ª META)
                </span>
              </div>
              <button
                type="button"
                onClick={handleResetDemo}
                disabled={isPending}
                title="Restaurar dados iniciais do Seed"
                className="inline-flex items-center gap-1 rounded-md border border-slate-200 px-2 py-1 text-[11px] font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <RotateCcw className="h-3 w-3" />
                Resetar Seed
              </button>
            </div>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              Troque em 1 clique entre os 5 atores para demonstrar o fluxo em tempo real:
            </p>

            <div className="mt-3 space-y-1.5">
              {DEMO_ROLES.map((item) => {
                const Icon = item.icon;
                const isActive = currentRole === item.role;
                return (
                  <button
                    key={item.role}
                    type="button"
                    disabled={isPending}
                    onClick={() => handleSelectRole(item.role)}
                    className={`flex w-full items-center gap-3 rounded-xl border p-2.5 text-left transition-all ${
                      isActive
                        ? "border-slate-900 bg-slate-900 text-white dark:border-white dark:bg-slate-800"
                        : "border-slate-200/80 bg-slate-50/70 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800/80"
                    }`}
                  >
                    <div
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-white shadow-xs"
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
                          <span className="rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300">
                            Ativo
                          </span>
                        )}
                      </div>
                      <p
                        className={`truncate text-[11px] ${
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

            {/* Atalho Extra para Demonstrar Onboarding de 1º Acesso */}
            <div className="mt-3 border-t border-slate-200 pt-2.5 dark:border-slate-800">
              <button
                type="button"
                disabled={isPending}
                onClick={handleOnboardingEvaluatorDemo}
                className="flex w-full items-center justify-between rounded-lg border border-dashed border-[#1E3A8A]/40 bg-[#1E3A8A]/5 px-3 py-2 text-left text-xs font-medium text-[#1E3A8A] hover:bg-[#1E3A8A]/10 dark:border-[#818CF8]/40 dark:bg-[#818CF8]/10 dark:text-[#818CF8]"
              >
                <span className="flex items-center gap-1.5">
                  <KeyRound className="h-3.5 w-3.5" />
                  Testar 1º Acesso (Troca de Senha + Salvar Assinatura)
                </span>
                <span className="font-mono text-[10px] font-bold">Prof. Eduardo</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pílula Flutuante com Borda no Gradiente da 35ª META */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="group relative inline-flex items-center rounded-full p-[2px] shadow-xl transition-transform active:scale-95"
        style={{
          backgroundImage:
            "linear-gradient(90deg, #1E3A8A 0%, #1565C0 22%, #6A1B4D 48%, #D81B60 70%, #F57C00 88%, #FBC02D 100%)",
        }}
      >
        <span className="inline-flex items-center gap-2 rounded-full bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white">
          <Sparkles className="h-3.5 w-3.5 text-[#FBC02D]" />
          <span>
            Demo:{" "}
            <strong className="font-display">
              {activeConfig ? activeConfig.shortLabel : "Alternar Perfil"}
            </strong>
          </span>
          {currentUserName && (
            <span className="hidden sm:inline text-slate-400">
              ({currentUserName.split(" ")[0]})
            </span>
          )}
          <ChevronUp
            className={`h-3.5 w-3.5 text-slate-400 transition-transform ${
              open ? "rotate-180" : ""
            }`}
          />
        </span>
      </button>
    </div>
  );
}
