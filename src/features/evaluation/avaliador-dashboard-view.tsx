"use client";

import React, { useState, useTransition } from "react";
import {
  ClipboardCheck,
  QrCode,
  CheckCircle2,
  Clock,
  Lock,
  BookOpen,
  MapPin,
  Users,
  PenTool,
  AlertTriangle,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import type { EvaluationRecord, ProjectRecord } from "@/db/local-store";
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
import { SignatureCanvasBox } from "@/components/shared/signature-canvas-box";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { submitProjectEvaluationAction } from "@/features/evaluation/actions";
import { signEvaluatorAccreditationAction } from "@/features/accreditation/actions";

interface AssignedEvalProject extends ProjectRecord {
  expositores: string[];
  myEvaluation: EvaluationRecord | null;
}

interface AvaliadorDashboardViewProps {
  evaluator: {
    id: string;
    name: string;
    isAccredited: boolean;
    accreditationUnlocked: boolean;
    savedSignatureData: string | null;
  };
  projects: AssignedEvalProject[];
}

type EvaluatorTab = "pendentes" | "concluidos" | "credencial" | "guia";

const SCORE_CRITERIA = [
  {
    key: "scoreLogbook" as const,
    shortTitle: "1. Diário de Bordo / Caderno de Campo",
    subtitle: "Registros cronológicos das etapas e autenticidade (Obrigatório)",
    highlight: true,
  },
  {
    key: "scoreRelevance" as const,
    shortTitle: "2. Relevância Científica e Inovação",
    subtitle: "Clareza do problema, originalidade e impacto técnico/social",
    highlight: false,
  },
  {
    key: "scoreMethodology" as const,
    shortTitle: "3. Metodologia e Rigor Técnico",
    subtitle: "Fundamentação teórica, método experimental e resultados",
    highlight: false,
  },
  {
    key: "scorePresentation" as const,
    shortTitle: "4. Apresentação Oral e Arguição",
    subtitle: "Domínio do conteúdo, síntese e segurança nas respostas",
    highlight: false,
  },
  {
    key: "scoreStand" as const,
    shortTitle: "5. Estande, Banner e Protótipo",
    subtitle: "Organização visual, pôster e demonstração prática",
    highlight: false,
  },
];

export function AvaliadorDashboardView({
  evaluator,
  projects,
}: AvaliadorDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<EvaluatorTab>("pendentes");
  const [isPending, startTransition] = useTransition();
  const [scannerOpen, setScannerOpen] = useState(false);

  // Projeto atualmente aberto na Ficha Oficial de Avaliação + Etapa do Wizard Mobile
  const [activeProject, setActiveProject] =
    useState<AssignedEvalProject | null>(null);
  const [evalStep, setEvalStep] = useState<1 | 2>(1);

  const [scores, setScores] = useState({
    scoreLogbook: 5,
    scoreRelevance: 5,
    scoreMethodology: 4,
    scorePresentation: 5,
    scoreStand: 5,
  });
  const [feedbackNotes, setFeedbackNotes] = useState("");

  const pendingProjects = projects.filter((p) => !p.myEvaluation);
  const completedProjects = projects.filter((p) => Boolean(p.myEvaluation));

  const totalCurrentScore =
    scores.scoreLogbook +
    scores.scoreRelevance +
    scores.scoreMethodology +
    scores.scorePresentation +
    scores.scoreStand;

  const openEvaluationModalByProject = (proj: AssignedEvalProject) => {
    if (!evaluator.isAccredited) {
      toast.error(
        "Realize seu Credenciamento na aba 'Credencial' ou na Recepção antes de avaliar!"
      );
      setActiveTab("credencial");
      return;
    }
    if (!proj.isAccredited) {
      toast.error(
        `O estande #${proj.shortCode} ainda não fez check-in na Recepção!`
      );
      return;
    }
    if (proj.myEvaluation) {
      toast.info("Você já concluiu a avaliação deste projeto.");
      return;
    }
    setScores({
      scoreLogbook: 5,
      scoreRelevance: 5,
      scoreMethodology: 4,
      scorePresentation: 5,
      scoreStand: 5,
    });
    setFeedbackNotes("");
    setEvalStep(1);
    setActiveProject(proj);
  };

  const handleScanCode = (code: string) => {
    const clean = code.replace(/^#/, "").trim();
    const found = projects.find((p) => p.shortCode === clean);
    if (!found) {
      toast.error(
        `Projeto #${clean} não encontrado na sua carteira de avaliação.`
      );
      return;
    }
    openEvaluationModalByProject(found);
  };

  const handleSubmitEvaluation = (signatureData: string) => {
    if (!activeProject) return;
    startTransition(async () => {
      const res = await submitProjectEvaluationAction({
        projectId: activeProject.id,
        ...scores,
        feedbackNotes,
        signatureData,
      });
      if (!res.success) {
        toast.error(res.error || "Erro ao registrar avaliação.");
        return;
      }
      toast.success(
        `Avaliação do projeto #${activeProject.shortCode} assinada (${res.totalScore}/25 pts)!`
      );
      setActiveProject(null);
      setActiveTab("concluidos");
    });
  };

  const handleSignOwnAccreditation = (signatureData: string) => {
    startTransition(async () => {
      const res = await signEvaluatorAccreditationAction({
        evaluatorId: evaluator.id,
        signatureData,
      });
      if (res.success) {
        toast.success(
          "Credenciamento de Avaliador confirmado! Ficha liberada."
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-3.5">
      {/* Header Principal Nativo com Curva Inferior e Cor do Avaliador (#1E3A8A) */}
      <div className="-mx-3.5 -mt-3 rounded-b-[28px] bg-gradient-to-br from-[#1E3A8A] via-[#1D4ED8] to-[#172554] px-4 pt-3.5 pb-4 text-white shadow-md">
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold text-white backdrop-blur-xs">
              <ClipboardCheck className="h-3 w-3" />
              Banca Oficial • 35ª META
            </span>
            <h1 className="mt-1 truncate font-display text-sm font-bold text-white">
              {evaluator.name}
            </h1>
          </div>

          <button
            type="button"
            onClick={() => setActiveTab("credencial")}
            className={`shrink-0 rounded-xl border px-2.5 py-1.5 text-right backdrop-blur-xs transition active:scale-95 ${
              evaluator.isAccredited
                ? "border-emerald-300/40 bg-emerald-500/20 text-emerald-100"
                : "border-amber-300/50 bg-amber-500/25 text-amber-100"
            }`}
          >
            <div className="text-[9px] font-bold uppercase opacity-85">
              Status
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold">
              {evaluator.isAccredited ? (
                <>
                  <CheckCircle2 className="h-3 w-3 text-emerald-300" /> Credenciado
                </>
              ) : (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-300" /> Check-in
                </>
              )}
            </div>
          </button>
        </div>

        {/* Barra de Progresso Compacta da Banca */}
        <div className="mt-3 flex items-center justify-between text-[11px]">
          <span className="font-semibold text-indigo-100">
            Progresso de avaliações:
          </span>
          <span className="font-mono font-bold text-white">
            {completedProjects.length} de {projects.length} concluídas
          </span>
        </div>
        <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-black/25">
          <div
            className="h-full rounded-full bg-emerald-400 transition-all"
            style={{
              width: `${
                projects.length > 0
                  ? (completedProjects.length / projects.length) * 100
                  : 0
              }%`,
            }}
          />
        </div>
      </div>

      {/* Alerta se Credenciamento Pendente */}
      {!evaluator.isAccredited && activeTab !== "credencial" && (
        <button
          type="button"
          onClick={() => setActiveTab("credencial")}
          className="flex w-full items-center justify-between rounded-2xl border border-amber-500/40 bg-amber-50 p-3 text-left text-xs text-amber-950 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-200"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              <strong>Check-in pendente:</strong> Toque aqui para assinar seu
              credenciamento antes de avaliar.
            </span>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0" />
        </button>
      )}

      {/* =========================================================
          ABA 1: PENDENTES DE AVALIAÇÃO
         ========================================================= */}
      {activeTab === "pendentes" && (
        <div className="space-y-2.5">
          <div className="flex items-center justify-between px-0.5">
            <h2 className="font-display text-xs font-bold uppercase tracking-wider text-slate-500">
              Estandes Aguardando Avaliação ({pendingProjects.length})
            </h2>
            <button
              type="button"
              onClick={() => setScannerOpen(true)}
              className="text-[11px] font-bold text-[#1E3A8A] dark:text-[#818CF8]"
            >
              Digitar #Código
            </button>
          </div>

          {pendingProjects.length === 0 ? (
            <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5 text-center">
              <CheckCircle2 className="mx-auto h-8 w-8 text-emerald-600" />
              <p className="mt-2 font-display text-sm font-bold text-emerald-950 dark:text-emerald-200">
                Todas as avaliações concluídas!
              </p>
              <p className="mt-0.5 text-xs text-emerald-800 dark:text-emerald-300">
                Veja os comprovantes assinados na aba &ldquo;Avaliados&rdquo;.
              </p>
            </div>
          ) : (
            pendingProjects.map((proj) => {
              const canEval = evaluator.isAccredited && proj.isAccredited;
              return (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <span className="shrink-0 rounded-lg bg-[#1E3A8A] px-2 py-0.5 font-mono text-xs font-bold text-white">
                        #{proj.shortCode}
                      </span>
                      <span className="truncate font-mono text-[10px] font-semibold text-slate-500">
                        {proj.sigaaCode}
                      </span>
                    </div>
                    {proj.isAccredited ? (
                      <Badge variant="success" className="shrink-0">
                        Estande Pronto
                      </Badge>
                    ) : (
                      <Badge variant="warning" className="shrink-0">
                        Sem Check-in
                      </Badge>
                    )}
                  </div>

                  <h3 className="mt-2 font-display text-sm font-bold leading-snug text-slate-900 dark:text-white">
                    {proj.title}
                  </h3>

                  <div className="mt-2 space-y-1 text-xs text-slate-600 dark:text-slate-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 shrink-0 text-[#D81B60]" />
                      <span className="font-medium">
                        {proj.standLocation} ({proj.shift})
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Users className="h-3.5 w-3.5 shrink-0 text-[#1565C0]" />
                      <span className="truncate">
                        {proj.expositores.join(", ")}
                      </span>
                    </div>
                  </div>

                  <Button
                    type="button"
                    variant={canEval ? "navy" : "outline"}
                    size="sm"
                    onClick={() => openEvaluationModalByProject(proj)}
                    className="mt-3 w-full rounded-xl"
                  >
                    {canEval ? (
                      <>
                        <ClipboardCheck className="h-4 w-4" />
                        Abrir Ficha de Avaliação
                      </>
                    ) : (
                      <>
                        <Lock className="h-3.5 w-3.5" />
                        Aguardando Credenciamento
                      </>
                    )}
                  </Button>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================
          ABA 2: AVALIADOS (HISTÓRICO E NOTAS)
         ========================================================= */}
      {activeTab === "concluidos" && (
        <div className="space-y-2.5">
          <h2 className="px-0.5 font-display text-xs font-bold uppercase tracking-wider text-slate-500">
            Fichas Assinadas ({completedProjects.length})
          </h2>

          {completedProjects.length === 0 ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-5 text-center text-xs text-slate-500 dark:border-slate-800 dark:bg-[#0F172A]">
              Nenhuma ficha enviada ainda.
            </div>
          ) : (
            completedProjects.map((proj) => {
              const ev = proj.myEvaluation!;
              return (
                <div
                  key={proj.id}
                  className="rounded-2xl border border-emerald-500/30 bg-white p-3.5 shadow-2xs dark:border-emerald-900/40 dark:bg-[#0F172A]"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold text-emerald-700 dark:text-emerald-400">
                      #{proj.shortCode} • Avaliado
                    </span>
                    <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 font-mono text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
                      {ev.totalScore} / 25 pts
                    </span>
                  </div>
                  <h3 className="mt-1.5 font-display text-sm font-bold text-slate-900 dark:text-white">
                    {proj.title}
                  </h3>
                  <div className="mt-2 grid grid-cols-5 gap-1 rounded-xl bg-slate-50 p-2 text-center font-mono text-[10px] dark:bg-slate-900">
                    <div>
                      <div className="text-slate-400">Diário</div>
                      <div className="font-bold">{ev.scoreLogbook}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Relev.</div>
                      <div className="font-bold">{ev.scoreRelevance}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Metod.</div>
                      <div className="font-bold">{ev.scoreMethodology}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Apres.</div>
                      <div className="font-bold">{ev.scorePresentation}</div>
                    </div>
                    <div>
                      <div className="text-slate-400">Estande</div>
                      <div className="font-bold">{ev.scoreStand}</div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* =========================================================
          ABA 3: CREDENCIAL & ASSINATURA 1-CLIQUE
         ========================================================= */}
      {activeTab === "credencial" && (
        <div className="space-y-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold">
                Status na Recepção
              </h2>
              {evaluator.isAccredited ? (
                <Badge variant="success">Credenciado</Badge>
              ) : (
                <Badge variant="warning">Pendente</Badge>
              )}
            </div>
            <p className="mt-1 text-xs text-slate-500">
              {evaluator.isAccredited
                ? "Sua presença na banca já foi validada pela Recepção."
                : "Dirija-se à Recepção ou assine abaixo caso o Colaborador tenha liberado no seu celular."}
            </p>

            {!evaluator.isAccredited && evaluator.accreditationUnlocked && (
              <div className="mt-3">
                <SignatureCanvasBox
                  initialSignature={evaluator.savedSignatureData}
                  confirmLabel="Confirmar Check-in de Avaliador"
                  onSaveSignature={handleSignOwnAccreditation}
                />
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="flex items-center gap-2">
              <PenTool className="h-4 w-4 text-[#1E3A8A] dark:text-[#818CF8]" />
              <h3 className="font-display text-sm font-bold">
                Sua Assinatura 1-Clique
              </h3>
            </div>
            <p className="mt-1 text-xs text-slate-500">
              Cadastrada no seu onboarding para validar fichas em pé com 1 toque:
            </p>
            {evaluator.savedSignatureData ? (
              <div className="mt-3 flex flex-col items-center rounded-xl border border-slate-200 bg-[#F8FAFC] p-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={evaluator.savedSignatureData}
                  alt="Assinatura Salva"
                  className="max-h-16 object-contain"
                />
              </div>
            ) : (
              <p className="mt-2 text-xs text-amber-600">
                Nenhuma assinatura pré-salva. Você assinará na tela ao enviar a
                ficha.
              </p>
            )}
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 4: GUIA DOS CRITÉRIOS META
         ========================================================= */}
      {activeTab === "guia" && (
        <div className="space-y-2.5">
          <div className="rounded-2xl border border-[#1E3A8A]/25 bg-[#1E3A8A]/5 p-3.5 text-xs dark:bg-[#1E3A8A]/15">
            <div className="flex items-center gap-1.5 font-display font-bold text-[#1E3A8A] dark:text-[#818CF8]">
              <BookOpen className="h-4 w-4" />
              Regra Oficial de Avaliação (25 pts)
            </div>
            <p className="mt-1 text-slate-600 dark:text-slate-300">
              Cada um dos 5 critérios vale de <strong>1 a 5 pontos</strong>. A
              verificação presencial do <strong>Diário de Bordo</strong> no
              estande é obrigatória.
            </p>
          </div>

          {SCORE_CRITERIA.map((c) => (
            <div
              key={c.key}
              className="rounded-2xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-[#0F172A]"
            >
              <div className="font-display text-xs font-bold text-slate-900 dark:text-white">
                {c.shortTitle}
              </div>
              <p className="mt-0.5 text-[11px] text-slate-500">{c.subtitle}</p>
            </div>
          ))}
        </div>
      )}

      {/* =========================================================
          BOTTOM SHEET: FICHA DE AVALIAÇÃO PASSO A PASSO (2 ETAPAS)
         ========================================================= */}
      <Dialog
        open={Boolean(activeProject)}
        onOpenChange={(v) => !v && setActiveProject(null)}
      >
        <DialogContent>
          {activeProject && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <span className="rounded-md bg-[#1E3A8A] px-2 py-0.5 font-mono text-[11px] font-bold text-white">
                    Estande #{activeProject.shortCode}
                  </span>
                  <span className="rounded-full bg-[#1E3A8A]/10 px-2.5 py-0.5 font-mono text-xs font-extrabold text-[#1E3A8A] dark:bg-[#818CF8]/20 dark:text-[#818CF8]">
                    Nota: {totalCurrentScore} / 25
                  </span>
                </div>
                <DialogTitle className="mt-1 line-clamp-1">
                  {activeProject.title}
                </DialogTitle>
                <DialogDescription>
                  Etapa {evalStep} de 2 —{" "}
                  {evalStep === 1
                    ? "Atribua notas de 1 a 5 em cada critério"
                    : "Parecer opcional e Assinatura Oficial"}
                </DialogDescription>
              </DialogHeader>

              {evalStep === 1 ? (
                <div className="space-y-2.5">
                  {SCORE_CRITERIA.map((criterion) => {
                    const currentVal = scores[criterion.key];
                    return (
                      <div
                        key={criterion.key}
                        className={`rounded-xl border p-2.5 ${
                          criterion.highlight
                            ? "border-[#1E3A8A]/40 bg-[#1E3A8A]/5 dark:border-[#818CF8]/40 dark:bg-[#1E3A8A]/15"
                            : "border-slate-200 bg-slate-50/70 dark:border-slate-800 dark:bg-slate-900/60"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-xs font-bold text-slate-900 dark:text-white">
                            {criterion.shortTitle}
                          </span>
                          <span className="font-mono text-xs font-extrabold text-[#1E3A8A] dark:text-[#818CF8]">
                            {currentVal}/5
                          </span>
                        </div>

                        <div className="mt-2 grid grid-cols-5 gap-1.5">
                          {[1, 2, 3, 4, 5].map((val) => {
                            const selected = currentVal === val;
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() =>
                                  setScores((prev) => ({
                                    ...prev,
                                    [criterion.key]: val,
                                  }))
                                }
                                className={`flex h-9 items-center justify-center rounded-lg border font-mono text-xs font-extrabold transition active:scale-95 ${
                                  selected
                                    ? "border-[#1E3A8A] bg-[#1E3A8A] text-white shadow-2xs dark:border-[#6366F1] dark:bg-[#6366F1]"
                                    : "border-slate-200 bg-white text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                                }`}
                              >
                                {val}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}

                  <Button
                    type="button"
                    variant="navy"
                    size="field"
                    onClick={() => setEvalStep(2)}
                    className="w-full rounded-xl"
                  >
                    Avançar para Assinatura ({totalCurrentScore}/25 pts)
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={() => setEvalStep(1)}
                    className="inline-flex items-center gap-1 text-xs font-bold text-[#1E3A8A] dark:text-[#818CF8]"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    Voltar e ajustar notas ({totalCurrentScore}/25 pts)
                  </button>

                  <div>
                    <label className="mb-1 block text-xs font-bold">
                      Observações para a Comissão (Opcional)
                    </label>
                    <textarea
                      rows={2}
                      value={feedbackNotes}
                      onChange={(e) => setFeedbackNotes(e.target.value)}
                      placeholder="Destaque pontos fortes do protótipo e Diário de Bordo..."
                      className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1E3A8A] dark:border-slate-800 dark:bg-slate-950"
                    />
                  </div>

                  <SignatureCanvasBox
                    initialSignature={evaluator.savedSignatureData}
                    confirmLabel={`Finalizar Ficha (${totalCurrentScore}/25 pts)`}
                    onSaveSignature={handleSubmitEvaluation}
                  />
                </div>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Scanner QR / Código Curto do Estande */}
      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        title="Avaliar Estande por QR / Código"
        description="Escaneie a placa do estande ou digite o código de 4 dígitos."
        placeholder="Ex: 4821, 1042, 3190"
        presets={[
          {
            label: "#4821 NeuroGlove",
            sublabel: "Estande credenciado e pronto",
            code: "4821",
          },
          {
            label: "#3190 BioFiltro",
            sublabel: "Estande credenciado e pronto",
            code: "3190",
          },
        ]}
        onCodeSubmit={handleScanCode}
      />

      {/* Bottom Bar Nativa do Avaliador */}
      <MobileBottomNav
        tabs={[
          {
            id: "pendentes",
            label: "Pendentes",
            icon: Clock,
            badge: pendingProjects.length,
          },
          {
            id: "concluidos",
            label: "Avaliados",
            icon: CheckCircle2,
            badge: completedProjects.length,
          },
          {
            id: "credencial",
            label: "Credencial",
            icon: PenTool,
            badge: evaluator.isAccredited ? undefined : "!",
          },
          {
            id: "guia",
            label: "Critérios",
            icon: BookOpen,
          },
        ]}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as EvaluatorTab)}
        centerAction={{
          label: "Avaliar QR",
          icon: QrCode,
          colorHex: "#1E3A8A",
          onClick: () => setScannerOpen(true),
        }}
        accentColorHex="#1E3A8A"
      />
    </div>
  );
}
