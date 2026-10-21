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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { QrScannerSheet } from "@/components/shared/qr-scanner-sheet";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { UnifiedRoleHeader } from "@/components/shared/unified-role-header";
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

type VisitorTab = "passaporte" | "explorar" | "brindes" | "carteira";
type StampFilter = "all" | "colored" | "spent";

export function VisitanteDashboardView({
  visitor,
  stamps,
  recommendedProjects,
  rewards,
  tags,
  myInterestTagIds,
}: VisitanteDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<VisitorTab>("passaporte");
  const [stampFilter, setStampFilter] = useState<StampFilter>("all");
  const [isPending, startTransition] = useTransition();
  const [scannerOpen, setScannerOpen] = useState(false);
  const [selectedTags, setSelectedTags] =
    useState<string[]>(myInterestTagIds);
  const [justCollectedStampId, setJustCollectedStampId] = useState<
    string | null
  >(null);

  const activeColoredStamps = stamps.filter((s) => !s.isSpent);
  const spentBwStamps = stamps.filter((s) => s.isSpent);

  const filteredStamps = stamps.filter((s) => {
    if (stampFilter === "colored") return !s.isSpent;
    if (stampFilter === "spent") return s.isSpent;
    return true;
  });

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
        setActiveTab("passaporte");
        setStampFilter("all");
      }
      toast.success(
        `🎉 Selo colorido "${res.project?.title}" carimbado no Passaporte!`
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
      toast.success("Interesses atualizados!");
    });
  };

  const uncollectedProjects = recommendedProjects.filter(
    (p) => !p.alreadyCollected
  );

  // Próxima meta de brinde
  const nextReward =
    rewards.find((r) => r.stampCost > activeColoredStamps.length) ||
    rewards[rewards.length - 1];

  return (
    <div>
      {/* Header Principal Nativo Unificado com Curva Inferior na Cor do Visitante (#D81B60) */}
      <UnifiedRoleHeader
        user={{
          id: visitor.id,
          name: visitor.name,
          role: "VISITANTE",
          isAccredited: true,
        }}
      >
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
                <Stamp className="h-3 w-3" />
                Passaporte 35ª META
              </span>
              <span className="font-mono text-[11px] font-bold text-pink-100">
                #{visitor.visitorShortCode}
              </span>
            </div>
            <h1 className="mt-1 truncate font-display text-lg font-bold text-white">
              Olá, {visitor.name.split(" ")[0]}!
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("carteira")}
            className="flex shrink-0 items-center gap-1.5 rounded-xl border border-white/25 bg-white/15 px-2.5 py-1.5 text-left text-white backdrop-blur-xs transition active:scale-95 hover:bg-white/20"
          >
            <QrCode className="h-4 w-4 text-white" />
            <div>
              <div className="text-[9px] font-bold uppercase text-pink-100">
                Passe QR
              </div>
              <div className="font-mono text-[11px] font-bold text-white">
                {visitor.visitorShortCode}
              </div>
            </div>
          </button>
        </div>

        {/* 3 Pílulas de Saldo Compactas */}
        <div className="mt-3 grid grid-cols-3 gap-2">
          <div className="rounded-xl border border-white/20 bg-white/15 px-2.5 py-1.5 text-center backdrop-blur-xs">
            <div className="font-mono text-lg font-extrabold leading-tight text-white">
              {activeColoredStamps.length}
            </div>
            <div className="text-[10px] font-semibold text-pink-100">
              Coloridos
            </div>
          </div>

          <div className="rounded-xl border border-white/15 bg-black/15 px-2.5 py-1.5 text-center backdrop-blur-xs">
            <div className="font-mono text-lg font-extrabold leading-tight text-white">
              {spentBwStamps.length}
            </div>
            <div className="text-[10px] font-semibold text-pink-100/90">
              Trocados P&B
            </div>
          </div>

          <div className="rounded-xl border border-white/20 bg-white/15 px-2.5 py-1.5 text-center backdrop-blur-xs">
            <div className="font-mono text-lg font-extrabold leading-tight text-white">
              {stamps.length}
            </div>
            <div className="text-[10px] font-semibold text-pink-100">
              Coleção Total
            </div>
          </div>
        </div>
      </UnifiedRoleHeader>

      <div className="px-3.5 pt-3.5 space-y-3.5">
        {/* =========================================================
            ABA 1: PASSAPORTE (CADERNETA DE SELOS)
           ========================================================= */}
        {activeTab === "passaporte" && (
          <div className="space-y-3">
            {/* Segmented Control (Filtro Rápido de 1 Mão) */}
            <div className="grid grid-cols-3 rounded-xl bg-slate-200/70 p-1 dark:bg-slate-900">
              <button
                type="button"
                onClick={() => setStampFilter("all")}
                className={`rounded-lg py-1.5 text-xs font-bold transition ${
                  stampFilter === "all"
                    ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Todos ({stamps.length})
              </button>
              <button
                type="button"
                onClick={() => setStampFilter("colored")}
                className={`rounded-lg py-1.5 text-xs font-bold transition ${
                  stampFilter === "colored"
                    ? "bg-white text-[#D81B60] shadow-2xs dark:bg-slate-800 dark:text-[#F472B6]"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Válidos ({activeColoredStamps.length})
              </button>
              <button
                type="button"
                onClick={() => setStampFilter("spent")}
                className={`rounded-lg py-1.5 text-xs font-bold transition ${
                  stampFilter === "spent"
                    ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                    : "text-slate-600 dark:text-slate-400"
                }`}
              >
                Trocados ({spentBwStamps.length})
              </button>
            </div>

            {filteredStamps.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
                <Stamp className="mx-auto h-10 w-10 text-slate-300 dark:text-slate-600" />
                <h3 className="mt-2 font-display text-sm font-bold text-slate-700 dark:text-slate-300">
                  Nenhum selo nesta visualização
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Visite estandes credenciados e toque no botão central &quot;Carimbar&quot;!
                </p>
                <Button
                  type="button"
                  variant="magenta"
                  size="sm"
                  onClick={() => setScannerOpen(true)}
                  className="mt-3.5 rounded-xl"
                >
                  <QrCode className="h-4 w-4" />
                  Carimbar Estande
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                {filteredStamps.map((stamp) => {
                  const isSpent = stamp.isSpent;
                  const isJustCollected = justCollectedStampId === stamp.projectId;

                  return (
                    <div
                      key={stamp.id}
                      className={`relative flex flex-col items-center rounded-2xl border p-3.5 text-center transition ${
                        isJustCollected
                          ? "ring-2 ring-[#D81B60] ring-offset-2 animate-pulse"
                          : ""
                      } ${
                        isSpent
                          ? "border-slate-200 bg-slate-100/70 grayscale dark:border-slate-800 dark:bg-slate-900/60"
                          : "border-[#D81B60]/20 bg-white shadow-xs dark:border-[#D81B60]/30 dark:bg-[#0F172A]"
                      }`}
                    >
                      {/* Carimbo Circular Colorido ou P&B */}
                      <div className="relative mb-2">
                        {stamp.stampImageUrl ? (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={stamp.stampImageUrl}
                            alt="Carimbo"
                            className={`h-20 w-20 rounded-full border-2 ${
                              isSpent
                                ? "border-slate-300 grayscale"
                                : "border-[#D81B60]/40 shadow-xs"
                            }`}
                          />
                        ) : (
                          <div
                            className={`flex h-20 w-20 items-center justify-center rounded-full border-2 font-mono text-xs font-black ${
                              isSpent
                                ? "border-slate-300 bg-slate-200 text-slate-500"
                                : "border-[#D81B60]/40 bg-[#D81B60]/10 text-[#D81B60]"
                            }`}
                          >
                            #{stamp.projectShortCode}
                          </div>
                        )}

                        {isSpent && (
                          <span className="absolute -top-1 -right-1 rounded-full bg-slate-700 px-1.5 py-0.5 text-[9px] font-bold text-white">
                            Trocado P&B
                          </span>
                        )}
                      </div>

                      <h4 className="line-clamp-2 font-display text-xs font-bold leading-tight">
                        {stamp.projectTitle}
                      </h4>
                      <span className="mt-1 font-mono text-[10px] text-slate-500">
                        Estande #{stamp.projectShortCode}
                      </span>

                      <div className="mt-2.5 flex items-center justify-between w-full border-t border-slate-100 pt-2 text-[10px] text-slate-500 dark:border-slate-800">
                        <span>
                          {new Date(stamp.collectedAt).toLocaleTimeString("pt-BR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleToggleFavorite(stamp.id)}
                          className="text-slate-400 hover:text-rose-500"
                          title="Favoritar projeto"
                        >
                          <Heart
                            className={`h-3.5 w-3.5 ${
                              stamp.likedProject
                                ? "fill-[#D81B60] text-[#D81B60]"
                                : ""
                            }`}
                          />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* =========================================================
            ABA 2: EXPLORAR & RECOMENDAÇÕES DA TRILHA
           ========================================================= */}
        {activeTab === "explorar" && (
          <div className="space-y-3">
            {uncollectedProjects.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 p-8 text-center dark:border-slate-800">
                <Sparkles className="mx-auto h-10 w-10 text-amber-500" />
                <h3 className="mt-2 font-display text-sm font-bold text-slate-800 dark:text-slate-100">
                  Uau! Você visitou todos os estandes recomendados!
                </h3>
                <p className="mt-1 text-xs text-slate-500">
                  Troque seus selos no Balcão Oficial ou explore outras trilhas.
                </p>
              </div>
            ) : (
              uncollectedProjects.map((p) => (
                <div
                  key={p.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white dark:bg-slate-800">
                        #{p.shortCode}
                      </span>
                      {p.matchCount > 0 && (
                        <span className="ml-1.5 rounded-md bg-[#D81B60]/10 px-2 py-0.5 text-[10px] font-bold text-[#D81B60]">
                          ✨ {p.matchCount} interesses em comum
                        </span>
                      )}
                    </div>

                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-500">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {p.standLocation}
                    </span>
                  </div>

                  <h3 className="mt-2 font-display text-sm font-bold leading-snug text-slate-900 dark:text-white">
                    {p.title}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                    {p.bio}
                  </p>

                  <div className="mt-2.5 flex flex-wrap gap-1">
                    {p.tags.map((t) => (
                      <span
                        key={t.id}
                        className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                      >
                        {t.name}
                      </span>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* =========================================================
            ABA 3: BRINDES & RESGATE
           ========================================================= */}
        {activeTab === "brindes" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
                Seu Saldo para Resgate de Brindes:
              </div>
              <div className="mt-1 flex items-baseline gap-2">
                <span className="font-mono text-3xl font-extrabold text-[#D81B60]">
                  {activeColoredStamps.length}
                </span>
                <span className="text-xs font-medium text-slate-500">
                  selos coloridos disponíveis
                </span>
              </div>
              <p className="mt-1 text-[11px] text-slate-500">
                Apresente seu Passe QR no Balcão de Recepção para retirar seus brindes. Cada brinde resgatado transforma selos coloridos em P&B.
              </p>
            </div>

            <div className="space-y-2">
              {rewards.map((rw) => {
                const canAfford = activeColoredStamps.length >= rw.stampCost;
                return (
                  <div
                    key={rw.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#D81B60]/15 px-2 py-0.5 font-mono text-xs font-bold text-[#D81B60]">
                          {rw.stampCost} selos
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Estoque: {rw.stockQuantity}
                        </span>
                      </div>
                      <h4 className="mt-1 font-display text-xs font-bold text-slate-900 dark:text-white">
                        {rw.name}
                      </h4>
                      <p className="mt-0.5 text-[11px] text-slate-500">
                        {rw.description}
                      </p>
                    </div>

                    <div className="shrink-0 text-right">
                      {canAfford ? (
                        <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-700 dark:text-emerald-400">
                          <CheckCircle2 className="h-3.5 w-3.5" /> Apto
                        </span>
                      ) : (
                        <span className="rounded-xl bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-400 dark:bg-slate-800">
                          Faltam {rw.stampCost - activeColoredStamps.length}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* =========================================================
            ABA 4: PASSE QR PESSOAL DO VISITANTE (PARA LEITURA NO BALCÃO)
           ========================================================= */}
        {activeTab === "carteira" && (
          <div className="space-y-3">
            <div className="rounded-2xl border border-[#D81B60]/30 bg-white p-4 text-center shadow-xs dark:border-[#D81B60]/40 dark:bg-[#0F172A]">
              <div className="text-xs font-bold text-slate-800 dark:text-slate-100">
                Passe QR Oficial de Visitante
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Apresente esta tela no Balcão de Recepção para retirar brindes.
              </p>

              <div className="mx-auto my-3 flex w-fit flex-col items-center rounded-2xl border-2 border-slate-200 bg-white p-3.5 shadow-xs">
                <QRCodeSVG value={visitor.visitorShortCode} size={168} level="M" />
              </div>

              <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Código da Carteira
                </div>
                <div className="font-mono text-2xl font-extrabold text-[#D81B60]">
                  #{visitor.visitorShortCode}
                </div>
              </div>
            </div>

            {/* Trilhas de Interesse Configuradas */}
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
              <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
                <SlidersHorizontal className="h-3.5 w-3.5 text-[#D81B60]" />
                Suas Trilhas de Interesse
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">
                Projetos com essas tags aparecem recomendados no seu feed.
              </p>

              <div className="mt-2.5 flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const selected = selectedTags.includes(tag.id);
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
                      className={`rounded-full px-2.5 py-1 text-xs font-bold transition ${
                        selected
                          ? "bg-[#D81B60] text-white shadow-2xs"
                          : "border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-400"
                      }`}
                    >
                      {tag.name} {selected && "✓"}
                    </button>
                  );
                })}
              </div>

              <Button
                type="button"
                size="sm"
                disabled={isPending}
                onClick={handleSaveInterests}
                className="mt-3 w-full rounded-xl"
              >
                Salvar Preferências
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Sheet de Leitura QR / Código Dinâmico */}
      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        title="Carimbar Passaporte 35ª META"
        description="Aponte para o QR Code dinâmico do estande ou digite o token de 6 caracteres."
        placeholder="Ex: META35, ROBO26, SOLAR1"
        presets={[
          {
            label: "Selo #4821 (NeuroGlove)",
            sublabel: "Token ativo do estande",
            code: "META35",
          },
          {
            label: "Selo #1042 (AgroDrone)",
            sublabel: "Token ativo do estande",
            code: "ROBO26",
          },
          {
            label: "Selo #3190 (BioFiltro)",
            sublabel: "Token ativo do estande",
            code: "SOLAR1",
          },
        ]}
        onCodeSubmit={handleCollectStamp}
      />

      {/* Barra de Navegação Inferior Nativa com Botão Central de Carimbar */}
      <MobileBottomNav
        tabs={[
          {
            id: "passaporte",
            label: "Passaporte",
            icon: Stamp,
            badge: activeColoredStamps.length,
          },
          {
            id: "explorar",
            label: "Explorar",
            icon: Compass,
            badge: uncollectedProjects.length,
          },
          {
            id: "brindes",
            label: "Brindes",
            icon: Gift,
          },
          {
            id: "carteira",
            label: "Meu QR",
            icon: QrCode,
          },
        ]}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as VisitorTab)}
        centerAction={{
          label: "Carimbar",
          icon: QrCode,
          colorHex: "#D81B60",
          onClick: () => setScannerOpen(true),
        }}
        accentColorHex="#D81B60"
      />
    </div>
  );
}
