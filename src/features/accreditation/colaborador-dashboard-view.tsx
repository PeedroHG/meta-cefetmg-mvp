"use client";

import React, { useState, useTransition } from "react";
import {
  ScanLine,
  CheckCircle2,
  Unlock,
  PenTool,
  Gift,
  Search,
  ClipboardCheck,
  Presentation,
  QrCode,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectRecord, RewardRecord } from "@/db/local-store";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SignatureCanvasBox } from "@/components/shared/signature-canvas-box";
import { QrScannerSheet } from "@/components/shared/qr-scanner-sheet";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import {
  unlockProjectAccreditationAction,
  signProjectAccreditationAction,
  unlockEvaluatorAccreditationAction,
  signEvaluatorAccreditationAction,
} from "@/features/accreditation/actions";
import { redeemRewardWithStampsAction } from "@/features/passport/actions";

interface ColaboradorProject extends ProjectRecord {
  expositores: { id: string; name: string; username: string }[];
  avaliadores: {
    id: string;
    name: string;
    isAccredited: boolean;
    hasEvaluated: boolean;
  }[];
  signedByUser: string | null;
}

interface ColaboradorEvaluator {
  id: string;
  name: string;
  username: string;
  isAccredited: boolean;
  accreditationUnlocked: boolean;
  savedSignatureData: string | null;
  accreditationSignature: string | null;
  accreditedAt: string | null;
}

interface ColaboradorVisitor {
  id: string;
  name: string;
  username: string;
  visitorShortCode: string;
  activeStamps: number;
  spentStamps: number;
  totalStamps: number;
}

interface ColaboradorDashboardViewProps {
  projects: ColaboradorProject[];
  evaluators: ColaboradorEvaluator[];
  visitors: ColaboradorVisitor[];
  rewards: RewardRecord[];
}

type ColaboradorTab = "projects" | "evaluators" | "rewards" | "resumo";

