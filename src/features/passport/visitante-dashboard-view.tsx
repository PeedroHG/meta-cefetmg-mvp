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
    <div className="space-y-3.5">
      {/* Header Principal Nativo com Curva Inferior e Cor do Visitante (#D81B60) */}
      <div className="-mx-3.5 -mt-3 rounded-b-[28px] bg-gradient-to-br from-[#D81B60] via-[#C2185B] to-[#9C1449] px-4 pt-3.5 pb-4 text-white shadow-md">
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
      </div>

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
                  ? "bg-[#D81B60] text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Disponíveis ({activeColoredStamps.length})
            </button>
            <button
              type="button"
              onClick={() => setStampFilter("spent")}
              className={`rounded-lg py-1.5 text-xs font-bold transition ${
                stampFilter === "spent"
                  ? "bg-slate-800 text-white shadow-2xs dark:bg-slate-700"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              Trocados ({spentBwStamps.length})
            </button>
          </div>

          {/* Atalho Demo 1-Toque para Testar Carimbada */}
          <div className="flex items-center justify-between gap-2 rounded-xl border border-dashed border-[#D81B60]/35 bg-[#D81B60]/5 px-3 py-2">
            <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
              Simular carimbo:
            </span>
            <div className="flex items-center gap-1.5">
              {["META35", "ROBO26", "SOLAR1"].map((token) => (
                <button
                  key={token}
                  type="button"
                  disabled={isPending}
                  onClick={() => handleCollectStamp(token)}
                  className="rounded-lg border border-[#D81B60]/30 bg-white px-2 py-1 font-mono text-[10px] font-bold text-[#D81B60] shadow-2xs active:scale-95 dark:bg-slate-900 dark:text-[#F472B6]"
                >
                  +{token}
                </button>
              ))}
            </div>
          </div>

          {/* Grid 2 Colunas Estilo Caderneta de Passaporte */}
          <div className="grid grid-cols-2 gap-2.5">
            {filteredStamps.map((stamp, idx) => {
              const isJustStamped = justCollectedStampId === stamp.projectId;
              const rotationClass =
                idx % 3 === 0
                  ? "-rotate-2"
                  : idx % 3 === 1
                  ? "rotate-2"
                  : "-rotate-1";

              return (
                <div
                  key={stamp.id}
                  className={`relative flex flex-col justify-between overflow-hidden rounded-2xl border p-3 transition-all ${
                    stamp.isSpent
                      ? "border-dashed border-slate-300 bg-slate-100/80 dark:border-slate-800 dark:bg-slate-900/50"
                      : "border-slate-200 bg-white shadow-xs dark:border-slate-800 dark:bg-[#0F172A]"
                  } ${isJustStamped ? "animate-stamp-in ring-2 ring-[#D81B60]" : ""}`}
                >
                  {/* Topo: Código + Botão Favoritar */}
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] font-bold text-slate-400">
                      #{stamp.projectShortCode}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleToggleFavorite(stamp.id)}
                      className={`rounded-full p-1 transition ${
                        stamp.likedProject
                          ? "text-[#D81B60]"
                          : "text-slate-300 hover:text-slate-500"
                      }`}
                    >
                      <Heart
                        className={`h-3.5 w-3.5 ${
                          stamp.likedProject ? "fill-current" : ""
                        }`}
                      />
                    </button>
                  </div>

                  {/* Arte do Carimbo Circular */}
                  <div className="relative my-2 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={stamp.stampImageUrl}
                      alt={stamp.projectTitle}
                      className={`h-20 w-20 rounded-full object-cover shadow-sm transition-transform ${rotationClass} ${
                        stamp.isSpent
                          ? "grayscale contrast-125 opacity-60"
                          : "ring-2 ring-[#D81B60]/20"
                      }`}
                    />

                    {/* Faixa Diagonal quando Gasto na Troca de Brinde */}
                    {stamp.isSpent && (
                      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                        <span className="-rotate-12 rounded border border-slate-700 bg-slate-900/90 px-1.5 py-0.5 font-mono text-[8px] font-extrabold uppercase tracking-wider text-white shadow-xs">
                          TROCA REALIZADA
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Rodapé do Carimbo */}
                  <div className="text-center">
                    <h3
                      className={`line-clamp-1 font-display text-xs font-bold ${
                        stamp.isSpent
                          ? "text-slate-500 dark:text-slate-400"
                          : "text-slate-900 dark:text-white"
                      }`}
                    >
                      {stamp.projectTitle.split(":")[0]}
                    </h3>
                    <div className="mt-0.5 flex items-center justify-center gap-1 text-[10px] text-slate-500">
                      <span
                        className={`inline-block h-1.5 w-1.5 rounded-full ${
                          stamp.isSpent ? "bg-slate-400" : "bg-emerald-500"
                        }`}
                      />
                      <span>
                        {stamp.isSpent ? "Recordação P&B" : "Válido p/ Brinde"}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 2: EXPLORAR (RECOMENDADOS POR TAGS)
         ========================================================= */}
      {activeTab === "explorar" && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                Recomendados para Você
              </h2>
              <p className="text-[11px] text-slate-500">
                Baseado nas suas tags de interesse na 35ª META
              </p>
            </div>
            <button
              type="button"
              onClick={() => setActiveTab("carteira")}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-[11px] font-bold text-slate-700 shadow-2xs dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
            >
              <SlidersHorizontal className="h-3 w-3 text-[#D81B60]" />
              Tags ({selectedTags.length})
            </button>
          </div>

          {uncollectedProjects.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-center">
              <CheckCircle2 className="mx-auto h-7 w-7 text-emerald-600" />
              <p className="mt-1.5 font-display text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Você gabaritou os projetos!
              </p>
              <p className="text-xs text-emerald-800 dark:text-emerald-300">
                Todos os selos da feira já estão no seu Passaporte.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {uncollectedProjects.map((proj) => (
                <div
                  key={proj.id}
                  className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-3 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]"
                >
                  {/* Mini Preview do Selo */}
                  {proj.stampImageUrl && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={proj.stampImageUrl}
                      alt={proj.title}
                      className="h-12 w-12 shrink-0 rounded-full border border-slate-200 object-cover"
                    />
                  )}

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="font-mono text-[10px] font-bold text-[#1565C0] dark:text-[#60A5FA]">
                        #{proj.shortCode}
                      </span>
                      {proj.matchCount > 0 && (
                        <span className="inline-flex items-center gap-0.5 rounded-full bg-[#D81B60]/10 px-1.5 py-0.5 text-[9px] font-bold text-[#D81B60] dark:text-[#F472B6]">
                          <Sparkles className="h-2.5 w-2.5" />
                          {proj.matchCount} em comum
                        </span>
                      )}
                    </div>
                    <h3 className="truncate font-display text-xs font-bold text-slate-900 dark:text-white">
                      {proj.title}
                    </h3>
                    <div className="mt-0.5 flex items-center gap-1 text-[10px] text-slate-500">
                      <MapPin className="h-3 w-3 shrink-0 text-[#D81B60]" />
                      <span className="truncate">{proj.standLocation}</span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant="magenta"
                    size="sm"
                    disabled={isPending}
                    onClick={() =>
                      handleCollectStamp(
                        proj.activeStampToken || proj.shortCode
                      )
                    }
                    className="shrink-0 rounded-xl px-3 text-xs"
                  >
                    Carimbar
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          ABA 3: BRINDES (META E REGRAS DE TROCA)
         ========================================================= */}
      {activeTab === "brindes" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-[#F57C00]/30 bg-amber-50/70 p-3 text-xs text-amber-950 dark:border-amber-800/50 dark:bg-amber-950/30 dark:text-amber-200">
            <p className="font-bold">✨ Troque sem perder sua coleção!</p>
            <p className="mt-0.5 text-[11px] opacity-90">
              Ao resgatar um brinde no balcão, seus selos usados viram{" "}
              <strong>recordação Preto & Branco</strong> no Passaporte.
            </p>
          </div>

          {nextReward && (
            <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-700 dark:text-slate-200">
                  Seu saldo colorido atual:
                </span>
                <span className="font-mono font-extrabold text-[#D81B60]">
                  {activeColoredStamps.length} selos disponíveis
                </span>
              </div>
              <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className="h-full rounded-full bg-meta-gradient transition-all"
                  style={{
                    width: `${Math.min(
                      100,
                      (activeColoredStamps.length / nextReward.stampCost) * 100
                    )}%`,
                  }}
                />
              </div>
            </div>
          )}

          <div className="space-y-2.5">
            {rewards.map((rw) => {
              const canRedeem =
                activeColoredStamps.length >= rw.stampCost &&
                rw.stockQuantity > 0;
              return (
                <div
                  key={rw.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 transition ${
                    canRedeem
                      ? "border-emerald-500/40 bg-emerald-500/5 dark:bg-emerald-950/20"
                      : "border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F172A]"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded-lg bg-[#F57C00]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F57C00]">
                        {rw.stampCost} selos
                      </span>
                      <span className="text-[10px] text-slate-400">
                        Estoque: {rw.stockQuantity}
                      </span>
                    </div>
                    <h3 className="mt-1 font-display text-sm font-bold text-slate-900 dark:text-white">
                      {rw.name}
                    </h3>
                    <p className="text-[11px] text-slate-500">
                      {rw.description}
                    </p>
                  </div>

                  {canRedeem ? (
                    <Button
                      type="button"
                      variant="orange"
                      size="sm"
                      onClick={() => setActiveTab("carteira")}
                      className="shrink-0 rounded-xl text-xs"
                    >
                      Resgatar
                    </Button>
                  ) : (
                    <Badge variant="secondary" className="shrink-0">
                      Faltam{" "}
                      {Math.max(0, rw.stampCost - activeColoredStamps.length)}
                    </Badge>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 4: CARTEIRA QR & INTERESSES
         ========================================================= */}
      {activeTab === "carteira" && (
        <div className="space-y-3.5">
          {/* Passe QR Digital para apresentar na Estação de Brindes */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 text-center shadow-xs dark:border-slate-800 dark:bg-[#0F172A]">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F57C00]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#F57C00]">
              <Gift className="h-3 w-3" />
              Apresente na Estação de Brindes
            </span>
            <div className="mx-auto my-3 flex w-fit flex-col items-center rounded-2xl border-2 border-slate-200 bg-white p-3.5 shadow-xs">
              <QRCodeSVG value={visitor.visitorShortCode} size={168} />
            </div>
            <div className="font-mono text-2xl font-extrabold tracking-widest text-slate-900 dark:text-white">
              {visitor.visitorShortCode}
            </div>
            <p className="mt-1 text-[11px] text-slate-500">
              {activeColoredStamps.length} selos coloridos prontos para troca
            </p>
          </div>

          {/* Seletor Compacto de Interesses */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
            <h3 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Meus Interesses na Feira
            </h3>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
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
                    className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                      active
                        ? "border-[#D81B60] bg-[#D81B60] text-white"
                        : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
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
