"use client";

import React, { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Stamp,
  QrCode,
  Sparkles,
  Heart,
  Gift,
  Compass,
  MapPin,
  CheckCircle2,
  SlidersHorizontal,
} from "lucide-react";
import { toast } from "sonner";
import type {
  PassportStampRecord,
  ProjectRecord,
  RewardRecord,
  TagRecord,
} from "@/db/local-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { QrScannerSheet } from "@/components/shared/qr-scanner-sheet";
import {
  collectProjectStampAction,
  toggleFavoriteStampProjectAction,
} from "@/features/passport/actions";
import { completeOnboardingAction } from "@/features/auth/actions";

interface EnrichedStamp extends PassportStampRecord {
  projectTitle: string;
  projectShortCode: string;
  projectLocation: string;
  stampImageUrl: string;
}

interface RecommendedProject extends ProjectRecord {
  tags: TagRecord[];
  matchCount: number;
  alreadyCollected: boolean;
}

interface VisitanteDashboardViewProps {
  visitor: {
    id: string;
    name: string;
    username: string;
    visitorShortCode: string;
  };
  stamps: EnrichedStamp[];
  recommendedProjects: RecommendedProject[];
  rewards: RewardRecord[];
  tags: TagRecord[];
  myInterestTagIds: string[];
}

