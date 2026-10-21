"use client";

import React, { useState, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  Plus,
  FileSpreadsheet,
  Trophy,
  Users,
  Printer,
  CheckCircle2,
  Clock,
  Heart,
  Sparkles,
  KeyRound,
  Search,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectRecord, RewardRecord, TagRecord } from "@/db/local-store";
import type { UserRole } from "@/db/schema";
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
import {
  createProjectWithAutoProvisionAction,
  importSigaaBatchAction,
  createInternalStaffUserAction,
  type ProvisionedCredential,
} from "@/features/projects/actions";

interface EnrichedMasterProject extends ProjectRecord {
  tags: TagRecord[];
  expositores: {
    id: string;
    name: string;
    username: string;
    tempPasswordHint: string | null;
  }[];
  avaliadores: {
    id: string;
    name: string;
    username: string;
    isAccredited: boolean;
    hasEvaluated: boolean;
    totalScore: number | null;
    scoreLogbook: number | null;
    feedbackNotes: string | null;
  }[];
  avgScore: number | null;
  popularVotes: number;
  totalStampsIssued: number;
}

interface MasterDashboardViewProps {
  projects: EnrichedMasterProject[];
  users: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    mustChangePassword: boolean;
    tempPasswordHint: string | null;
    isAccredited: boolean;
  }[];
  tags: TagRecord[];
  rewards: RewardRecord[];
}

