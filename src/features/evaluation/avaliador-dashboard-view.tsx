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
} from "lucide-react";
import { toast } from "sonner";
import type { EvaluationRecord, ProjectRecord } from "@/db/local-store";
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
import { SignatureCanvasBox } from "@/components/shared/signature-canvas-box";
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

const SCORE_CRITERIA = [
  {
    key: "scoreLogbook" as const,
    title: "1. Diário de Bordo / Caderno de Campo (Obrigatório META)",
    subtitle:
      "Registros cronológicos das etapas, experimentos, datas e autenticidade da equipe.",
    highlight: true,
  },
  {
    key: "scoreRelevance" as const,
    title: "2. Relevância Científica, Tecnológica e Originalidade",
    subtitle: "Clareza do problema, inovação e impacto social ou técnico.",
    highlight: false,
  },
  {
    key: "scoreMethodology" as const,
    title: "3. Metodologia Científica e Rigor Técnico",
    subtitle: "Fundamentação teórica, método experimental e análise de resultados.",
    highlight: false,
  },
  {
    key: "scorePresentation" as const,
    title: "4. Domínio do Conteúdo e Clareza na Apresentação Oral",
    subtitle: "Postura, capacidade de síntese e segurança ao responder arguições.",
    highlight: false,
  },
  {
    key: "scoreStand" as const,
    title: "5. Organização Visual do Estande, Banner e Protótipo",
    subtitle: "Qualidade gráfica do pôster, demonstração prática e recursos visuais.",
    highlight: false,
  },
];