export function VisitanteDashboardView({
  visitor,
  stamps,
  recommendedProjects,
  rewards,
  tags,
  myInterestTagIds,
}: VisitanteDashboardViewProps) {
  const [isPending, startTransition] = useTransition();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [walletQrOpen, setWalletQrOpen] = useState(false);
  const [triageOpen, setTriageOpen] = useState(false);
  const [selectedTags, setSelectedTags] =
    useState<string[]>(myInterestTagIds);
  const [justCollectedStampId, setJustCollectedStampId] = useState<
    string | null
  >(null);

  const activeColoredStamps = stamps.filter((s) => !s.isSpent);
  const spentBwStamps = stamps.filter((s) => s.isSpent);

  const handleCollectStamp = (code: string) => {
    startTransition(async () => {
      const res = await collectProjectStampAction({
        codeOrToken: code,
        likedProject: true,
      });
      if (!res.success) {
        toast.error(res.error || "Não foi possível coletar o selo.");
        return;
      }

      if (res.project) {
        setJustCollectedStampId(res.project.id);
      }
      toast.success(
        `🎉 Selo colorido do projeto "${res.project?.title}" carimbado no seu Passaporte META!`
      );
    });
  };

  const handleToggleFavorite = (stampId: string) => {
    startTransition(async () => {
      await toggleFavoriteStampProjectAction(stampId);
    });
  };

  const handleSaveInterests = () => {
    startTransition(async () => {
      await completeOnboardingAction({
        selectedTagIds: selectedTags,
      });
      setTriageOpen(false);
      toast.success("Suas preferências de recomendação foram atualizadas!");
    });
  };

  const uncollectedProjects = recommendedProjects.filter(
    (p) => !p.alreadyCollected
  );

  return (
    <div className="space-y-6">
      {/* Banner Passaporte META Digital (Magenta #D81B60) */}
      <div className="rounded-2xl border border-[#D81B60]/30 bg-white p-6 shadow-xs dark:border-[#F472B6]/30 dark:bg-[#0F172A] bg-meta-halftone">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#D81B60]/10 px-3 py-1 text-xs font-bold text-[#D81B60] dark:bg-[#F472B6]/20 dark:text-[#F472B6]">
              <Stamp className="h-3.5 w-3.5" />
              Passaporte Digital Oficial • 35ª META
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Passaporte de {visitor.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Visite os estandes recomendados, colete selos coloridos e troque por brindes exclusivos sem perder sua coleção histórica!
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="outline"
              size="field"
              onClick={() => setWalletQrOpen(true)}
            >
              <Gift className="h-4 w-4 text-[#F57C00]" />
              QR da Carteira ({visitor.visitorShortCode})
            </Button>
            <Button
              type="button"
              variant="magenta"
              size="field"
              onClick={() => setScannerOpen(true)}
            >
              <QrCode className="h-4 w-4" />
              Coletar Selo de Estande
            </Button>
          </div>
        </div>

        {/* Contadores Duplos da Carteira de Selos */}
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-xl border border-[#D81B60]/30 bg-[#D81B60]/5 p-4 dark:bg-[#D81B60]/15">
            <span className="text-xs font-semibold text-[#D81B60] dark:text-[#F472B6]">
              🎨 Selos Coloridos (Disponíveis p/ Brinde)
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-[#D81B60] dark:text-[#F472B6]">
              {activeColoredStamps.length} selo(s)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              🖤 Selos em Preto e Branco (Já Trocados)
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-slate-700 dark:text-slate-300">
              {spentBwStamps.length} selo(s)
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-900">
            <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
              🏆 Coleção Histórica Total Visitada
            </span>
            <div className="mt-1 font-mono text-3xl font-extrabold text-[#1565C0] dark:text-[#60A5FA]">
              {stamps.length} / {recommendedProjects.length} estandes
            </div>
          </div>
        </div>
      </div>

      {/* SEÇÃO 1: Álbum de Selos Colecionáveis (Coloridos vs Preto e Branco) */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Stamp className="h-5 w-5 text-[#D81B60]" />
              Meu Álbum de Selos do Passaporte META ({stamps.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Selos vibrantes podem ser gastos no balcão de brindes. Selos já usados permanecem eternamente no seu álbum em <strong>Preto e Branco</strong>!
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {stamps.map((stamp) => {
            const isFresh = justCollectedStampId === stamp.projectId;
            return (
              <div
                key={stamp.id}
                className={`stamp-card relative flex flex-col items-center justify-between rounded-2xl border-2 p-4 text-center transition-all ${
                  isFresh ? "animate-stamp-slam" : ""
                } ${
                  stamp.isSpent
                    ? "border-dashed border-slate-300 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/60"
                    : "border-dashed border-[#D81B60]/40 bg-white shadow-sm dark:border-[#F472B6]/40 dark:bg-[#0F172A]"
                }`}
              >
                {/* Badge de Status no Topo do Selo */}
                <div className="flex w-full items-center justify-between text-[11px]">
                  <span className="font-mono font-bold text-slate-500">
                    #{stamp.projectShortCode}
                  </span>
                  {stamp.isSpent ? (
                    <span className="rounded bg-slate-300 px-2 py-0.5 font-mono text-[10px] font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-300">
                      USADO (P&B)
                    </span>
                  ) : (
                    <span className="rounded bg-emerald-500/15 px-2 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                      DISPONÍVEL
                    </span>
                  )}
                </div>

                {/* Arte Circular do Selo (Colorida se ativo; Grayscale P&B + Carimbo Diagonal se gasto) */}
                <div className="relative my-3 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={stamp.stampImageUrl}
                    alt={stamp.projectTitle}
                    className={`h-28 w-28 rounded-full object-contain transition-all ${
                      stamp.isSpent
                        ? "grayscale contrast-125 opacity-60"
                        : "drop-shadow-md hover:scale-105"
                    }`}
                  />

                  {stamp.isSpent && (
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="-rotate-12 rounded border-2 border-slate-900 bg-white/95 px-2 py-0.5 font-mono text-[10px] font-extrabold uppercase tracking-wider text-slate-900 shadow-xs">
                        TROCA REALIZADA
                      </span>
                    </div>
                  )}
                </div>

                <div className="w-full space-y-2">
                  <h3 className="font-display text-xs font-bold leading-snug line-clamp-2">
                    {stamp.projectTitle}
                  </h3>

                  {/* Voto Popular (Favoritar Projeto Visitado) */}
                  <button
                    type="button"
                    disabled={isPending}
                    onClick={() => handleToggleFavorite(stamp.id)}
                    className={`inline-flex w-full items-center justify-center gap-1.5 rounded-lg border py-1.5 text-[11px] font-semibold transition ${
                      stamp.likedProject
                        ? "border-[#D81B60]/30 bg-[#D81B60]/10 text-[#D81B60] dark:text-[#F472B6]"
                        : "border-slate-200 text-slate-500 hover:bg-slate-100 dark:border-slate-800"
                    }`}
                  >
                    <Heart
                      className={`h-3.5 w-3.5 ${
                        stamp.likedProject ? "fill-current" : ""
                      }`}
                    />
                    {stamp.likedProject
                      ? "Voto Popular Registrado"
                      : "Votar como Favorito"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* SEÇÃO 2: Recomendações Personalizadas por Tags de Interesse */}
      <section className="space-y-4 pt-2">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold flex items-center gap-2">
              <Compass className="h-5 w-5 text-[#1565C0]" />
              Estandes Recomendados para Você
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Ordenados automaticamente com base nas tags que você escolheu no seu Quiz de Triagem.
            </p>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setTriageOpen(true)}
          >
            <SlidersHorizontal className="h-3.5 w-3.5" />
            Editar Meus Interesses ({myInterestTagIds.length})
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {recommendedProjects.map((proj) => (
            <Card
              key={proj.id}
              className={`flex flex-col justify-between ${
                proj.matchCount > 0 && !proj.alreadyCollected
                  ? "border-[#1565C0]/40 dark:border-[#3B82F6]/40"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold dark:bg-slate-800">
                    #{proj.shortCode}
                  </span>
                  {proj.alreadyCollected ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Selo Coletado
                    </Badge>
                  ) : proj.matchCount > 0 ? (
                    <Badge variant="default">
                      <Sparkles className="h-3 w-3" /> {proj.matchCount} Tag(s)
                      em comum
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Sugestão Extra</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-base">{proj.title}</CardTitle>
              </CardHeader>

              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400 line-clamp-2">
                  {proj.bio}
                </p>

                <div className="flex flex-wrap gap-1">
                  {proj.tags.map((t) => {
                    const isMatch = myInterestTagIds.includes(t.id);
                    return (
                      <span
                        key={t.id}
                        className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                          isMatch
                            ? "bg-[#D81B60]/15 text-[#D81B60] dark:text-[#F472B6]"
                            : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                        }`}
                      >
                        {t.name}
                      </span>
                    );
                  })}
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 pt-2.5 dark:border-slate-800">
                  <span className="inline-flex items-center gap-1 font-medium text-slate-700 dark:text-slate-300">
                    <MapPin className="h-3.5 w-3.5 text-[#D81B60]" />
                    {proj.standLocation}
                  </span>
                </div>

                {!proj.alreadyCollected && (
                  <Button
                    type="button"
                    variant="magenta"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      handleCollectStamp(proj.activeStampToken || proj.shortCode)
                    }
                    className="w-full"
                  >
                    <Stamp className="h-3.5 w-3.5" />
                    Coletar Selo (#{proj.shortCode})
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* SEÇÃO 3: Catálogo de Brindes para Troca */}
      <section className="space-y-3 pt-2">
        <h2 className="font-display text-xl font-bold flex items-center gap-2">
          <Gift className="h-5 w-5 text-[#F57C00]" />
          Brindes Disponíveis no Balcão de Trocas
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {rewards.map((rew) => {
            const enough = activeColoredStamps.length >= rew.stampCost;
            return (
              <Card key={rew.id} className="flex flex-col justify-between">
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <Badge variant={enough ? "success" : "magenta"}>
                      {rew.stampCost} selos ativos
                    </Badge>
                    <span className="font-mono text-[11px] text-slate-500">
                      Restam {rew.stockQuantity}
                    </span>
                  </div>
                  <CardTitle className="mt-2 text-sm">{rew.name}</CardTitle>
                </CardHeader>
                <CardContent className="text-xs text-slate-500">
                  <p>{rew.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Modal: QR Code da Carteira do Visitante para Apresentar no Balcão de Brindes */}
      <Dialog open={walletQrOpen} onOpenChange={setWalletQrOpen}>
        <DialogContent className="sm:max-w-sm text-center">
          <DialogHeader>
            <DialogTitle>Carteira Passaporte META</DialogTitle>
            <DialogDescription>
              Apresente este QR Code ou código ao Colaborador no Balcão de Brindes para trocar seus selos ativos!
            </DialogDescription>
          </DialogHeader>
          <div className="my-3 flex flex-col items-center">
            <div className="rounded-2xl border-2 border-slate-200 bg-white p-4">
              <QRCodeSVG value={visitor.visitorShortCode} size={176} />
            </div>
            <div className="mt-3 font-mono text-2xl font-extrabold text-[#D81B60]">
              {visitor.visitorShortCode}
            </div>
            <span className="text-xs text-slate-500">
              Saldo disponível: {activeColoredStamps.length} selo(s) colorido(s)
            </span>
          </div>
        </DialogContent>
      </Dialog>

      {/* Modal: Editar Tags de Interesse (Quiz de Triagem) */}
      <Dialog open={triageOpen} onOpenChange={setTriageOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Personalizar Meus Temas de Interesse</DialogTitle>
            <DialogDescription>
              Selecione os assuntos que você mais gosta para recalcular suas recomendações de estandes:
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-wrap gap-2 py-2">
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
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                    active
                      ? "bg-[#D81B60] text-white"
                      : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                  }`}
                >
                  {tag.name}
                </button>
              );
            })}
          </div>
          <Button
            type="button"
            variant="magenta"
            size="field"
            disabled={isPending}
            onClick={handleSaveInterests}
            className="w-full"
          >
            Atualizar Minhas Recomendações
          </Button>
        </DialogContent>
      </Dialog>

      {/* Scanner QR Code ou Digitação do Código Temporário do Expositor */}
      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        title="Coletar Selo de Estande Visitado"
        description="Escaneie o QR Code dinâmico na tela do expositor ou digite o código numérico:"
        placeholder="Ex: 849201 ou 4821"
        onCodeSubmit={handleCollectStamp}
        presets={uncollectedProjects.map((p) => ({
          label: p.title,
          sublabel: `Token Dinâmico: ${p.activeStampToken || p.shortCode}`,
          code: p.activeStampToken || p.shortCode,
        }))}
      />
    </div>
  );
}
