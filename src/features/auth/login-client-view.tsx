"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ShieldCheck,
  ScanLine,
  Presentation,
  ClipboardCheck,
  Stamp,
  Sparkles,
  LogIn,
  UserPlus,
  CalendarDays,
  Check,
  KeyRound,
} from "lucide-react";
import { toast } from "sonner";
import type { TagRecord } from "@/db/local-store";
import type { UserRole } from "@/db/schema";
import { MetaLogo } from "@/components/shared/meta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  loginAction,
  registerVisitorAction,
  switchDemoRoleAction,
  switchSpecificDemoUserAction,
} from "@/features/auth/actions";

interface LoginClientViewProps {
  tags: TagRecord[];
}

const DEMO_CARDS: {
  role: UserRole;
  title: string;
  user: string;
  desc: string;
  color: string;
  icon: typeof ShieldCheck;
}[] = [
  {
    role: "MASTER",
    title: "Organizador Master",
    user: "master@cefetmg.br",
    desc: "Cria/importa projetos SIGAA, gerencia avaliadores, tags e apuração de notas.",
    color: "#6A1B4D",
    icon: ShieldCheck,
  },
  {
    role: "COLABORADOR",
    title: "Colaborador Operacional",
    user: "colaborador@cefetmg.br",
    desc: "Credencia equipes/avaliadores, colhe assinaturas e debita selos por brindes.",
    color: "#F57C00",
    icon: ScanLine,
  },
  {
    role: "EXPOSITOR",
    title: "Expositor (#4821 NeuroGlove)",
    user: "pedro.expositor",
    desc: "Personaliza estande, emite QR Code dinâmico de selo e vê avaliadores.",
    color: "#1565C0",
    icon: Presentation,
  },
  {
    role: "AVALIADOR",
    title: "Avaliador Oficial",
    user: "avaliador@cefetmg.br",
    desc: "Escaneia estandes, preenche Ficha Padrão META e assina em 1 clique.",
    color: "#1E3A8A",
    icon: ClipboardCheck,
  },
  {
    role: "VISITANTE",
    title: "Visitante (Passaporte META)",
    user: "visitante@gmail.com",
    desc: "Recebe recomendações por tags, coleta selos e vê selos gastos em P&B.",
    color: "#D81B60",
    icon: Stamp,
  },
];

