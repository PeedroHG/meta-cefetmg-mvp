"use client";

import React, { useState, useTransition } from "react";
import {
  ScanLine,
  CheckCircle2,
  Unlock,
  PenTool,
  Gift,
  Search,
  Users,
  ClipboardCheck,
  QrCode,
  Clock,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectRecord, RewardRecord } from "@/db/local-store";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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

export function ColaboradorDashboardView({
  projects,
  evaluators,
  visitors,
  rewards,
}: ColaboradorDashboardViewProps) {
  const [tab, setTab] = useState<"projects" | "evaluators" | "rewards">(
    "projects"
  );
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal de Coleta de Assinatura Direto no Aparelho do Colaborador (Projeto)
  const [signingProject, setSigningProject] =
    useState<ColaboradorProject | null>(null);
  const [selectedExhibitorId, setSelectedExhibitorId] = useState<string>("");

  // Modal de Coleta de Assinatura Direto no Aparelho do Colaborador (Avaliador)
  const [signingEvaluator, setSigningEvaluator] =
    useState<ColaboradorEvaluator | null>(null);

  // Balcão de Brindes
  const [visitorQuery, setVisitorQuery] = useState("V-3590");
  const [scannerOpen, setScannerOpen] = useState(false);

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.shortCode.includes(search) ||
      p.expositores.some((e) =>
        e.name.toLowerCase().includes(search.toLowerCase())
      )
  );

  const selectedVisitor = visitors.find(
    (v) =>
      v.visitorShortCode.toLowerCase() === visitorQuery.trim().toLowerCase() ||
      v.username.toLowerCase() === visitorQuery.trim().toLowerCase() ||
      v.name.toLowerCase().includes(visitorQuery.trim().toLowerCase())
  );

  const handleUnlockProject = (projectId: string, shortCode: string) => {
    startTransition(async () => {
      const res = await unlockProjectAccreditationAction(projectId);
      if (res.success) {
        toast.success(
          `Assinatura liberada no celular da equipe do projeto #${shortCode}!`
        );
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
          `Projeto #${signingProject.shortCode} CREDENCIADO com sucesso! Entregue o banner e os crachás.`
        );
        setSigningProject(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleUnlockEvaluator = (evaluator: ColaboradorEvaluator) => {
    startTransition(async () => {
      const res = await unlockEvaluatorAccreditationAction(evaluator.id);
      if (res.success) {
        toast.success(
          `Assinatura de presença liberada no celular de ${evaluator.name}!`
        );
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
        toast.success(`Avaliador ${signingEvaluator.name} CREDENCIADO!`);
        setSigningEvaluator(null);
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleRedeemReward = (reward: RewardRecord) => {
    if (!selectedVisitor) {
      toast.error("Identifique um visitante primeiro.");
      return;
    }
    startTransition(async () => {
      const res = await redeemRewardWithStampsAction({
        visitorIdentifier: selectedVisitor.visitorShortCode,
        rewardId: reward.id,
      });
      if (!res.success) {
        toast.error(res.error || "Não foi possível debitar os selos.");
        return;
      }
      toast.success(
        `Brinde "${res.rewardName}" entregue! ${res.stampsDebited} selos foram convertidos para Preto e Branco (P&B) na carteira de ${res.visitorName}.`
      );
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Operacional Colaborador (Laranja META #F57C00) */}
      <div className="rounded-2xl border border-[#F57C00]/30 bg-white p-6 shadow-xs dark:border-[#FB923C]/30 dark:bg-[#0F172A]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#F57C00]/10 px-3 py-1 text-xs font-bold text-[#D97706] dark:bg-[#FB923C]/20 dark:text-[#FB923C]">
              <ScanLine className="h-3.5 w-3.5" />
              Operação de Campo • Recepção & Balcão de Brindes
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Central do Colaborador — 35ª META
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Realize o credenciamento com assinatura dupla (no celular do participante ou neste aparelho), monitore bancas e debite selos na troca de brindes.
            </p>
          </div>

          <Button
            type="button"
            variant="orange"
            size="field"
            onClick={() => setTab("rewards")}
          >
            <Gift className="h-4 w-4" />
            Abrir Balcão de Troca de Brindes
          </Button>
        </div>
      </div>

      {/* Abas Operacionais */}
      <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
        <button
          type="button"
          onClick={() => setTab("projects")}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${
            tab === "projects"
              ? "border-[#F57C00] bg-[#F57C00] text-white shadow-xs"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          }`}
        >
          <Users className="h-4 w-4" />
          1. Credenciamento de Projetos & Radar ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("evaluators")}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${
            tab === "evaluators"
              ? "border-[#F57C00] bg-[#F57C00] text-white shadow-xs"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          }`}
        >
          <ClipboardCheck className="h-4 w-4" />
          2. Credenciamento de Avaliadores ({evaluators.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("rewards")}
          className={`flex min-h-[48px] items-center justify-center gap-2 rounded-xl border px-4 py-3 text-xs font-bold transition ${
            tab === "rewards"
              ? "border-[#D81B60] bg-[#D81B60] text-white shadow-xs"
              : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          }`}
        >
          <Gift className="h-4 w-4" />
          3. Balcão de Brindes (Débito de Selos P&B)
        </button>
      </div>

      {/* ABA 1: Credenciamento de Projetos + Radar de Avaliações */}
      {tab === "projects" && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Pesquisar projeto por nome, código #7540 ou nome do aluno expositor..."
              className="pl-10"
            />
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredProjects.map((proj) => {
              const evalDone = proj.avaliadores.filter(
                (a) => a.hasEvaluated
              ).length;
              return (
                <Card key={proj.id} className="flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white dark:bg-slate-800">
                        #{proj.shortCode}
                      </span>
                      {proj.isAccredited ? (
                        <Badge variant="success">
                          <CheckCircle2 className="h-3.5 w-3.5" /> CREDENCIADO
                          (Kit/Banner Entregue)
                        </Badge>
                      ) : proj.accreditationUnlocked ? (
                        <Badge variant="warning">
                          <Unlock className="h-3.5 w-3.5" /> Assinatura Liberada
                          p/ Equipe
                        </Badge>
                      ) : (
                        <Badge variant="danger">
                          <Clock className="h-3.5 w-3.5" /> Não Credenciado
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="mt-2 text-base">
                      {proj.title}
                    </CardTitle>
                    <CardDescription>
                      {proj.standLocation} ({proj.shift})
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    {/* Integrantes e Status de Avaliadores (Sem revelar notas) */}
                    <div className="grid gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50 sm:grid-cols-2">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Integrantes Expositores:
                        </span>
                        <ul className="mt-1 space-y-1 text-[11px]">
                          {proj.expositores.map((e) => (
                            <li key={e.id} className="truncate">
                              • {e.name}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Progresso de Avaliações ({evalDone}/
                          {proj.avaliadores.length}):
                        </span>
                        <ul className="mt-1 space-y-1 text-[11px]">
                          {proj.avaliadores.map((a) => (
                            <li
                              key={a.id}
                              className="flex items-center justify-between gap-1"
                            >
                              <span className="truncate">{a.name}</span>
                              {a.hasEvaluated ? (
                                <span className="text-emerald-600 font-bold dark:text-emerald-400">
                                  ✓ Avaliou
                                </span>
                              ) : (
                                <span className="text-amber-600 dark:text-amber-400">
                                  Pendente
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* Ações de Credenciamento com Modo Duplo de Assinatura */}
                    {proj.isAccredited ? (
                      <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50/60 px-3.5 py-2.5 dark:border-emerald-800/40 dark:bg-emerald-950/30">
                        <div>
                          <div className="font-bold text-emerald-900 dark:text-emerald-200">
                            Kit e Banner Retirados por: {proj.signedByUser}
                          </div>
                          <div className="text-[11px] text-emerald-700 dark:text-emerald-400">
                            Assinatura digital arquivada com sucesso.
                          </div>
                        </div>
                        {proj.accreditationSignature && (
                          /* eslint-disable-next-line @next/next/no-img-element */
                          <img
                            src={proj.accreditationSignature}
                            alt="Assinatura"
                            className="h-9 rounded bg-[#F8FAFC] px-2 py-0.5 border border-slate-300"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="field"
                          disabled={isPending || proj.accreditationUnlocked}
                          onClick={() =>
                            handleUnlockProject(proj.id, proj.shortCode)
                          }
                        >
                          <Unlock className="h-4 w-4 text-[#F57C00]" />
                          {proj.accreditationUnlocked
                            ? "Liberado no Celular do Aluno"
                            : "Liberar no Celular do Aluno"}
                        </Button>
                        <Button
                          type="button"
                          variant="orange"
                          size="field"
                          onClick={() => {
                            setSigningProject(proj);
                            setSelectedExhibitorId(
                              proj.expositores[0]?.id || ""
                            );
                          }}
                        >
                          <PenTool className="h-4 w-4" />
                          Assinar Neste Aparelho
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: Credenciamento de Avaliadores */}
      {tab === "evaluators" && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {evaluators.map((ev) => (
            <Card key={ev.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs text-slate-500">
                    {ev.username}
                  </span>
                  {ev.isAccredited ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> CREDENCIADO
                    </Badge>
                  ) : (
                    <Badge variant="warning">Aguardando Chegada</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-base">{ev.name}</CardTitle>
                <CardDescription>
                  Lembrete: O avaliador só consegue avaliar estandes após estar CREDENCIADO.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-2.5">
                {ev.isAccredited ? (
                  <div className="flex items-center justify-between rounded-xl border border-emerald-500/30 bg-emerald-50/60 p-2.5 text-xs dark:border-emerald-800/40 dark:bg-emerald-950/30">
                    <span className="font-semibold text-emerald-800 dark:text-emerald-200">
                      Presença confirmada na recepção
                    </span>
                    {ev.accreditationSignature && (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={ev.accreditationSignature}
                        alt="Assinatura Avaliador"
                        className="h-8 rounded bg-[#F8FAFC] px-1.5 border border-slate-300"
                      />
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="field"
                      disabled={isPending || ev.accreditationUnlocked}
                      onClick={() => handleUnlockEvaluator(ev)}
                      className="w-full"
                    >
                      <Unlock className="h-4 w-4 text-[#F57C00]" />
                      {ev.accreditationUnlocked
                        ? "Liberado no Celular do Avaliador"
                        : "Liberar no Celular do Avaliador"}
                    </Button>
                    <Button
                      type="button"
                      variant="orange"
                      size="field"
                      onClick={() => setSigningEvaluator(ev)}
                      className="w-full"
                    >
                      <PenTool className="h-4 w-4" />
                      Coletar Assinatura Neste Aparelho
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ABA 3: Balcão de Brindes (Débito de Selos com Efeito P&B) */}
      {tab === "rewards" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <QrCode className="h-5 w-5 text-[#D81B60]" />
                  1. Identificar Carteira do Visitante
                </CardTitle>
                <CardDescription>
                  Escaneie o QR Code da carteira do visitante ou selecione/digite o código curto abaixo:
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <Input
                    value={visitorQuery}
                    onChange={(e) => setVisitorQuery(e.target.value)}
                    placeholder="Ex: V-3590 ou visitante@gmail.com"
                    className="font-mono font-bold"
                  />
                  <Button
                    type="button"
                    variant="magenta"
                    onClick={() => setScannerOpen(true)}
                  >
                    <QrCode className="h-4 w-4" />
                    Escanear
                  </Button>
                </div>

                {/* Lista rápida de visitantes para clique em 1 toque */}
                <div className="space-y-1.5 pt-2">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                    Visitantes na Fila do Balcão:
                  </span>
                  {visitors.map((v) => (
                    <button
                      key={v.id}
                      type="button"
                      onClick={() => setVisitorQuery(v.visitorShortCode)}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition ${
                        selectedVisitor?.id === v.id
                          ? "border-[#D81B60] bg-[#D81B60]/10"
                          : "border-slate-200 hover:bg-slate-50 dark:border-slate-800 dark:hover:bg-slate-900"
                      }`}
                    >
                      <div>
                        <div className="font-bold">{v.name}</div>
                        <div className="font-mono text-[11px] text-slate-500">
                          Carteira: {v.visitorShortCode} • {v.username}
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge variant="magenta">
                          {v.activeStamps} disponíveis
                        </Badge>
                        <div className="mt-0.5 text-[10px] text-slate-500">
                          {v.spentStamps} já gastos (P&B)
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-7">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="h-5 w-5 text-[#F57C00]" />
                  2. Debitar Selos e Entregar Brinde
                </CardTitle>
                <CardDescription>
                  Ao debitar os selos, eles não desaparecem da coleção do visitante: ficam em <strong>Preto e Branco (P&B)</strong> com a faixa <em>&ldquo;TROCA REALIZADA&rdquo;</em>!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {selectedVisitor ? (
                  <div className="mb-4 flex items-center justify-between rounded-xl border border-[#D81B60]/30 bg-[#D81B60]/10 p-3.5">
                    <div>
                      <span className="text-xs font-semibold text-[#D81B60]">
                        Visitante Selecionado:
                      </span>
                      <div className="font-display text-base font-bold">
                        {selectedVisitor.name} ({selectedVisitor.visitorShortCode})
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs text-slate-600 dark:text-slate-300">
                        Saldo Colorido Ativo:
                      </span>
                      <div className="font-mono text-2xl font-extrabold text-[#D81B60]">
                        {selectedVisitor.activeStamps} selo(s)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 p-3 text-xs text-amber-800 dark:text-amber-200">
                    Selecione um visitante ao lado para liberar a entrega de brindes.
                  </div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {rewards.map((reward) => {
                    const canAfford =
                      (selectedVisitor?.activeStamps || 0) >= reward.stampCost;
                    return (
                      <div
                        key={reward.id}
                        className="flex flex-col justify-between rounded-xl border border-slate-200 p-4 dark:border-slate-800"
                      >
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <Badge variant="magenta">
                              Custo: {reward.stampCost} selos
                            </Badge>
                            <span className="font-mono text-[11px] text-slate-500">
                              Estoque: {reward.stockQuantity}
                            </span>
                          </div>
                          <h4 className="mt-2 font-display text-sm font-bold">
                            {reward.name}
                          </h4>
                          <p className="mt-1 text-xs text-slate-500">
                            {reward.description}
                          </p>
                        </div>

                        <Button
                          type="button"
                          variant={canAfford ? "magenta" : "outline"}
                          size="field"
                          disabled={
                            isPending ||
                            !selectedVisitor ||
                            !canAfford ||
                            reward.stockQuantity <= 0
                          }
                          onClick={() => handleRedeemReward(reward)}
                          className="mt-4 w-full"
                        >
                          <Gift className="h-4 w-4" />
                          {canAfford
                            ? `Debitar ${reward.stampCost} Selos & Entregar`
                            : `Faltam ${
                                reward.stampCost -
                                (selectedVisitor?.activeStamps || 0)
                              } selo(s)`}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Modal: Coleta de Assinatura de Projeto no Aparelho do Colaborador */}
      <Dialog
        open={Boolean(signingProject)}
        onOpenChange={(o) => !o && setSigningProject(null)}
      >
        <DialogContent className="sm:max-w-md">
          {signingProject && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Credenciamento de Equipe — #{signingProject.shortCode}
                </DialogTitle>
                <DialogDescription>
                  Qualquer integrante da equipe pode assinar abaixo para confirmar a retirada do banner e crachás do projeto.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Qual integrante está retirando o material?
                  </label>
                  <select
                    value={selectedExhibitorId}
                    onChange={(e) => setSelectedExhibitorId(e.target.value)}
                    className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                  >
                    {signingProject.expositores.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.name} ({e.username})
                      </option>
                    ))}
                  </select>
                </div>

                <SignatureCanvasBox
                  confirmLabel="Confirmar Retirada de Kit & Credenciar Equipe"
                  onSaveSignature={handleSignProjectOnDevice}
                />
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal: Coleta de Assinatura de Avaliador no Aparelho do Colaborador */}
      <Dialog
        open={Boolean(signingEvaluator)}
        onOpenChange={(o) => !o && setSigningEvaluator(null)}
      >
        <DialogContent className="sm:max-w-md">
          {signingEvaluator && (
            <>
              <DialogHeader>
                <DialogTitle>
                  Credenciamento de Avaliador — {signingEvaluator.name}
                </DialogTitle>
                <DialogDescription>
                  Colha a assinatura de presença para liberar a carteira de avaliações deste professor.
                </DialogDescription>
              </DialogHeader>

              <SignatureCanvasBox
                initialSignature={signingEvaluator.savedSignatureData}
                confirmLabel="Confirmar Presença e Credenciar Avaliador"
                onSaveSignature={handleSignEvaluatorOnDevice}
              />
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Scanner QR Code da Carteira do Visitante */}
      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        title="Escanear Carteira do Visitante"
        description="Aponte para o QR Code do Passaporte META do visitante ou escolha abaixo:"
        placeholder="Ex: V-3590"
        onCodeSubmit={(code) => {
          setVisitorQuery(code);
          toast.success(`Carteira ${code} localizada!`);
        }}
        presets={visitors.map((v) => ({
          label: v.name,
          sublabel: `${v.activeStamps} selos coloridos ativos`,
          code: v.visitorShortCode,
        }))}
      />
    </div>
  );
}
