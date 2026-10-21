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
  ChevronRight,
} from "lucide-react";
import { toast } from "sonner";
import type { TagRecord } from "@/db/local-store";
import type { UserRole } from "@/db/schema";
import { MetaLogo } from "@/components/shared/meta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
    role: "VISITANTE",
    title: "Visitante (Passaporte META)",
    user: "Beatriz • 3 selos cor + 1 P&B",
    desc: "Coleta carimbos QR, recomendações e troca de brindes.",
    color: "#D81B60",
    icon: Stamp,
  },
  {
    role: "AVALIADOR",
    title: "Avaliador Oficial (Banca)",
    user: "Prof. Marcos • Assinatura 1-Click",
    desc: "Escaneia estande, dá notas (1-5) e assina em 1 toque.",
    color: "#1E3A8A",
    icon: ClipboardCheck,
  },
  {
    role: "EXPOSITOR",
    title: "Expositor (#4821 NeuroGlove)",
    user: "Pedro • Emissor de Selo 60s",
    desc: "Gera QR dinâmico p/ visitantes, edita bio e vê banca.",
    color: "#1565C0",
    icon: Presentation,
  },
  {
    role: "COLABORADOR",
    title: "Colaborador (Recepção/Brindes)",
    user: "Lucas • Check-in e Troca P&B",
    desc: "Credencia equipes/banca e debita selos por brindes.",
    color: "#F57C00",
    icon: ScanLine,
  },
  {
    role: "MASTER",
    title: "Organizador Master (Desktop/Web)",
    user: "Profa. Helena • Painel Geral",
    desc: "Importa SIGAA, distribui avaliadores e apura notas.",
    color: "#6A1B4D",
    icon: ShieldCheck,
  },
];

