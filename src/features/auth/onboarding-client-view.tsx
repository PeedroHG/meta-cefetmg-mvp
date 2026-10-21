"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { KeyRound, PenTool, CheckCircle2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/db/schema";
import type { TagRecord } from "@/db/local-store";
import { ROLE_META_CONFIG } from "@/lib/utils";
import { MetaLogo } from "@/components/shared/meta-logo";
import { DemoRoleSwitcher } from "@/components/shared/demo-role-switcher";
import { SignatureCanvasBox } from "@/components/shared/signature-canvas-box";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { completeOnboardingAction } from "@/features/auth/actions";

interface OnboardingClientViewProps {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    mustChangePassword: boolean;
    tempPasswordHint: string | null;
    savedSignatureData: string | null;
  };
  tags: TagRecord[];
  initialTagIds: string[];
}

export function OnboardingClientView({
  user,
  tags,
  initialTagIds,
}: OnboardingClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newPassword, setNewPassword] = useState("meta2026");
  const [confirmPassword, setConfirmPassword] = useState("meta2026");
  const [signatureData, setSignatureData] = useState<string | null>(
    user.savedSignatureData
  );
  const [selectedTags, setSelectedTags] = useState<string[]>(initialTagIds);

  const roleConfig = ROLE_META_CONFIG[user.role];

  const handleFinish = () => {
    if (user.mustChangePassword) {
      if (newPassword.length < 4) {
        toast.error("A nova senha deve ter pelo menos 4 caracteres.");
        return;
      }
      if (newPassword !== confirmPassword) {
        toast.error("A confirmação de senha não confere.");
        return;
      }
    }

    if (user.role === "AVALIADOR" && !signatureData) {
      toast.error(
        "Desenhe e confirme sua assinatura digital no Canvas abaixo."
      );
      return;
    }

    startTransition(async () => {
      const res = await completeOnboardingAction({
        newPassword: user.mustChangePassword ? newPassword : "meta2026",
        signatureData,
        selectedTagIds: selectedTags,
      });

      if (!res.success) {
        toast.error(res.error || "Erro ao concluir primeiro acesso.");
        return;
      }

      toast.success(
        user.role === "AVALIADOR"
          ? "Senha atualizada e Assinatura 1-Clique salva!"
          : "Configuração de primeiro acesso concluída!"
      );
      router.push(res.redirectTo || roleConfig.defaultRoute);
      router.refresh();
    });
  };

  return (
    <div className="min-h-dvh bg-slate-200/70 dark:bg-[#050811] flex justify-center">
      <div className="relative flex min-h-dvh w-full max-w-[440px] flex-col bg-background text-foreground shadow-[0_0_50px_rgba(15,23,42,0.15)] md:border-x md:border-slate-200/80 dark:md:border-slate-800/80">
        <div className="h-[3.5px] w-full bg-meta-gradient" />

        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 dark:border-slate-800/80 dark:bg-[#0F172A]/95">
          <MetaLogo compact />
          <span
            className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${roleConfig.badgeClass}`}
          >
            1º Acesso • {roleConfig.shortLabel}
          </span>
        </header>

        <main className="flex-1 space-y-3.5 px-3.5 py-4 pb-24">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="flex items-center gap-1.5 font-display text-sm font-bold text-slate-900 dark:text-white">
              <Sparkles className="h-4 w-4 text-[#1565C0]" />
              Olá, {user.name}!
            </div>
            <p className="mt-0.5 text-xs text-slate-500">
              Conclua seu cadastro rápido ({user.username}) para liberar seu
              painel na 35ª META:
            </p>
          </div>

          {/* Passo 1: Troca Obrigatória de Senha Provisória */}
          <div className="space-y-2.5 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-display text-xs font-bold text-slate-900 dark:text-white">
                <KeyRound className="h-3.5 w-3.5 text-[#F57C00]" />
                1. Definir Nova Senha Pessoal
              </span>
              {user.tempPasswordHint && (
                <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-amber-700 dark:text-amber-300">
                  Provisória: {user.tempPasswordHint}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-[11px] font-bold">
                  Nova Senha
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
              <div>
                <label className="mb-1 block text-[11px] font-bold">
                  Confirmar Senha
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="h-10 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Passo 2 (Exclusivo Avaliador): Cadastrar Assinatura 1-Clique */}
          {user.role === "AVALIADOR" && (
            <div className="space-y-2.5 rounded-2xl border border-[#1E3A8A]/30 bg-white p-3.5 shadow-2xs dark:border-[#818CF8]/30 dark:bg-[#0F172A]">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 font-display text-xs font-bold text-slate-900 dark:text-white">
                  <PenTool className="h-3.5 w-3.5 text-[#1565C0]" />
                  2. Assinatura Digital 1-Clique
                </span>
                {signatureData && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                    <CheckCircle2 className="h-3 w-3" /> Capturada
                  </span>
                )}
              </div>
              <p className="text-[11px] text-slate-500">
                Assine uma única vez agora para validar todas as suas fichas em
                pé com 1 toque:
              </p>

              <SignatureCanvasBox
                initialSignature={signatureData}
                confirmLabel={
                  signatureData
                    ? "Assinatura Salva! Toque em Concluir abaixo"
                    : "Capturar Minha Assinatura"
                }
                onSaveSignature={(dataUrl) => {
                  setSignatureData(dataUrl);
                  toast.success("Assinatura capturada!");
                }}
              />
            </div>
          )}

          {user.role === "VISITANTE" && (
            <div className="space-y-2 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
              <span className="font-display text-xs font-bold">
                Seus Interesses na Feira:
              </span>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {tags.map((tag) => {
                  const active = selectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        )
                      }
                      className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                        active
                          ? "bg-[#D81B60] text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <Button
            type="button"
            size="field"
            disabled={
              isPending || (user.role === "AVALIADOR" && !signatureData)
            }
            onClick={handleFinish}
            className="w-full rounded-xl"
          >
            <CheckCircle2 className="h-4 w-4" />
            {isPending ? "Salvando..." : "Concluir e Abrir Painel"}
          </Button>
        </main>

        <DemoRoleSwitcher
          currentRole={user.role}
          currentUserName={user.name}
        />
      </div>
    </div>
  );
}