export function MasterDashboardView({
  projects,
  users,
  tags,
  rewards,
}: MasterDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<
    "projects" | "ranking" | "users" | "import"
  >("projects");
  const [search, setSearch] = useState("");
  const [isPending, startTransition] = useTransition();

  // Modal de Novo Projeto + Auto-Provisionamento
  const [createOpen, setCreateOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newSigaa, setNewSigaa] = useState("");
  const [newLocation, setNewLocation] = useState("Pátio Central • Bloco A — Estande 25");
  const [newShift, setNewShift] = useState<"Manhã" | "Tarde" | "Integral">("Manhã");
  const [newSelectedTags, setNewSelectedTags] = useState<string[]>([
    "tag-ia",
    "tag-robotica",
  ]);
  const [newExpositores, setNewExpositores] = useState(
    "Lucas Ferreira; Sofia Mendes"
  );
  const [newAvaliadores, setNewAvaliadores] = useState(
    "Prof. Dr. Marcos Vinícius Ferreira (DECOM); Prof. Dr. Renato Silveira"
  );

  // Credenciais recém auto-provisionadas para mostrar ao Master
  const [lastProvisioned, setLastProvisioned] = useState<
    ProvisionedCredential[] | null
  >(null);

  // Folha de Estande para Impressão (QR Code + Código Curto)
  const [standSheetProject, setStandSheetProject] =
    useState<EnrichedMasterProject | null>(null);

  // Novo Colaborador/Avaliador avulso
  const [staffName, setStaffName] = useState("");
  const [staffUser, setStaffUser] = useState("");
  const [staffRole, setStaffRole] = useState<"COLABORADOR" | "AVALIADOR">(
    "COLABORADOR"
  );

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.shortCode.includes(search) ||
      p.sigaaCode.toLowerCase().includes(search.toLowerCase())
  );

  const accreditedCount = projects.filter((p) => p.isAccredited).length;
  const totalEvalCount = projects.reduce(
    (acc, p) => acc + p.avaliadores.filter((a) => a.hasEvaluated).length,
    0
  );

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createProjectWithAutoProvisionAction({
        title: newTitle,
        sigaaCode: newSigaa,
        standLocation: newLocation,
        shift: newShift,
        tagIds: newSelectedTags,
        expositoresNames: newExpositores
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean),
        avaliadoresNames: newAvaliadores
          .split(";")
          .map((s) => s.trim())
          .filter(Boolean),
      });

      if (!res.success) {
        toast.error(res.error || "Erro ao criar projeto.");
        return;
      }

      toast.success(
        `Projeto #${res.project?.shortCode} criado e contas auto-provisionadas!`
      );
      setNewTitle("");
      setNewSigaa("");
      setCreateOpen(false);
      if (res.provisionedCredentials?.length) {
        setLastProvisioned(res.provisionedCredentials);
      }
    });
  };

  const handleSimulateSigaaImport = () => {
    startTransition(async () => {
      const sampleRows = [
        {
          title:
            " HidroDrone: Monitoramento de Reservatórios com Sensores Espectrais",
          sigaaCode: `META2026-MEC-${Math.floor(100 + Math.random() * 899)}`,
          standLocation: "Pátio Central • Bloco C — Estande 14",
          shift: "Manhã" as const,
          tagsText: "Robótica; Ecologia",
          expositoresText: "Bruna Tavares; Diego Assis",
          avaliadoresText:
            "Prof. Dr. Marcos Vinícius Ferreira (DECOM); Profa. Dra. Patrícia Rocha",
        },
        {
          title:
            "BrailleTouch: Leitor Tátil Dinâmico Baseado em Atuadores Piezoelétricos",
          sigaaCode: `META2026-ELE-${Math.floor(100 + Math.random() * 899)}`,
          standLocation: "Auditório Anexo • Bloco D — Estande 08",
          shift: "Tarde" as const,
          tagsText: "Saúde; Automação",
          expositoresText: "Letícia Campos; Mateus Braga",
          avaliadoresText: "Profa. Dra. Camila Alvarenga (ENG)",
        },
      ];

      const res = await importSigaaBatchAction(sampleRows);
      if (!res.success) {
        toast.error(res.error || "Erro na importação.");
        return;
      }

      toast.success(
        `${res.importedCount} projetos do SIGAA importados com geração automática de usuários e senhas provisórias!`
      );
      if (res.provisionedCredentials?.length) {
        setLastProvisioned(res.provisionedCredentials);
      }
      setActiveTab("projects");
    });
  };

  const handleCreateStaff = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await createInternalStaffUserAction({
        name: staffName,
        username: staffUser,
        role: staffRole,
      });
      if (!res.success) {
        toast.error(res.error || "Erro ao criar conta.");
        return;
      }
      toast.success("Usuário criado com senha provisória!");
      setStaffName("");
      setStaffUser("");
      if (res.credential) {
        setLastProvisioned([res.credential]);
      }
    });
  };

  const rankedByAcademic = [...projects].sort(
    (a, b) => (b.avgScore ?? -1) - (a.avgScore ?? -1)
  );
  const rankedByPopular = [...projects].sort(
    (a, b) => b.popularVotes - a.popularVotes
  );

  return (
    <div className="space-y-6">
      {/* Cabeçalho Organizador Master (Vinho/Plum #6A1B4D) */}
      <div className="rounded-2xl border border-[#6A1B4D]/25 bg-white p-6 shadow-xs dark:border-[#9D2B73]/30 dark:bg-[#0F172A]">
        <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-center">
          <div>
            <div className="inline-flex items-center gap-1.5 rounded-full bg-[#6A1B4D]/10 px-3 py-1 text-xs font-bold text-[#6A1B4D] dark:bg-[#9D2B73]/20 dark:text-[#E879F9]">
              <ShieldCheck className="h-3.5 w-3.5" />
              Governança Global • Organizador Master
            </div>
            <h1 className="mt-2 font-display text-2xl font-bold sm:text-3xl">
              Painel da Comissão Organizadora — 35ª META
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Gerencie projetos, vínculos exclusivos de Expositores e Avaliadores, importe planilhas SIGAA e apure notas oficiais.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <Button
              type="button"
              variant="outline"
              onClick={() => setActiveTab("import")}
            >
              <FileSpreadsheet className="h-4 w-4 text-[#6A1B4D] dark:text-[#E879F9]" />
              Importar Planilha SIGAA
            </Button>
            <Button
              type="button"
              variant="plum"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Novo Projeto (+ Auto-Criar Contas)
            </Button>
          </div>
        </div>

        {/* KPIs em Tempo Real */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Total de Projetos
            </span>
            <div className="mt-1 font-display text-2xl font-bold">
              {projects.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Projetos Credenciados
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {accreditedCount} / {projects.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Avaliações Concluídas
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-[#1565C0] dark:text-[#60A5FA]">
              {totalEvalCount}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/60">
            <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
              Contas Cadastradas
            </span>
            <div className="mt-1 font-display text-2xl font-bold text-[#D81B60] dark:text-[#F472B6]">
              {users.length}
            </div>
          </div>
        </div>
      </div>

      {/* Alerta de Credenciais Provisórias Recém-Geradas */}
      {lastProvisioned && lastProvisioned.length > 0 && (
        <Card className="border-emerald-500/40 bg-emerald-50/60 dark:border-emerald-800 dark:bg-emerald-950/30">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2 text-emerald-900 dark:text-emerald-200">
                <KeyRound className="h-4 w-4" />
                Auto-Provisionamento Concluído ({lastProvisioned.length} vínculos processados)
              </CardTitle>
              <button
                type="button"
                onClick={() => setLastProvisioned(null)}
                className="text-xs font-semibold text-emerald-800 underline dark:text-emerald-300"
              >
                Ocultar
              </button>
            </div>
            <CardDescription className="text-emerald-800/90 dark:text-emerald-300/80">
              Os usuários que ainda não existiam no banco foram criados automaticamente com senha provisória e flag de troca obrigatória no 1º acesso:
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {lastProvisioned.map((cred, idx) => (
                <div
                  key={`${cred.username}-${idx}`}
                  className="rounded-lg border border-emerald-500/30 bg-white p-2.5 text-xs dark:bg-slate-900"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold">{cred.name}</span>
                    <Badge variant={cred.isNew ? "success" : "secondary"}>
                      {cred.isNew ? "Nova Conta" : "Vinculado"}
                    </Badge>
                  </div>
                  <div className="mt-1 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                    Login: <strong>{cred.username}</strong> • Senha:{" "}
                    <strong className="text-[#D81B60]">
                      {cred.tempPassword}
                    </strong>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Abas de Navegação do Master */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <button
          type="button"
          onClick={() => setActiveTab("projects")}
          className={`rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "projects"
              ? "bg-[#6A1B4D] text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          Projetos, Bancas & Folha de Estande ({projects.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("ranking")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "ranking"
              ? "bg-[#6A1B4D] text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Trophy className="h-3.5 w-3.5" />
          Apuração de Notas (Sigilosas) & Voto Popular
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("users")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "users"
              ? "bg-[#6A1B4D] text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <Users className="h-3.5 w-3.5" />
          Usuários & Senhas Provisórias ({users.length})
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("import")}
          className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-bold transition ${
            activeTab === "import"
              ? "bg-[#6A1B4D] text-white"
              : "bg-white text-slate-700 hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-300"
          }`}
        >
          <FileSpreadsheet className="h-3.5 w-3.5" />
          Importação SIGAA & Brindes ({rewards.length})
        </button>
      </div>

      {/* ABA 1: Projetos, Bancas e Folha de Estande */}
      {activeTab === "projects" && (
        <div className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-96">
              <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por título, código #4821 ou SIGAA..."
                className="pl-9"
              />
            </div>
            <span className="text-xs text-slate-500">
              Somente o Organizador Master pode alterar vínculos de expositores, avaliadores e tags.
            </span>
          </div>

          <div className="grid gap-4 lg:grid-cols-2">
            {filteredProjects.map((proj) => {
              const evalDoneCount = proj.avaliadores.filter(
                (a) => a.hasEvaluated
              ).length;
              return (
                <Card key={proj.id} className="flex flex-col justify-between">
                  <CardHeader className="pb-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <span className="rounded-md bg-slate-900 px-2.5 py-1 font-mono text-xs font-bold text-white dark:bg-slate-800">
                          #{proj.shortCode}
                        </span>
                        <span className="font-mono text-xs text-slate-500">
                          {proj.sigaaCode}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        {proj.isAccredited ? (
                          <Badge variant="success">
                            <CheckCircle2 className="h-3 w-3" /> Credenciado
                          </Badge>
                        ) : (
                          <Badge variant="warning">
                            <Clock className="h-3 w-3" /> Pendente Recepção
                          </Badge>
                        )}
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          onClick={() => setStandSheetProject(proj)}
                        >
                          <Printer className="h-3.5 w-3.5" />
                          Folha de Estande
                        </Button>
                      </div>
                    </div>
                    <CardTitle className="mt-2 text-base">
                      {proj.title}
                    </CardTitle>
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <MapPin className="h-3.5 w-3.5 text-[#D81B60]" />
                      <span>
                        {proj.standLocation} • Turno: {proj.shift}
                      </span>
                    </div>
                  </CardHeader>

                  <CardContent className="space-y-3 text-xs">
                    <div className="flex flex-wrap gap-1">
                      {proj.tags.map((t) => (
                        <span
                          key={t.id}
                          className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                        >
                          {t.name}
                        </span>
                      ))}
                    </div>

                    <div className="grid gap-2.5 rounded-xl border border-slate-200 bg-slate-50/70 p-3 dark:border-slate-800 dark:bg-slate-900/50 sm:grid-cols-2">
                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Equipe Expositora ({proj.expositores.length}):
                        </span>
                        <ul className="mt-1 space-y-1">
                          {proj.expositores.map((e) => (
                            <li
                              key={e.id}
                              className="flex items-center justify-between text-[11px]"
                            >
                              <span className="truncate">{e.name}</span>
                              <code className="font-mono text-[10px] text-slate-500">
                                {e.username}
                              </code>
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div>
                        <span className="font-bold text-slate-700 dark:text-slate-300">
                          Banca Avaliadora ({evalDoneCount}/{proj.avaliadores.length}):
                        </span>
                        <ul className="mt-1 space-y-1">
                          {proj.avaliadores.map((a) => (
                            <li
                              key={a.id}
                              className="flex items-center justify-between gap-1 text-[11px]"
                            >
                              <span className="truncate">{a.name}</span>
                              {a.hasEvaluated ? (
                                <span className="shrink-0 rounded bg-emerald-500/15 px-1.5 py-0.5 font-mono text-[10px] font-bold text-emerald-700 dark:text-emerald-300">
                                  Nota: {a.totalScore}/25
                                </span>
                              ) : (
                                <span className="shrink-0 rounded bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-300">
                                  Falta avaliar
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ABA 2: Apuração de Notas Consolidadas & Ranking Voto Popular */}
      {activeTab === "ranking" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#FBC02D]" />
                Apuração Oficial das Bancas (Sigilosa)
              </CardTitle>
              <CardDescription>
                Notas consolidadas (0 a 25 pts, incluindo Diário de Bordo) visíveis exclusivamente para o Organizador Master.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankedByAcademic.map((proj, index) => (
                <div
                  key={proj.id}
                  className="rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#6A1B4D] font-display text-xs font-bold text-white">
                        {index + 1}º
                      </span>
                      <div>
                        <div className="font-display text-sm font-bold">
                          {proj.title}
                        </div>
                        <span className="font-mono text-xs text-slate-500">
                          #{proj.shortCode} • {proj.sigaaCode}
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-[#1565C0] dark:text-[#60A5FA]">
                        {proj.avgScore !== null
                          ? `${proj.avgScore.toFixed(1)} / 25`
                          : "Sem nota"}
                      </div>
                      <span className="text-[11px] text-slate-500">
                        {proj.avaliadores.filter((a) => a.hasEvaluated).length}/
                        {proj.avaliadores.length} avaliações
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-[#D81B60]" />
                Ranking de Voto Popular & Visitação (Passaporte)
              </CardTitle>
              <CardDescription>
                Contabilizado a partir dos selos coletados e marcados como Favorito pelos visitantes.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {rankedByPopular.map((proj, index) => (
                <div
                  key={proj.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3.5 dark:border-slate-800"
                >
                  <div className="flex items-center gap-2.5">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#D81B60] font-display text-xs font-bold text-white">
                      {index + 1}º
                    </span>
                    <div>
                      <div className="font-display text-sm font-bold">
                        {proj.title}
                      </div>
                      <span className="text-xs text-slate-500">
                        {proj.totalStampsIssued} selo(s) emitido(s) no Passaporte
                      </span>
                    </div>
                  </div>
                  <Badge variant="magenta">
                    ❤️ {proj.popularVotes} votos
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ABA 3: Gestão de Usuários e Credenciais Provisórias */}
      {activeTab === "users" && (
        <div className="grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Cadastrar Colaborador ou Avaliador
                </CardTitle>
                <CardDescription>
                  Cria conta interna com senha provisória obrigando troca no 1º acesso.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateStaff} className="space-y-3">
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Nome Completo
                    </label>
                    <Input
                      value={staffName}
                      onChange={(e) => setStaffName(e.target.value)}
                      placeholder="Ex: Fernanda Lima"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Login / E-mail / Matrícula
                    </label>
                    <Input
                      value={staffUser}
                      onChange={(e) => setStaffUser(e.target.value)}
                      placeholder="Ex: fernanda.colab"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-semibold">
                      Perfil de Acesso
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setStaffRole("COLABORADOR")}
                        className={`rounded-lg border py-2 text-xs font-bold ${
                          staffRole === "COLABORADOR"
                            ? "border-[#F57C00] bg-[#F57C00] text-white"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        Colaborador
                      </button>
                      <button
                        type="button"
                        onClick={() => setStaffRole("AVALIADOR")}
                        className={`rounded-lg border py-2 text-xs font-bold ${
                          staffRole === "AVALIADOR"
                            ? "border-[#1E3A8A] bg-[#1E3A8A] text-white"
                            : "border-slate-200 dark:border-slate-800"
                        }`}
                      >
                        Avaliador
                      </button>
                    </div>
                  </div>
                  <Button
                    type="submit"
                    variant="plum"
                    disabled={isPending}
                    className="w-full"
                  >
                    Gerar Conta com Senha Provisória
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="lg:col-span-8">
            <Card>
              <CardHeader>
                <CardTitle className="text-base">
                  Diretório de Contas e Credenciais Provisórias ({users.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="divide-y divide-slate-200 dark:divide-slate-800">
                  {users.map((u) => (
                    <div
                      key={u.id}
                      className="flex flex-wrap items-center justify-between gap-2 py-2.5 text-xs"
                    >
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {u.name}
                        </div>
                        <div className="font-mono text-slate-500">
                          Login: {u.username}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {u.tempPasswordHint && (
                          <span className="rounded bg-amber-500/15 px-2 py-0.5 font-mono text-[11px] font-bold text-amber-700 dark:text-amber-300">
                            Senha provisória: {u.tempPasswordHint}
                          </span>
                        )}
                        <Badge variant="outline">{u.role}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* ABA 4: Importação SIGAA em Lote & Catálogo de Brindes */}
      {activeTab === "import" && (
        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileSpreadsheet className="h-5 w-5 text-[#6A1B4D]" />
                Importação Rápida de Planilha (SIGAA / CSV)
              </CardTitle>
              <CardDescription>
                Importa múltiplos projetos de uma vez, gera os códigos numéricos curtos e auto-provisiona todos os Expositores e Avaliadores com senhas provisórias.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-5 text-center dark:border-slate-700 dark:bg-slate-900">
                <Sparkles className="mx-auto h-8 w-8 text-[#6A1B4D]" />
                <p className="mt-2 text-sm font-bold">
                  Simulador de Lote SIGAA Pronto para Apresentação
                </p>
                <p className="mt-1 text-xs text-slate-500">
                  Clique abaixo para importar instantaneamente 2 novos projetos completos (HidroDrone e BrailleTouch) e ver o auto-provisionamento das equipes e bancas ao vivo:
                </p>
                <Button
                  type="button"
                  variant="plum"
                  size="field"
                  disabled={isPending}
                  onClick={handleSimulateSigaaImport}
                  className="mt-4 w-full"
                >
                  <FileSpreadsheet className="h-4 w-4" />
                  {isPending
                    ? "Processando lote SIGAA..."
                    : "Importar Lote de Planilha SIGAA Agora"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catálogo Oficial de Brindes do Passaporte META</CardTitle>
              <CardDescription>
                Itens disponíveis no balcão de trocas operado pelos Colaboradores.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2.5">
              {rewards.map((rew) => (
                <div
                  key={rew.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 dark:border-slate-800"
                >
                  <div>
                    <div className="font-display text-sm font-bold">
                      {rew.name}
                    </div>
                    <div className="text-xs text-slate-500">
                      {rew.description}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <Badge variant="magenta">{rew.stampCost} selos</Badge>
                    <div className="mt-1 text-[11px] font-mono text-slate-500">
                      Estoque: {rew.stockQuantity}
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Modal: Cadastrar Novo Projeto com Auto-Provisionamento */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Cadastrar Projeto Oficial (Padrão SIGAA)</DialogTitle>
            <DialogDescription>
              Ao informar nomes de Expositores ou Avaliadores que ainda não possuem conta, o sistema cria automaticamente os usuários e senhas provisórias.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateProject} className="space-y-3">
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Título Oficial do Trabalho (Imutável pelo expositor)
              </label>
              <Input
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Ex: Visão Computacional para Inspeção de Soldas"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Código SIGAA
                </label>
                <Input
                  value={newSigaa}
                  onChange={(e) => setNewSigaa(e.target.value)}
                  placeholder="META2026-INF-099"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold">
                  Turno
                </label>
                <select
                  value={newShift}
                  onChange={(e) =>
                    setNewShift(e.target.value as "Manhã" | "Tarde" | "Integral")
                  }
                  className="flex h-11 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm dark:border-slate-800 dark:bg-slate-950"
                >
                  <option value="Manhã">Manhã</option>
                  <option value="Tarde">Tarde</option>
                  <option value="Integral">Integral</option>
                </select>
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Localização do Estande / Bloco
              </label>
              <Input
                value={newLocation}
                onChange={(e) => setNewLocation(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Tags de Assunto (Para Recomendação aos Visitantes)
              </label>
              <div className="flex flex-wrap gap-1.5">
                {tags.map((tag) => {
                  const active = newSelectedTags.includes(tag.id);
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() =>
                        setNewSelectedTags((prev) =>
                          prev.includes(tag.id)
                            ? prev.filter((id) => id !== tag.id)
                            : [...prev, tag.id]
                        )
                      }
                      className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                        active
                          ? "bg-[#6A1B4D] text-white"
                          : "border border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                      }`}
                    >
                      {tag.name}
                    </button>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Equipe de Expositores (separe por ponto e vírgula `;`)
              </label>
              <Input
                value={newExpositores}
                onChange={(e) => setNewExpositores(e.target.value)}
                placeholder="Nome Aluno 1; Nome Aluno 2"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-semibold">
                Banca de Avaliadores (separe por ponto e vírgula `;`)
              </label>
              <Input
                value={newAvaliadores}
                onChange={(e) => setNewAvaliadores(e.target.value)}
                placeholder="Prof. Avaliador 1; Profa. Avaliadora 2"
              />
            </div>
            <Button
              type="submit"
              variant="plum"
              size="field"
              disabled={isPending}
              className="w-full"
            >
              Criar Projeto e Auto-Gerar Credenciais
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal: Folha de Estande Oficial Pronta para Impressão */}
      <Dialog
        open={Boolean(standSheetProject)}
        onOpenChange={(o) => !o && setStandSheetProject(null)}
      >
        <DialogContent className="sm:max-w-md">
          {standSheetProject && (
            <div className="space-y-4 text-center">
              <div className="rounded-2xl border-2 border-slate-900 bg-white p-6 text-slate-950 shadow-sm">
                <div className="text-xs font-bold uppercase tracking-widest text-[#1565C0]">
                  35ª META • CEFET-MG — Folha Oficial de Estande
                </div>
                <h3 className="mt-2 font-display text-lg font-bold leading-snug">
                  {standSheetProject.title}
                </h3>
                <p className="mt-1 text-xs font-medium text-slate-600">
                  {standSheetProject.standLocation} ({standSheetProject.shift})
                </p>

                <div className="my-5 flex justify-center">
                  <div className="rounded-2xl border-2 border-slate-200 bg-white p-3">
                    <QRCodeSVG
                      value={standSheetProject.shortCode}
                      size={168}
                      level="M"
                    />
                  </div>
                </div>

                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  Código Numérico Curto p/ Avaliação
                </div>
                <div className="mt-1 font-mono text-3xl font-extrabold tracking-widest text-slate-900">
                  #{standSheetProject.shortCode}
                </div>
              </div>

              <Button
                type="button"
                onClick={() => window.print()}
                className="w-full"
              >
                <Printer className="h-4 w-4" />
                Imprimir Folha de Estande
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
