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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
        "Por favor, desenhe e confirme sua assinatura digital no Canvas abaixo."
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
          ? "Senha atualizada e Assinatura Digital salva para uso em 1 clique!"
          : "Configuração de primeiro acesso concluída!"
      );
      router.push(res.redirectTo || roleConfig.defaultRoute);
      router.refresh();
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <div className="h-1 w-full bg-meta-gradient" />

      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <MetaLogo />
          <span
            className={`rounded-full px-3 py-1 text-xs font-bold ${roleConfig.badgeClass}`}
          >
            1º Acesso • {roleConfig.shortLabel}
          </span>
        </div>

        <Card className="border-slate-200 shadow-lg dark:border-slate-800">
          <CardHeader>
            <CardTitle className="text-xl flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-[#1565C0]" />
              Bem-vindo(a), {user.name}
            </CardTitle>
            <CardDescription>
              Sua conta ({user.username}) foi criada pela organização da 35ª META. Conclua seu onboarding obrigatório abaixo para liberar seu painel:
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Passo 1: Troca Obrigatória de Senha Provisória */}
            <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50/70 p-4 dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                  <KeyRound className="h-4 w-4 text-[#F57C00]" />
                  1. Definição de Nova Senha Definitiva (Obrigatório)
                </span>
                {user.tempPasswordHint && (
                  <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                    Provisória: {user.tempPasswordHint}
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-400">
                Substitua a senha temporária gerada pelo Organizador Master por uma senha pessoal segura.
              </p>

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Nova Senha Definitiva
                  </label>
                  <Input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Nova senha"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Confirmar Nova Senha
                  </label>
                  <Input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Repita a nova senha"
                  />
                </div>
              </div>
            </div>

            {/* Passo 2 (Exclusivo Avaliador): Desenhar e Salvar Assinatura Digital no Canvas */}
            {user.role === "AVALIADOR" && (
              <div className="space-y-3 rounded-xl border border-[#1E3A8A]/30 bg-[#1E3A8A]/5 p-4 dark:border-[#818CF8]/30 dark:bg-[#1E3A8A]/15">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 font-display text-sm font-bold text-slate-900 dark:text-white">
                    <PenTool className="h-4 w-4 text-[#1565C0]" />
                    2. Cadastro da Sua Assinatura Digital Reutilizável
                  </span>
                  {signatureData && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Pronta
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  Desenhe sua assinatura abaixo. Ela ficará salva no seu perfil para que você possa assinar o credenciamento e encerrar cada avaliação de estande com <strong>apenas 1 clique</strong>!
                </p>

                <SignatureCanvasBox
                  initialSignature={signatureData}
                  confirmLabel={
                    signatureData
                      ? "Assinatura Capturada! Clique em Concluir abaixo"
                      : "Capturar Minha Assinatura no Canvas"
                  }
                  onSaveSignature={(dataUrl) => {
                    setSignatureData(dataUrl);
                    toast.success(
                      "Assinatura digital capturada! Agora clique em Salvar e Acessar Painel."
                    );
                  }}
                />
              </div>
            )}

            {/* Passo Opcional se for Visitante */}
            {user.role === "VISITANTE" && (
              <div className="space-y-2 rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                <span className="font-display text-sm font-bold">
                  Selecione seus interesses para recomendações de estandes:
                </span>
                <div className="flex flex-wrap gap-1.5 pt-2">
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
                        className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                          active
                            ? "bg-[#D81B60] text-white"
                            : "border border-slate-200 bg-white text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
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
              disabled={isPending || (user.role === "AVALIADOR" && !signatureData)}
              onClick={handleFinish}
              className="w-full"
            >
              <CheckCircle2 className="h-4 w-4" />
              {isPending
                ? "Salvando configurações..."
                : "Salvar Tudo e Acessar Meu Painel"}
            </Button>
          </CardContent>
        </Card>
      </div>

      <DemoRoleSwitcher currentRole={user.role} currentUserName={user.name} />
    </div>
  );
}