export function AvaliadorDashboardView({
  evaluator,
  projects,
}: AvaliadorDashboardViewProps) {
  const [isPending, startTransition] = useTransition();
  const [scannerOpen, setScannerOpen] = useState(false);

  // Projeto atualmente aberto na Ficha Oficial de Avaliação
  const [activeProject, setActiveProject] =
    useState<AssignedEvalProject | null>(null);

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
        "Você precisa realizar seu Credenciamento na Recepção antes de avaliar projetos!"
      );
      return;
    }
    if (!proj.isAccredited) {
      toast.error(
        `O projeto #${proj.shortCode} (${proj.title}) ainda não realizou o Credenciamento na Recepção!`
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
        toast.error(res.error || "Erro ao salvar avaliação.");
        return;
      }

      toast.success(
        `Avaliação do projeto #${activeProject.shortCode} concluída com nota ${res.totalScore}/25!`
      );
      setActiveProject(null);
    });
  };

  const handleSelfAccreditEvaluator = (signatureData: string) => {
    startTransition(async () => {
      const res = await signEvaluatorAccreditationAction({
        evaluatorId: evaluator.id,
        signatureData,
      });
      if (res.success) {
        toast.success(
          "Credenciamento confirmado! Sua carteira de avaliações foi desbloqueada."
        );
      } else {
        toast.error(res.error);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Avaliador (Azul Marinho META #1E3A8A) */}
      <div className="rounded-2xl border border-[#1E3A8A]/30 bg-white p-6 shadow-xs dark:border-[#818CF8]/30 dark:bg-[#0F172A]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-[#1E3A8A]/10 px-3 py-1 text-xs font-bold text-[#1E3A8A] dark:bg-[#818CF8]/20 dark:text-[#818CF8]">
                <ClipboardCheck className="h-3.5 w-3.5" />
                Banca Avaliadora Oficial • 35ª META
              </span>
              {evaluator.isAccredited ? (
                <Badge variant="success">
                  <CheckCircle2 className="h-3.5 w-3.5" /> Avaliador Credenciado
                </Badge>
              ) : (
                <Badge variant="danger">
                  <Lock className="h-3.5 w-3.5" /> Credenciamento Pendente
                </Badge>
              )}
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Carteira de Avaliações — {evaluator.name}
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Escaneie o QR Code na folha do estande ou digite o código numérico curto de 4 dígitos para abrir a Ficha Padrão META.
            </p>
          </div>

          <Button
            type="button"
            size="field"
            onClick={() => setScannerOpen(true)}
            className="bg-[#1E3A8A] hover:bg-[#1E3A8A]/90 text-white"
          >
            <QrCode className="h-4 w-4" />
            Ler QR Code / Digitar Código do Estande
          </Button>
        </div>

        {/* Barra de Progresso da Carteira */}
        <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="font-semibold text-slate-700 dark:text-slate-300">
            Progresso da sua Banca:
          </span>
          <span className="font-mono text-sm font-bold text-[#1565C0] dark:text-[#60A5FA]">
            {completedProjects.length} de {projects.length} projetos avaliados
          </span>
        </div>
      </div>

      {/* Caso o Avaliador ainda não esteja credenciado */}
      {!evaluator.isAccredited && (
        <Card className="border-amber-500/40 bg-amber-50/70 dark:border-amber-700 dark:bg-amber-950/30">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base text-amber-900 dark:text-amber-200">
              <AlertTriangle className="h-5 w-5" />
              {evaluator.accreditationUnlocked
                ? "Assinatura de Presença Liberada pela Recepção!"
                : "Credenciamento na Recepção Necessário"}
            </CardTitle>
            <CardDescription className="text-amber-800 dark:text-amber-300">
              {evaluator.accreditationUnlocked
                ? "Confirme sua assinatura abaixo com 1 clique para desbloquear todas as avaliações da sua carteira:"
                : "Dirija-se à Recepção (Colaborador) para confirmar sua presença antes de avaliar os trabalhos."}
            </CardDescription>
          </CardHeader>
          {evaluator.accreditationUnlocked && (
            <CardContent>
              <SignatureCanvasBox
                initialSignature={evaluator.savedSignatureData}
                confirmLabel="Confirmar Minha Presença em 1 Clique"
                onSaveSignature={handleSelfAccreditEvaluator}
              />
            </CardContent>
          )}
        </Card>
      )}

      {/* Lista 1: Projetos Pendentes de Avaliação */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-[#F57C00]" />
          Projetos Pendentes na Sua Carteira ({pendingProjects.length})
        </h2>

        <div className="grid gap-4 md:grid-cols-2">
          {pendingProjects.map((proj) => {
            const canEvaluate = evaluator.isAccredited && proj.isAccredited;
            return (
              <Card
                key={proj.id}
                className="flex flex-col justify-between border-slate-200 dark:border-slate-800"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white dark:bg-slate-800">
                      #{proj.shortCode}
                    </span>
                    {proj.isAccredited ? (
                      <Badge variant="success">
                        <CheckCircle2 className="h-3 w-3" /> Estande Credenciado
                      </Badge>
                    ) : (
                      <Badge variant="danger">
                        <Lock className="h-3 w-3" /> Equipe Não Credenciada
                      </Badge>
                    )}
                  </div>
                  <CardTitle className="mt-2 text-base">{proj.title}</CardTitle>
                  <CardDescription className="flex items-center gap-1.5 pt-1">
                    <MapPin className="h-3.5 w-3.5 text-[#D81B60]" />
                    {proj.standLocation} ({proj.shift})
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-3 text-xs">
                  <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                    <Users className="h-3.5 w-3.5 text-[#1565C0]" />
                    <span>Expositores: {proj.expositores.join(", ")}</span>
                  </div>

                  {canEvaluate ? (
                    <Button
                      type="button"
                      size="field"
                      onClick={() => openEvaluationModalByProject(proj)}
                      className="w-full"
                    >
                      <ClipboardCheck className="h-4 w-4" />
                      Iniciar Ficha de Avaliação (#{proj.shortCode})
                    </Button>
                  ) : (
                    <div className="rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-medium text-rose-700 dark:text-rose-300">
                      {!evaluator.isAccredited
                        ? "🔒 Bloqueado: Faça seu credenciamento na recepção primeiro."
                        : "🔒 Bloqueado: A equipe deste projeto (#7540) ainda não realizou o credenciamento na recepção."}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      {/* Lista 2: Projetos Já Avaliados por Mim */}
      {completedProjects.length > 0 && (
        <section className="space-y-3 pt-2">
          <h2 className="font-display text-lg font-bold flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
            <CheckCircle2 className="h-5 w-5" />
            Projetos Já Avaliados por Você ({completedProjects.length})
          </h2>

          <div className="grid gap-4 md:grid-cols-2">
            {completedProjects.map((proj) => (
              <Card
                key={proj.id}
                className="border-emerald-500/30 bg-emerald-50/20 dark:border-emerald-800/40 dark:bg-emerald-950/10"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold">
                      #{proj.shortCode}
                    </span>
                    <Badge variant="success">
                      Nota Final: {proj.myEvaluation?.totalScore} / 25 pts
                    </Badge>
                  </div>
                  <CardTitle className="mt-1 text-base">{proj.title}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                  <div className="flex flex-wrap gap-2 font-mono text-[11px]">
                    <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                      Diário de Bordo: {proj.myEvaluation?.scoreLogbook}/5
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                      Relevância: {proj.myEvaluation?.scoreRelevance}/5
                    </span>
                    <span className="rounded bg-slate-100 px-2 py-0.5 dark:bg-slate-800">
                      Metodologia: {proj.myEvaluation?.scoreMethodology}/5
                    </span>
                  </div>
                  {proj.myEvaluation?.feedbackNotes && (
                    <p className="italic text-slate-700 dark:text-slate-300">
                      &ldquo;{proj.myEvaluation.feedbackNotes}&rdquo;
                    </p>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Modal: Ficha Oficial de Avaliação META (Botões Rápidos de Toque 0 a 5 + Assinatura 1-Click) */}
      <Dialog
        open={Boolean(activeProject)}
        onOpenChange={(o) => !o && setActiveProject(null)}
      >
        <DialogContent className="sm:max-w-xl">
          {activeProject && (
            <>
              <DialogHeader>
                <div className="flex items-center justify-between">
                  <Badge variant="default">
                    Estande #{activeProject.shortCode}
                  </Badge>
                  <span className="font-mono text-lg font-extrabold text-[#1565C0] dark:text-[#60A5FA]">
                    Soma: {totalCurrentScore} / 25 pts
                  </span>
                </div>
                <DialogTitle className="mt-1 text-lg">
                  {activeProject.title}
                </DialogTitle>
                <DialogDescription>
                  Toque nas pílulas numéricas de 0 a 5 para pontuar cada critério oficial da 35ª META e finalize com sua assinatura em 1 clique.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4">
                {SCORE_CRITERIA.map((crit) => {
                  const currentVal = scores[crit.key];
                  return (
                    <div
                      key={crit.key}
                      className={`rounded-xl border p-3.5 ${
                        crit.highlight
                          ? "border-[#1565C0]/40 bg-[#1565C0]/5 dark:border-[#3B82F6]/40 dark:bg-[#1E3A8A]/20"
                          : "border-slate-200 bg-slate-50/60 dark:border-slate-800 dark:bg-slate-900/50"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="flex items-center gap-1.5 font-display text-xs font-bold text-slate-900 dark:text-white">
                          {crit.highlight && (
                            <BookOpen className="h-4 w-4 text-[#1565C0] dark:text-[#60A5FA]" />
                          )}
                          {crit.title}
                        </span>
                        <span className="font-mono text-xs font-bold text-[#1565C0] dark:text-[#60A5FA]">
                          {currentVal} / 5
                        </span>
                      </div>
                      <p className="mt-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                        {crit.subtitle}
                      </p>

                      {/* Pílulas de Toque Rápido 0 a 5 (Altura >= 48px) */}
                      <div className="mt-2.5 grid grid-cols-6 gap-1.5">
                        {[0, 1, 2, 3, 4, 5].map((num) => {
                          const selected = currentVal === num;
                          return (
                            <button
                              key={num}
                              type="button"
                              onClick={() =>
                                setScores((prev) => ({
                                  ...prev,
                                  [crit.key]: num,
                                }))
                              }
                              className={`flex min-h-[48px] items-center justify-center rounded-xl font-mono text-base font-extrabold transition-all active:scale-95 ${
                                selected
                                  ? "bg-[#1565C0] text-white shadow-sm ring-2 ring-[#1565C0]/40"
                                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
                              }`}
                            >
                              {num}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}

                <div>
                  <label className="mb-1 block text-xs font-semibold">
                    Parecer / Observações da Avaliação (Opcional)
                  </label>
                  <textarea
                    rows={2}
                    value={feedbackNotes}
                    onChange={(e) => setFeedbackNotes(e.target.value)}
                    placeholder="Ex: Excelente protótipo funcional e diário de bordo muito bem documentado."
                    className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs dark:border-slate-800 dark:bg-slate-950"
                  />
                </div>

                {/* Fechamento com Assinatura Salva em 1 Clique (ou redesenhar) */}
                <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-bold">
                    <PenTool className="h-3.5 w-3.5 text-[#1565C0]" />
                    Assinatura Oficial do Avaliador:
                  </div>
                  <SignatureCanvasBox
                    initialSignature={evaluator.savedSignatureData}
                    confirmLabel={
                      isPending
                        ? "Registrando Avaliação..."
                        : `Assinar em 1 Clique e Concluir (${totalCurrentScore}/25 pts)`
                    }
                    onSaveSignature={handleSubmitEvaluation}
                  />
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Scanner QR Code ou Código Numérico do Estande */}
      <QrScannerSheet
        open={scannerOpen}
        onOpenChange={setScannerOpen}
        title="Identificar Estande para Avaliação"
        description="Escaneie o QR Code na folha do estande ou digite os 4 dígitos abaixo:"
        placeholder="Ex: 4821"
        onCodeSubmit={handleScanCode}
        presets={pendingProjects
          .filter((p) => p.isAccredited)
          .map((p) => ({
            label: p.title,
            sublabel: p.standLocation,
            code: p.shortCode,
          }))}
      />
    </div>
  );
}