export function LoginClientView({ tags }: LoginClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login State
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  // Visitor Registration + Interest Triage State
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPassword, setVisitorPassword] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "tag-ia",
    "tag-robotica",
  ]);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await loginAction({ username, password });
      if (!res.success) {
        toast.error(res.error || "Erro ao realizar login.");
        return;
      }
      toast.success("Bem-vindo à 35ª META!");
      router.push(res.redirectTo || "/");
      router.refresh();
    });
  };

  const handleVisitorRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedTags.length === 0) {
      toast.error("Selecione pelo menos 1 tema de interesse na triagem!");
      return;
    }
    startTransition(async () => {
      const res = await registerVisitorAction({
        name: visitorName,
        username: visitorEmail,
        password: visitorPassword,
        selectedTagIds: selectedTags,
      });
      if (!res.success) {
        toast.error(res.error || "Não foi possível criar sua conta.");
        return;
      }
      toast.success("Passaporte META criado com recomendações personalizadas!");
      router.push(res.redirectTo || "/visitante");
      router.refresh();
    });
  };

  const handleQuickDemo = (role: UserRole) => {
    startTransition(async () => {
      const res = await switchDemoRoleAction(role);
      if (res.success && res.redirectTo) {
        toast.success(`Acessando como ${role}`);
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  };

  const handleFirstAccessDemo = () => {
    startTransition(async () => {
      const res = await switchSpecificDemoUserAction("user-aval-3");
      if (res.success && res.redirectTo) {
        toast.info("Abrindo fluxo de 1º Acesso do Avaliador (Troca de senha + Assinatura)");
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Barra Superior no Gradiente 35ª META */}
      <div className="h-1 w-full bg-meta-gradient" />

      <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-4 py-8 sm:px-6 lg:py-12">
        {/* Topo Institucional */}
        <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <MetaLogo />
          <Link
            href="/cronograma"
            className="inline-flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <CalendarDays className="h-4 w-4 text-[#1565C0]" />
            Ver Cronograma Oficial & Catálogo Público
          </Link>
        </div>

        <div className="grid gap-8 lg:grid-cols-12 items-start">
          {/* Coluna Esquerda: Login ou Auto-Cadastro de Visitante com Triagem */}
          <div className="lg:col-span-6">
            <Card className="overflow-hidden border-slate-200/90 shadow-md dark:border-slate-800">
              <div className="grid grid-cols-2 border-b border-slate-200 bg-slate-50/70 p-1.5 dark:border-slate-800 dark:bg-slate-900/60">
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                    mode === "login"
                      ? "bg-white text-[#1565C0] shadow-xs dark:bg-slate-800 dark:text-white"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <LogIn className="h-4 w-4" />
                  Entrar na Plataforma
                </button>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-xs font-bold transition-all ${
                    mode === "register"
                      ? "bg-[#D81B60] text-white shadow-xs"
                      : "text-slate-600 hover:text-slate-900 dark:text-slate-400"
                  }`}
                >
                  <UserPlus className="h-4 w-4" />
                  Sou Visitante (Criar Passaporte)
                </button>
              </div>

              {mode === "login" ? (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl">
                      Acesso Único — 35ª META
                    </CardTitle>
                    <CardDescription>
                      Entre com seu usuário, matrícula SIGAA ou e-mail. Senha padrão das contas de teste:{" "}
                      <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200">
                        meta2026
                      </code>
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleLogin} className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Usuário, Matrícula ou E-mail
                        </label>
                        <Input
                          value={username}
                          onChange={(e) => setUsername(e.target.value)}
                          placeholder="Ex: avaliador@cefetmg.br ou pedro.expositor"
                          required
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Senha de Acesso
                        </label>
                        <Input
                          type="password"
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          required
                        />
                      </div>
                      <Button
                        type="submit"
                        size="field"
                        disabled={isPending}
                        className="w-full"
                      >
                        <LogIn className="h-4 w-4" />
                        {isPending ? "Autenticando..." : "Acessar Plataforma"}
                      </Button>
                    </form>
                  </CardContent>
                </>
              ) : (
                <>
                  <CardHeader>
                    <CardTitle className="text-xl flex items-center gap-2">
                      <Stamp className="h-5 w-5 text-[#D81B60]" />
                      Criar Passaporte META + Triagem
                    </CardTitle>
                    <CardDescription>
                      Cadastre-se em segundos, escolha seus temas favoritos para receber recomendações de estandes e colete selos!
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleVisitorRegister} className="space-y-4">
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            Seu Nome Completo
                          </label>
                          <Input
                            value={visitorName}
                            onChange={(e) => setVisitorName(e.target.value)}
                            placeholder="Ex: Ana Clara Souza"
                            required
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            E-mail ou Usuário
                          </label>
                          <Input
                            value={visitorEmail}
                            onChange={(e) => setVisitorEmail(e.target.value)}
                            placeholder="ana@email.com"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                          Crie uma Senha
                        </label>
                        <Input
                          type="password"
                          value={visitorPassword}
                          onChange={(e) => setVisitorPassword(e.target.value)}
                          placeholder="Mínimo de 4 caracteres"
                          required
                        />
                      </div>

                      {/* Quiz Rápido de Triagem de Interesses */}
                      <div className="space-y-2 rounded-xl border border-slate-200 bg-slate-50/70 p-3.5 dark:border-slate-800 dark:bg-slate-900/50">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-900 dark:text-slate-100">
                            🎯 Quiz de Triagem: O que você mais quer ver na META?
                          </span>
                          <span className="text-[11px] font-semibold text-[#D81B60]">
                            {selectedTags.length} selecionado(s)
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-500 dark:text-slate-400">
                          Usaremos essas tags para recomendar os projetos ideais para você visitar:
                        </p>
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {tags.map((tag) => {
                            const selected = selectedTags.includes(tag.id);
                            return (
                              <button
                                key={tag.id}
                                type="button"
                                onClick={() => toggleTag(tag.id)}
                                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
                                  selected
                                    ? "bg-[#D81B60] text-white shadow-xs"
                                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                }`}
                              >
                                {selected && <Check className="h-3.5 w-3.5" />}
                                {tag.name}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      <Button
                        type="submit"
                        variant="magenta"
                        size="field"
                        disabled={isPending}
                        className="w-full"
                      >
                        <Stamp className="h-4 w-4" />
                        {isPending
                          ? "Emitindo Passaporte..."
                          : "Criar Meu Passaporte Digital"}
                      </Button>
                    </form>
                  </CardContent>
                </>
              )}
            </Card>
          </div>

          {/* Coluna Direita: Painel de Acesso Instantâneo aos 5 Perfis para Apresentação */}
          <div className="lg:col-span-6 space-y-4">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-[#0F172A]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-[#D81B60]" />
                <h2 className="font-display text-lg font-bold text-slate-900 dark:text-white">
                  Acesso Rápido de Demonstração (5 Perfis)
                </h2>
              </div>
              <p className="mt-1 text-xs text-slate-600 dark:text-slate-400">
                Clique em qualquer perfil abaixo para entrar imediatamente sem digitar senha (você também pode alternar a qualquer momento pela pílula flutuante no canto inferior direito):
              </p>

              <div className="mt-4 grid gap-2.5">
                {DEMO_CARDS.map((card) => {
                  const Icon = card.icon;
                  return (
                    <button
                      key={card.role}
                      type="button"
                      disabled={isPending}
                      onClick={() => handleQuickDemo(card.role)}
                      className="group flex w-full items-center gap-3.5 rounded-xl border border-slate-200 bg-slate-50/60 p-3 text-left transition-all hover:border-slate-400 hover:bg-white hover:shadow-xs dark:border-slate-800 dark:bg-slate-900/50 dark:hover:border-slate-700 dark:hover:bg-slate-900"
                    >
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-white shadow-xs transition-transform group-hover:scale-105"
                        style={{ backgroundColor: card.color }}
                      >
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-display text-sm font-bold text-slate-900 dark:text-white">
                            {card.title}
                          </span>
                          <span className="rounded bg-slate-200/80 px-2 py-0.5 font-mono text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                            {card.user}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-slate-600 dark:text-slate-400">
                          {card.desc}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Botão especial para demonstrar o Onboarding de 1º Acesso do Avaliador */}
              <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleFirstAccessDemo}
                  className="flex w-full items-center justify-between rounded-xl border border-dashed border-[#1E3A8A]/40 bg-[#1E3A8A]/5 px-3.5 py-2.5 text-left text-xs font-semibold text-[#1E3A8A] transition hover:bg-[#1E3A8A]/10 dark:border-[#818CF8]/40 dark:bg-[#818CF8]/10 dark:text-[#818CF8]"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4" />
                    Demonstrar 1º Acesso de Avaliador (Trocar Senha Provisória + Desenhar Assinatura no Canvas)
                  </span>
                  <span className="shrink-0 rounded bg-[#1E3A8A] px-2 py-0.5 font-mono text-[10px] text-white">
                    Testar
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