export function LoginClientView({ tags }: LoginClientViewProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [mode, setMode] = useState<"demo" | "login" | "register">("demo");

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
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
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
      toast.error("Selecione pelo menos 1 tema de interesse!");
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
      toast.success("Passaporte META criado com recomendações!");
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
        toast.info("Simulando 1º Acesso de Avaliador com senha provisória!");
        router.push(res.redirectTo);
        router.refresh();
      }
    });
  };

  return (
    <div className="min-h-dvh bg-slate-200/70 dark:bg-[#050811] flex justify-center">
      <div className="relative flex min-h-dvh w-full max-w-[440px] flex-col bg-background text-foreground shadow-[0_0_50px_rgba(15,23,42,0.15)] md:border-x md:border-slate-200/80 dark:md:border-slate-800/80">
        {/* Fita Oficial 35ª META */}
        <div className="h-[3.5px] w-full bg-meta-gradient" />

        {/* Header Compacto do App */}
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 dark:border-slate-800/80 dark:bg-[#0F172A]/95">
          <MetaLogo compact />
          <Link
            href="/cronograma"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
          >
            <CalendarDays className="h-3.5 w-3.5 text-[#1565C0]" />
            Mapa & Horários
          </Link>
        </header>

        <main className="flex-1 space-y-3.5 px-3.5 py-4">
          {/* Segmented Switcher de 3 Modos no Topo */}
          <div className="grid grid-cols-3 rounded-xl bg-slate-200/75 p-1 dark:bg-slate-900">
            <button
              type="button"
              onClick={() => setMode("demo")}
              className={`inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "demo"
                  ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5 text-[#D81B60]" />
              Demo Rápida
            </button>
            <button
              type="button"
              onClick={() => setMode("login")}
              className={`inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "login"
                  ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <LogIn className="h-3.5 w-3.5 text-[#1565C0]" />
              Entrar
            </button>
            <button
              type="button"
              onClick={() => setMode("register")}
              className={`inline-flex items-center justify-center gap-1 rounded-lg py-2 text-xs font-bold transition ${
                mode === "register"
                  ? "bg-[#D81B60] text-white shadow-2xs"
                  : "text-slate-600 dark:text-slate-400"
              }`}
            >
              <UserPlus className="h-3.5 w-3.5" />
              Visitante
            </button>
          </div>

          {/* MODO 1: ACESSO RÁPIDO 1-CLIQUE AOS 5 PERFIS */}
          {mode === "demo" && (
            <div className="space-y-2.5">
              <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#D81B60]">
                  <Sparkles className="h-3.5 w-3.5" />
                  Simulador Oficial • 35ª META CEFET-MG
                </div>
                <p className="mt-0.5 text-[11px] text-slate-500">
                  Toque em qualquer perfil para testar a jornada mobile em tempo
                  real:
                </p>

                <div className="mt-3 space-y-2">
                  {DEMO_CARDS.map((card) => {
                    const Icon = card.icon;
                    return (
                      <button
                        key={card.role}
                        type="button"
                        disabled={isPending}
                        onClick={() => handleQuickDemo(card.role)}
                        className="group flex w-full items-center gap-3 rounded-2xl border border-slate-200/90 bg-slate-50/60 p-2.5 text-left transition active:scale-[0.98] hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/50 dark:hover:bg-slate-900"
                      >
                        <div
                          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-xs"
                          style={{ backgroundColor: card.color }}
                        >
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="truncate font-display text-xs font-bold text-slate-900 dark:text-white">
                              {card.title}
                            </span>
                            <ChevronRight className="h-4 w-4 shrink-0 text-slate-400 transition-transform group-hover:translate-x-0.5" />
                          </div>
                          <div className="font-mono text-[10px] font-semibold text-slate-500">
                            {card.user}
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[11px] text-slate-600 dark:text-slate-400">
                            {card.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Botão p/ Testar 1º Acesso com Senha Provisória */}
                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleFirstAccessDemo}
                  className="mt-2.5 flex w-full items-center justify-between rounded-xl border border-dashed border-[#1E3A8A]/40 bg-[#1E3A8A]/5 px-3 py-2.5 text-left text-xs font-semibold text-[#1E3A8A] transition active:scale-98 dark:border-[#818CF8]/40 dark:bg-[#818CF8]/10 dark:text-[#818CF8]"
                >
                  <span className="flex items-center gap-2">
                    <KeyRound className="h-4 w-4 shrink-0" />
                    <span>Testar 1º Acesso (Senha Provisória + Assinatura)</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0" />
                </button>
              </div>
            </div>
          )}

          {/* MODO 2: LOGIN COM CREDENCIAIS */}
          {mode === "login" && (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]">
              <h2 className="font-display text-base font-bold">
                Entrar na Plataforma
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Use seu login institucional, código SIGAA ou e-mail de
                visitante.
              </p>

              <form onSubmit={handleLogin} className="mt-3.5 space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Usuário ou E-mail
                  </label>
                  <Input
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="Ex: pedro.expositor ou visitante@gmail.com"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Senha (ou Provisória)
                  </label>
                  <Input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Ex: 123456"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  size="field"
                  disabled={isPending}
                  className="w-full rounded-xl"
                >
                  <LogIn className="h-4 w-4" />
                  Acessar Painel
                </Button>
              </form>
            </div>
          )}

          {/* MODO 3: CRIAR PASSAPORTE DE VISITANTE + TRIAGEM */}
          {mode === "register" && (
            <div className="rounded-2xl border border-[#D81B60]/30 bg-white p-4 shadow-2xs dark:border-[#F472B6]/30 dark:bg-[#0F172A]">
              <h2 className="font-display text-base font-bold text-[#D81B60] dark:text-[#F472B6]">
                Novo Passaporte 35ª META
              </h2>
              <p className="mt-0.5 text-xs text-slate-500">
                Crie seu passe digital em 15 segundos e receba recomendações de
                estandes!
              </p>

              <form
                onSubmit={handleVisitorRegister}
                className="mt-3 space-y-3"
              >
                <div>
                  <label className="mb-1 block text-xs font-bold">
                    Seu Nome
                  </label>
                  <Input
                    value={visitorName}
                    onChange={(e) => setVisitorName(e.target.value)}
                    placeholder="Ex: Mariana Costa"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="mb-1 block text-xs font-bold">
                      E-mail / Login
                    </label>
                    <Input
                      value={visitorEmail}
                      onChange={(e) => setVisitorEmail(e.target.value)}
                      placeholder="mariana@email.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold">
                      Senha Rápida
                    </label>
                    <Input
                      type="password"
                      value={visitorPassword}
                      onChange={(e) => setVisitorPassword(e.target.value)}
                      placeholder="******"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-bold">
                    Quais áreas você mais curte? ({selectedTags.length}{" "}
                    escolhidas)
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {tags.map((tag) => {
                      const active = selectedTags.includes(tag.id);
                      return (
                        <button
                          key={tag.id}
                          type="button"
                          onClick={() => toggleTag(tag.id)}
                          className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition ${
                            active
                              ? "border-[#D81B60] bg-[#D81B60] text-white"
                              : "border-slate-200 bg-slate-50 text-slate-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                          }`}
                        >
                          {active && <Check className="h-3 w-3" />}
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
                  className="w-full rounded-xl"
                >
                  <Stamp className="h-4 w-4" />
                  Abrir Meu Passaporte Digital
                </Button>
              </form>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
