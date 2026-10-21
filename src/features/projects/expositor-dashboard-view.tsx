"use client";

import React, { useState, useEffect, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Presentation,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lock,
  Palette,
  PenTool,
  Users,
  ClipboardCheck,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectRecord, TagRecord } from "@/db/local-store";
import { generateDynamicStampCode } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignatureCanvasBox } from "@/components/shared/signature-canvas-box";
import { updateProjectStandByExpositorAction } from "@/features/projects/actions";
import { signProjectAccreditationAction } from "@/features/accreditation/actions";
import { refreshProjectStampTokenAction } from "@/features/passport/actions";

interface ExpositorProject extends ProjectRecord {
  tags: TagRecord[];
  teamMembers: { id: string; name: string; username: string }[];
  assignedEvaluators: {
    id: string;
    name: string;
    hasEvaluated: boolean;
  }[];
  stampsCollectedCount: number;
}

interface ExpositorDashboardViewProps {
  currentUser: { id: string; name: string };
  project: ExpositorProject;
}

export function ExpositorDashboardView({
  currentUser,
  project,
}: ExpositorDashboardViewProps) {
  const [isPending, startTransition] = useTransition();

  // QR Code Dinâmico de Selo com rotação de 60s
  const [stampToken, setStampToken] = useState(project.activeStampToken);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Personalização da página pública e selo do estande
  const [bio, setBio] = useState(project.bio);
  const [stampLabel, setStampLabel] = useState(
    project.title.split(":")[0].slice(0, 11)
  );
  const [primaryColor, setPrimaryColor] = useState("#1565C0");
  const [secondaryColor, setSecondaryColor] = useState("#D81B60");

  useEffect(() => {
    const updateTick = () => {
      const info = generateDynamicStampCode(project.id);
      setSecondsLeft(info.secondsRemaining);
    };
    updateTick();
    const timer = setInterval(updateTick, 1000);
    return () => clearInterval(timer);
  }, [project.id]);

  const handleRefreshToken = () => {
    startTransition(async () => {
      const res = await refreshProjectStampTokenAction(project.id);
      if (res.success && res.token) {
        setStampToken(res.token);
        toast.success(`Novo código temporário gerado: #${res.token}`);
      }
    });
  };

  const handleSaveStandCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProjectStandByExpositorAction({
        projectId: project.id,
        bio,
        stampLabel,
        stampPrimaryColor: primaryColor,
        stampSecondaryColor: secondaryColor,
      });
      if (res.success) {
        toast.success(
          "Página pública do estande e arte do selo atualizadas com sucesso!"
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleSignAccreditationOnOwnPhone = (signatureData: string) => {
    startTransition(async () => {
      const res = await signProjectAccreditationAction({
        projectId: project.id,
        signatureData,
        exhibitorUserId: currentUser.id,
      });
      if (res.success) {
        toast.success(
          "Credenciamento da equipe assinado pelo seu celular! Estande liberado para avaliações."
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  const evalDoneCount = project.assignedEvaluators.filter(
    (e) => e.hasEvaluated
  ).length;

  return (
    <div className="space-y-6">
      {/* Banner do Estande (Azul Royal #1565C0) */}
      <div className="rounded-2xl border border-[#1565C0]/30 bg-white p-6 shadow-xs dark:border-[#3B82F6]/30 dark:bg-[#0F172A]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1565C0]/10 px-3 py-1 text-xs font-bold text-[#1565C0] dark:bg-[#3B82F6]/20 dark:text-[#60A5FA]">
                <Presentation className="h-3.5 w-3.5" />
                Estande Oficial • Código #{project.shortCode}
              </span>
              {project.isAccredited ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Equipe Credenciada
                </Badge>
              ) : (
                <Badge variant="warning">
                  <Clock className="h-3.5 w-3.5" /> Credenciamento Pendente na
                  Recepção
                </Badge>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              {project.title}
            </h1>
            <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-slate-600 dark:text-slate-400">
              <span className="inline-flex items-center gap-1 font-medium">
                <MapPin className="h-3.5 w-3.5 text-[#D81B60]" />
                {project.standLocation} ({project.shift})
              </span>
              <span>•</span>
              <span className="font-mono">{project.sigaaCode}</span>
            </div>
          </div>

          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-800 dark:bg-slate-900">
            {project.stampImageUrl && (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={project.stampImageUrl}
                alt="Selo do Projeto"
                className="h-12 w-12 rounded-full shadow-xs"
              />
            )}
            <div>
              <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                Selos Emitidos
              </span>
              <div className="font-mono text-xl font-extrabold text-[#1565C0] dark:text-[#60A5FA]">
                {project.stampsCollectedCount} visitantes
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Caso o Colaborador tenha liberado a assinatura no celular do aluno */}
      {!project.isAccredited && project.accreditationUnlocked && (
        <Card className="border-amber-500/40 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
              <PenTool className="h-5 w-5" />
              Assinatura de Credenciamento Liberada pela Recepção!
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-300">
              O Colaborador liberou a retirada do kit/banner. Assine abaixo diretamente no seu celular para credenciar toda a equipe:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SignatureCanvasBox
              confirmLabel="Assinar Recebimento do Kit e Credenciar Estande"
              onSaveSignature={handleSignAccreditationOnOwnPhone}
            />
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-12">
        {/* Coluna Esquerda (5 cols): Gerador de Selo QR Dinâmico + Status dos Avaliadores */}
        <div className="lg:col-span-5 space-y-6">
          {/* Card Emissor de Selo Dinâmico para Visitantes */}
          <Card className="border-[#1565C0]/30 shadow-md">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="h-5 w-5 text-[#1565C0]" />
                  Emissor de Selo p/ Visitantes
                </CardTitle>
                <span className="rounded-full bg-[#1565C0]/10 px-2.5 py-0.5 font-mono text-xs font-bold text-[#1565C0] dark:text-[#60A5FA]">
                  Expira em {secondsLeft}s
                </span>
              </div>
              <CardDescription>
                Mostre este QR Code ou código numérico dinâmico apenas após o visitante assistir à explicação do seu estande!
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4 text-center">
              <div className="mx-auto flex w-fit flex-col items-center rounded-2xl border-2 border-slate-200 bg-white p-4 shadow-xs">
                <QRCodeSVG
                  value={stampToken || project.shortCode}
                  size={180}
                  level="M"
                />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Código Temporário de 6 Dígitos (Caso a câmera não leia)
                </div>
                <div className="mt-1 font-mono text-3xl font-extrabold tracking-widest text-[#1565C0] dark:text-[#60A5FA]">
                  {stampToken || project.shortCode}
                </div>
                <div className="mt-1 text-[11px] text-slate-500">
                  Código curto fixo do estande: <strong>#{project.shortCode}</strong>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="field"
                disabled={isPending}
                onClick={handleRefreshToken}
                className="w-full"
              >
                <RefreshCw className="h-4 w-4" />
                Gerar Novo Código Temporário Agora
              </Button>
            </CardContent>
          </Card>

          {/* Card de Status dos Avaliadores (Sem revelar notas) */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center justify-between text-base">
                <span className="flex items-center gap-2">
                  <ClipboardCheck className="h-4 w-4 text-[#1E3A8A] dark:text-[#818CF8]" />
                  Status da Banca Avaliadora
                </span>
                <Badge variant="default">
                  {evalDoneCount} / {project.assignedEvaluators.length} concluídas
                </Badge>
              </CardTitle>
              <CardDescription>
                Acompanhe quais professores designados pelo Master já passaram pelo seu estande (as notas são sigilosas).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              {project.assignedEvaluators.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {ev.name}
                  </span>
                  {ev.hasEvaluated ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Já Avaliou
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Clock className="h-3 w-3" /> Falta Avaliar
                    </Badge>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Coluna Direita (7 cols): Personalização da Página Pública e Arte do Selo + Dados Imutáveis */}
        <div className="lg:col-span-7 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Palette className="h-5 w-5 text-[#D81B60]" />
                Personalizar Página Pública & Selo Colecionável
              </CardTitle>
              <CardDescription>
                Você pode editar livremente a descrição pública do projeto e personalizar o visual do selo que os visitantes colecionam no Passaporte META.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveStandCustomization} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold">
                    Bio / Resumo Público do Projeto (Visível no Catálogo e Passaporte)
                  </label>
                  <textarea
                    rows={4}
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-white p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1565C0] dark:border-slate-800 dark:bg-slate-950"
                    required
                  />
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Texto no Selo (Máx 12 letras)
                    </label>
                    <Input
                      value={stampLabel}
                      maxLength={12}
                      onChange={(e) => setStampLabel(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Cor Principal do Selo
                    </label>
                    <Input
                      type="color"
                      value={primaryColor}
                      onChange={(e) => setPrimaryColor(e.target.value)}
                      className="h-11 p-1 cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Cor Secundária do Selo
                    </label>
                    <Input
                      type="color"
                      value={secondaryColor}
                      onChange={(e) => setSecondaryColor(e.target.value)}
                      className="h-11 p-1 cursor-pointer"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  size="field"
                  disabled={isPending}
                  className="w-full"
                >
                  Salvar Personalização do Estande e Selo
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Dados Institucionais Imutáveis (Controlados pelo Master) */}
          <Card className="border-slate-200/80 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-900/40">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <Lock className="h-4 w-4 text-slate-400" />
                Vínculos Oficiais Protegidos (Gerenciados pelo Organizador Master)
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-xs text-slate-600 dark:text-slate-400">
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Integrantes da Equipe Expositora:
                </span>
                <div className="mt-1 flex flex-wrap gap-2">
                  {project.teamMembers.map((m) => (
                    <span
                      key={m.id}
                      className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 font-medium dark:border-slate-800 dark:bg-slate-900"
                    >
                      <Users className="h-3 w-3 text-[#1565C0]" />
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Tags Oficiais de Recomendação:
                </span>
                <div className="mt-1 flex flex-wrap gap-1.5">
                  {project.tags.map((t) => (
                    <Badge key={t.id} variant="secondary">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