export function ColaboradorDashboardView({
  projects,
  evaluators,
  visitors,
  rewards,
}: ColaboradorDashboardViewProps) {
  const [tab, setTab] = useState<ColaboradorTab>("projects");
  const [onlyPending, setOnlyPending] = useState(false);
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Bottom Sheet de Assinatura Direto no Aparelho do Colaborador (Projeto)
  const [signingProject, setSigningProject] =
    useState<ColaboradorProject | null>(null);
  const [selectedExhibitorId, setSelectedExhibitorId] = useState<string>("");

  // Bottom Sheet de Assinatura Direto no Aparelho do Colaborador (Avaliador)
  const [signingEvaluator, setSigningEvaluator] =
    useState<ColaboradorEvaluator | null>(null);

  // Balcão de Brindes
  const [visitorQuery, setVisitorQuery] = useState("V-3590");
  const [scannerOpen, setScannerOpen] = useState(false);

  const filteredProjects = projects.filter((p) => {
    if (onlyPending && p.isAccredited) return false;
    return (
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.shortCode.includes(search) ||
      p.expositores.some((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      )
    );
  });

  const selectedVisitor = visitors.find(
    (v) =>
      v.visitorShortCode.toLowerCase() === visitorQuery.trim().toLowerCase() ||
      v.username.toLowerCase() === visitorQuery.trim().toLowerCase() ||
      v.name.toLowerCase().includes(visitorQuery.trim().toLowerCase())
  );

  const handleUniversalScan = (code: string) => {
    const clean = code.replace(/^#/, "").trim();
    const matchedProj = projects.find((p) => p.shortCode === clean);
    if (matchedProj) {
      setTab("projects");
      setSearch(clean);
      if (!matchedProj.isAccredited) {
        setSigningProject(matchedProj);
        setSelectedExhibitorId(matchedProj.expositores[0]?.id || "");
      } else {
        toast.info(`Estande #${clean} já está credenciado!`);
      }
      return;
    }

    setTab("rewards");
    setVisitorQuery(clean);
    toast.success(`Carteira ${clean} carregada no Balcão de Brindes!`);
  };

  const handleUnlockProject = (projectId: string, shortCode: string) => {
    startTransition(async () => {
      const res = await unlockProjectAccreditationAction(projectId);
      if (res.success) {
        toast.success(`Assinatura liberada no celular do projeto #${shortCode}!`);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleSignProjectOnDevice = (signatureData: string) => {
    if (!signingProject) return;
    startTransition(async () => {
      const res = await signProjectAccreditationAction({
        projectId: signingProject.id,
        signatureData,
        exhibitorUserId:
          selectedExhibitorId || signingProject.expositores[0]?.id,
      });
      if (res.success) {
        toast.success(
          `Projeto #${signingProject.shortCode} CREDENCIADO! Entregue o kit.`
        );
        setSigningProject(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleUnlockEvaluator = (evaluatorId: string, name: string) => {
    startTransition(async () => {
      const res = await unlockEvaluatorAccreditationAction(evaluatorId);
      if (res.success) {
        toast.success(`Check-in liberado no celular de ${name}!`);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleSignEvaluatorOnDevice = (signatureData: string) => {
    if (!signingEvaluator) return;
    startTransition(async () => {
      const res = await signEvaluatorAccreditationAction({
        evaluatorId: signingEvaluator.id,
        signatureData,
      });
      if (res.success) {
        toast.success(`Avaliador(a) ${signingEvaluator.name} CREDENCIADO(A)!`);
        setSigningEvaluator(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRedeemReward = (rewardId: string) => {
    if (!selectedVisitor) return;
    startTransition(async () => {
      const res = await redeemRewardWithStampsAction({
        visitorIdentifier: selectedVisitor.visitorShortCode,
        rewardId,
      });
      if (!res.success) {
        toast.error(res.error);
        return;
      }
      toast.success(
        `🎁 "${res.rewardName}" entregue! ${res.stampsDebited} selos de ${res.visitorName} viraram P&B.`
      );
    });
  };

  const pendingProjectsCount = projects.filter((p) => !p.isAccredited).length;
  const pendingEvaluatorsCount = evaluators.filter(
    (e) => !e.isAccredited
  ).length;

  return (
    <div className="space-y-3.5">
      {/* Header Compacto Mobile da Recepção & Brindes (#F57C00) */}
      <div className="rounded-2xl border border-[#F57C00]/30 bg-white p-3.5 shadow-xs dark:border-[#F57C00]/30 dark:bg-[#0F172A]">
        <div className="flex items-center justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 rounded-full bg-[#F57C00]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#F57C00]">
              <ScanLine className="h-3 w-3" />
              Operação de Campo • 35ª META
            </span>
            <h1 className="mt-1 font-display text-base font-bold text-slate-900 dark:text-white">
              Recepção & Balcão de Brindes
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setScannerOpen(true)}
            className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#F57C00] px-3 py-2 text-xs font-bold text-white shadow-xs active:scale-95"
          >
            <QrCode className="h-4 w-4" />
            Scanner
          </button>
        </div>

        {/* 3 Pílulas de Resumo Rápido */}
        <div className="mt-3 grid grid-cols-3 gap-2 text-center">
          <button
            type="button"
            onClick={() => setTab("projects")}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
              {projects.filter((p) => p.isAccredited).length}/{projects.length}
            </div>
            <div className="text-[10px] font-semibold text-slate-500">
              Estandes
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab("evaluators")}
            className="rounded-xl border border-slate-200 bg-slate-50 px-2 py-1.5 dark:border-slate-800 dark:bg-slate-900"
          >
            <div className="font-mono text-base font-extrabold text-slate-900 dark:text-white">
              {evaluators.filter((e) => e.isAccredited).length}/
              {evaluators.length}
            </div>
            <div className="text-[10px] font-semibold text-slate-500">
              Avaliadores
            </div>
          </button>

          <button
            type="button"
            onClick={() => setTab("rewards")}
            className="rounded-xl border border-[#F57C00]/25 bg-[#F57C00]/5 px-2 py-1.5"
          >
            <div className="font-mono text-base font-extrabold text-[#F57C00]">
              {selectedVisitor ? selectedVisitor.activeStamps : 0}
            </div>
            <div className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              Selos Visitante
            </div>
          </button>
        </div>
      </div>

      {/* =========================================================
          ABA 1: CHECK-IN DE PROJETOS EXPOSITORES
         ========================================================= */}
      {tab === "projects" && (
        <div className="space-y-2.5">
          {/* Busca + Filtro Pendentes */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Código (#4821) ou aluno..."
                className="h-10 pl-8 text-xs"
              />
            </div>
            <button
              type="button"
              onClick={() => setOnlyPending(!onlyPending)}
              className={`shrink-0 rounded-xl border px-3 text-xs font-bold transition ${
                onlyPending
                  ? "border-[#F57C00] bg-[#F57C00] text-white"
                  : "border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              Pendentes ({pendingProjectsCount})
            </button>
          </div>

          {filteredProjects.map((proj) => (
            <div
              key={proj.id}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="rounded-md bg-slate-900 px-2 py-0.5 font-mono text-xs font-bold text-white dark:bg-slate-800">
                  #{proj.shortCode}
                </span>
                {proj.isAccredited ? (
                  <Badge variant="success">
                    <CheckCircle2 className="h-3 w-3" /> Credenciado
                  </Badge>
                ) : (
                  <Badge variant="warning">Falta Retirar Kit</Badge>
                )}
              </div>

              <h3 className="mt-1.5 font-display text-sm font-bold leading-snug text-slate-900 dark:text-white">
                {proj.title}
              </h3>
              <p className="mt-0.5 text-[11px] text-slate-500">
                {proj.standLocation} •{" "}
                {proj.expositores.map((e) => e.name.split(" ")[0]).join(", ")}
              </p>

              {proj.isAccredited ? (
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-emerald-500/10 px-3 py-1.5 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300">
                  <span>Assinado por: {proj.signedByUser || "Equipe"}</span>
                  {proj.accreditationSignature && (
                    /* eslint-disable-next-line @next/next/no-img-element */
                    <img
                      src={proj.accreditationSignature}
                      alt="Assinatura"
                      className="h-5 rounded bg-white px-1"
                    />
                  )}
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending || proj.accreditationUnlocked}
                    onClick={() =>
                      handleUnlockProject(proj.id, proj.shortCode)
                    }
                    className="rounded-xl text-[11px]"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    {proj.accreditationUnlocked
                      ? "Liberado no App"
                      : "Liberar no App"}
                  </Button>
                  <Button
                    type="button"
                    variant="orange"
                    size="sm"
                    onClick={() => {
                      setSigningProject(proj);
                      setSelectedExhibitorId(proj.expositores[0]?.id || "");
                    }}
                    className="rounded-xl text-[11px]"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    Assinar Aqui
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* =========================================================
          ABA 2: CHECK-IN DE AVALIADORES
         ========================================================= */}
      {tab === "evaluators" && (
        <div className="space-y-2.5">
          {evaluators.map((ev) => (
            <div
              key={ev.id}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {ev.name}
                  </h3>
                  <span className="font-mono text-[11px] text-slate-500">
                    {ev.username}
                  </span>
                </div>
                {ev.isAccredited ? (
                  <Badge variant="success">Credenciado</Badge>
                ) : (
                  <Badge variant="warning">Pendente</Badge>
                )}
              </div>

              {!ev.isAccredited && (
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={isPending || ev.accreditationUnlocked}
                    onClick={() => handleUnlockEvaluator(ev.id, ev.name)}
                    className="rounded-xl text-[11px]"
                  >
                    <Unlock className="h-3.5 w-3.5" />
                    {ev.accreditationUnlocked
                      ? "Liberado no App"
                      : "Liberar no App"}
                  </Button>
                  <Button
                    type="button"
                    variant="navy"
                    size="sm"
                    onClick={() => setSigningEvaluator(ev)}
                    className="rounded-xl text-[11px]"
                  >
                    <PenTool className="h-3.5 w-3.5" />
                    Assinar Aqui
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* =========================================================
          ABA 3: BALCÃO DE TROCA DE BRINDES (DÉBITO P&B)
         ========================================================= */}
      {tab === "rewards" && (
        <div className="space-y-3">
          {/* Busca ou Leitura QR da Carteira do Visitante */}
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
            <label className="mb-1.5 block text-xs font-bold">
              Carteira do Visitante (Código ou QR)
            </label>
            <div className="flex gap-2">
              <Input
                value={visitorQuery}
                onChange={(e) => setVisitorQuery(e.target.value)}
                placeholder="Ex: V-3590"
                className="h-10 font-mono text-xs"
              />
              <Button
                type="button"
                variant="orange"
                size="sm"
                onClick={() => setScannerOpen(true)}
                className="shrink-0 rounded-xl px-3"
              >
                <QrCode className="h-4 w-4" />
                Ler QR
              </Button>
            </div>

            {selectedVisitor ? (
              <div className="mt-3 rounded-xl border border-[#D81B60]/25 bg-[#D81B60]/5 p-3">
                <div className="flex items-center justify-between">
                  <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                    {selectedVisitor.name}
                  </span>
                  <span className="font-mono text-xs font-bold text-[#D81B60]">
                    {selectedVisitor.visitorShortCode}
                  </span>
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 text-center">
                  <div className="rounded-lg bg-white p-1.5 dark:bg-slate-900">
                    <div className="font-mono text-base font-extrabold text-[#D81B60]">
                      {selectedVisitor.activeStamps}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      Selos Coloridos (Saldo)
                    </div>
                  </div>
                  <div className="rounded-lg bg-white p-1.5 dark:bg-slate-900">
                    <div className="font-mono text-base font-extrabold text-slate-600 dark:text-slate-300">
                      {selectedVisitor.spentStamps}
                    </div>
                    <div className="text-[10px] font-semibold text-slate-500">
                      Já Trocados (P&B)
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="mt-2 text-xs text-rose-600">
                Visitante não encontrado. Tente V-3590.
              </p>
            )}
          </div>

          {/* Lista de Brindes para Debitar Selos */}
          {selectedVisitor && (
            <div className="space-y-2">
              {rewards.map((rw) => {
                const canRedeem =
                  selectedVisitor.activeStamps >= rw.stampCost &&
                  rw.stockQuantity > 0;
                return (
                  <div
                    key={rw.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-[#F57C00]/15 px-2 py-0.5 font-mono text-[10px] font-bold text-[#F57C00]">
                          -{rw.stampCost} selos
                        </span>
                        <span className="text-[10px] text-slate-400">
                          Estoque: {rw.stockQuantity}
                        </span>
                      </div>
                      <h4 className="mt-1 font-display text-xs font-bold text-slate-900 dark:text-white">
                        {rw.name}
                      </h4>
                    </div>

                    <Button
                      type="button"
                      variant={canRedeem ? "orange" : "outline"}
                      size="sm"
                      disabled={!canRedeem || isPending}
                      onClick={() => handleRedeemReward(rw.id)}
                      className="shrink-0 rounded-xl text-xs"
                    >
                      {canRedeem ? "Entregar Brinde" : "Saldo Insuf."}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* =========================================================
          ABA 4: RESUMO OPERACIONAL DA RECEPÇÃO
         ========================================================= */}
      {tab === "resumo" && (
        <div className="space-y-2.5">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F172A]">
            <h3 className="font-display text-sm font-bold">
              Metas de Check-in da 35ª META
            </h3>
            <p className="mt-1 text-xs text-slate-500">
              Apenas projetos e avaliadores com check-in concluído podem emitir
              e assinar fichas de avaliação.
            </p>
            <div className="mt-3 space-y-2 text-xs">
              <div className="flex justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                <span>Estandes Credenciados</span>
                <strong className="font-mono">
                  {projects.filter((p) => p.isAccredited).length} de{" "}
                  {projects.length}
                </strong>
              </div>
              <div className="flex justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-slate-900">
                <span>Avaliadores Credenciados</span>
                <strong className="font-mono">
                  {evaluators.filter((e) => e.isAccredited).length} de{" "}
                  {evaluators.length}
                </strong>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Sheet de Assinatura de Projeto no Aparelho do Colaborador */}
      <Dialog
        open={Boolean(signingProject)}
        onOpenChange={(v) => !v && setSigningProject(null)}
      >
        <DialogContent>
          {signingProject && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Credenciar Estande #{signingProject.shortCode}
                </DialogTitle>
                <DialogDescription>
                  Selecione o integrante presente e colete a assinatura de
                  retirada do kit:
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Expositor Responsável
                  </label>
                  <select
                    value={selectedExhibitorId}
                    onChange={(e) => setSelectedExhibitorId(e.target.value)}
                    className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs font-medium dark:border-slate-800 dark:bg-slate-900"
                  >
                    {signingProject.expositores.map((ex) => (
                      <option key={ex.id} value={ex.id}>
                        {ex.name} ({ex.username})
                      </option>
                    ))}
                  </select>
                </div>

                <SignatureCanvasBox
                  confirmLabel="Confirmar Entrega do Kit"
                  onSaveSignature={handleSignProjectOnDevice}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Bottom Sheet de Assinatura de Avaliador no Aparelho do Colaborador */}
      <Dialog
        open={Boolean(signingEvaluator)}
        onOpenChange={(v) => !v && setSigningEvaluator(null)}
      >
        <DialogContent>
          {signingEvaluator && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Check-in: {signingEvaluator.name}
                </DialogTitle>
                <DialogDescription>
                  Confirme a presença do(a) professor(a) avaliador(a) na banca:
                </DialogDescription>
              </DialogHeader>

              <SignatureCanvasBox
                initialSignature={signingEvaluator.savedSignatureData}
                confirmLabel="Confirmar Credenciamento"
                onSaveSignature={handleSignEvaluatorOnDevice}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Scanner Universal da Recepção / Brindes */}
      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        title="Scanner Recepção & Brindes"
        description="Leia o QR da carteira do Visitante (V-3590) ou o código do Estande (#1042)."
        placeholder="Ex: V-3590 ou 1042"
        presets={[
          {
            label: "Visitante Beatriz (V-3590)",
            sublabel: "Carteira com 3 selos coloridos",
            code: "V-3590",
          },
          {
            label: "Estande Pendente (#1042)",
            sublabel: "AgroDrone • Aguardando kit",
            code: "1042",
          },
        ]}
        onCodeSubmit={handleUniversalScan}
      />

      {/* Bottom Bar Nativa do Colaborador */}
      <MobileBottomNav
        tabs={[
          {
            id: "projects",
            label: "Estandes",
            icon: Presentation,
            badge: pendingProjectsCount,
          },
          {
            id: "evaluators",
            label: "Banca",
            icon: ClipboardCheck,
            badge: pendingEvaluatorsCount,
          },
          {
            id: "rewards",
            label: "Brindes",
            icon: Gift,
          },
          {
            id: "resumo",
            label: "Metas",
            icon: CheckCircle2,
          },
        ]}
        activeTab={tab}
        onSelectTab={(id) => setTab(id as ColaboradorTab)}
        centerAction={{
          label: "Ler QR",
          icon: ScanLine,
          colorHex: "#F57C00",
          onClick: () => setScannerOpen(true),
        }}
        accentColorHex="#F57C00"
      />
    </div>
  );
}
