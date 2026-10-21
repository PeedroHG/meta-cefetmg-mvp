"use client";

import React, { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useTheme } from "next-themes";
import {
  LogIn,
  UserPlus,
  CalendarDays,
  Check,
  Lock,
  Mail,
  User,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Loader2,
  Info,
  Sparkles,
  HelpCircle,
  X,
  ArrowLeft,
  Stamp,
} from "lucide-react";
import { toast } from "sonner";
import type { TagRecord } from "@/db/local-store";
import { MetaLogo } from "@/components/shared/meta-logo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginAction, registerVisitorAction } from "@/features/auth/actions";

interface LoginClientViewProps {
  tags: TagRecord[];
}

export function LoginClientView({ tags }: LoginClientViewProps) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [isPending, startTransition] = useTransition();

  // Mode: "login" (default) or "register" (visitante)
  const [mode, setMode] = useState<"login" | "register">("login");

  // Login form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Visitor registration state
  const [visitorName, setVisitorName] = useState("");
  const [visitorEmail, setVisitorEmail] = useState("");
  const [visitorPassword, setVisitorPassword] = useState("");
  const [showVisitorPassword, setShowVisitorPassword] = useState(false);
  const [selectedTags, setSelectedTags] = useState<string[]>([
    "tag-ia",
    "tag-robotica",
  ]);

  // Demo credentials helper modal (subtle for presenter)
  const [showDemoHelp, setShowDemoHelp] = useState(false);

  const toggleTag = (tagId: string) => {
    setSelectedTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password) {
      toast.error("Por favor, preencha o usuário e a senha.");
      return;
    }

    startTransition(async () => {
      const res = await loginAction({ username, password });
      if (!res.success) {
        toast.error(res.error || "Erro ao realizar login.");
        return;
      }
      toast.success("Login efetuado com sucesso!");
      router.push(res.redirectTo || "/");
      router.refresh();
    });
  };

  const handleVisitorRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!visitorName.trim()) {
      toast.error("Informe seu nome completo.");
      return;
    }
    if (!visitorEmail.trim()) {
      toast.error("Informe seu e-mail ou nome de usuário.");
      return;
    }
    if (visitorPassword.length < 4) {
      toast.error("A senha deve ter pelo menos 4 caracteres.");
      return;
    }
    if (selectedTags.length === 0) {
      toast.error("Selecione pelo menos 1 área de interesse!");
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
      toast.success("Passaporte META criado com sucesso!");
      router.push(res.redirectTo || "/visitante");
      router.refresh();
    });
  };

  const fillQuickCredential = (user: string) => {
    setUsername(user);
    setPassword("meta2026");
    setShowDemoHelp(false);
    toast.info(`Preenchido: ${user} (senha: meta2026)`);
  };

  return (
    <div className="relative min-h-dvh flex flex-col justify-between bg-slate-50 dark:bg-[#070B14] text-foreground overflow-x-hidden">
      {/* Fita Superior Oficial da 35ª META */}
      <div className="h-1.5 w-full bg-meta-gradient shrink-0" />

      {/* Barra de Navegação Superior Pública */}
      <header className="w-full border-b border-slate-200/80 bg-white/90 px-4 py-3 backdrop-blur-md dark:border-slate-800/80 dark:bg-[#0B1120]/90">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between">
          <Link href="/login" className="focus:outline-none">
            <MetaLogo compact />
          </Link>

          <div className="flex items-center gap-2">
            <Link
              href="/cronograma"
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <CalendarDays className="h-3.5 w-3.5 text-[#1565C0] dark:text-[#3B82F6]" />
              <span className="hidden sm:inline">Mapa &</span> Horários
            </Link>

            <button
              type="button"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-2xs transition hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
              title="Alternar Tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </button>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal Centralizado */}
      <main className="flex-1 flex items-center justify-center px-4 py-8 sm:py-12">
        <div className="w-full max-w-[420px]">
          {/* Card Principal */}
          <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-white p-6 shadow-xl shadow-slate-900/5 transition-all dark:border-slate-800/90 dark:bg-[#0F172A] dark:shadow-black/30 sm:p-7">
            {/* Linha decorativa sutil no topo do card */}
            <div
              className={`absolute top-0 left-0 right-0 h-1 transition-all ${
                mode === "login" ? "bg-[#1565C0]" : "bg-[#D81B60]"
              }`}
            />

            {/* VISUALIZAÇÃO 1: TELA DE LOGIN (ENTRAR) */}
            {mode === "login" && (
              <div className="space-y-5">
                <div>
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#1565C0]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#1565C0] dark:bg-[#3B82F6]/15 dark:text-[#60A5FA]">
                    <LogIn className="h-3 w-3" />
                    Acesso à Plataforma
                  </div>
                  <h1 className="mt-2 font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Entrar
                  </h1>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
                    Acesse com seu usuário, e-mail institucional ou código SIGAA.
                  </p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  {/* Campo Usuário / Identificação */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Usuário, E-mail ou Matrícula
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        placeholder="Ex: seu.usuario ou email@cefetmg.br"
                        className="h-11 pl-9 pr-3 text-sm focus-visible:ring-[#1565C0] dark:focus-visible:ring-[#3B82F6]"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Campo Senha */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Senha
                      </label>
                    </div>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="••••••••"
                        className="h-11 pl-9 pr-10 text-sm focus-visible:ring-[#1565C0] dark:focus-visible:ring-[#3B82F6]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        tabIndex={-1}
                      >
                        {showPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Aviso discreto sobre credenciais provisórias */}
                  <div className="rounded-xl border border-slate-200/80 bg-slate-50/80 p-2.5 text-[11px] text-slate-600 dark:border-slate-800/80 dark:bg-slate-900/60 dark:text-slate-400 flex items-start gap-2">
                    <Info className="h-3.5 w-3.5 text-[#1565C0] shrink-0 mt-0.5 dark:text-[#3B82F6]" />
                    <span>
                      Avaliadores, expositores e colaboradores: utilizem a
                      senha provisória informada pela organização.
                    </span>
                  </div>

                  {/* Botão Entrar */}
                  <Button
                    type="submit"
                    disabled={isPending}
                    size="field"
                    className="w-full rounded-xl bg-[#1565C0] font-semibold text-white shadow-md shadow-[#1565C0]/20 hover:bg-[#1253a0] active:scale-[0.99] dark:bg-[#3B82F6] dark:hover:bg-[#2563EB]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Acessando...
                      </>
                    ) : (
                      <>
                        <LogIn className="h-4 w-4" />
                        Entrar no Sistema
                      </>
                    )}
                  </Button>
                </form>

                {/* Divisor Visual */}
                <div className="relative my-4 flex items-center justify-center">
                  <div className="w-full border-t border-slate-200 dark:border-slate-800" />
                  <span className="absolute bg-white px-2.5 text-[11px] font-semibold uppercase text-slate-400 dark:bg-[#0F172A]">
                    ou
                  </span>
                </div>

                {/* Botão de Registro (Visitante) */}
                <div className="space-y-2">
                  <button
                    type="button"
                    onClick={() => setMode("register")}
                    className="group flex w-full items-center justify-center gap-2 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/60 px-4 py-3 text-xs font-bold text-slate-700 transition hover:border-[#D81B60]/50 hover:bg-[#D81B60]/5 hover:text-[#D81B60] active:scale-[0.99] dark:border-slate-800 dark:bg-slate-900/50 dark:text-slate-300 dark:hover:border-[#EC4899]/50 dark:hover:bg-[#EC4899]/10 dark:hover:text-[#EC4899]"
                  >
                    <UserPlus className="h-4 w-4 text-[#D81B60] dark:text-[#EC4899]" />
                    <span>Primeira vez aqui? Crie seu Passaporte</span>
                  </button>
                </div>
              </div>
            )}

            {/* VISUALIZAÇÃO 2: TELA DE REGISTRO (VISITANTE) */}
            {mode === "register" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="inline-flex items-center gap-1.5 rounded-full bg-[#D81B60]/10 px-2.5 py-0.5 text-[11px] font-bold text-[#D81B60] dark:bg-[#EC4899]/15 dark:text-[#F472B6]">
                    <Stamp className="h-3 w-3" />
                    Passaporte de Visitante
                  </div>

                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    <ArrowLeft className="h-3.5 w-3.5" />
                    Voltar ao Login
                  </button>
                </div>

                <div>
                  <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    Criar Conta
                  </h1>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    Cadastre-se para visitar os estandes, coletar selos e trocar
                    por brindes.
                  </p>
                </div>

                <form onSubmit={handleVisitorRegister} className="space-y-3.5">
                  {/* Nome Completo */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Nome Completo
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <User className="h-4 w-4" />
                      </div>
                      <Input
                        type="text"
                        value={visitorName}
                        onChange={(e) => setVisitorName(e.target.value)}
                        placeholder="Ex: Mariana Costa"
                        className="h-10 pl-9 text-sm focus-visible:ring-[#D81B60] dark:focus-visible:ring-[#EC4899]"
                        required
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* E-mail / Login */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      E-mail ou Usuário
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Mail className="h-4 w-4" />
                      </div>
                      <Input
                        type="text"
                        value={visitorEmail}
                        onChange={(e) => setVisitorEmail(e.target.value)}
                        placeholder="mariana@email.com"
                        className="h-10 pl-9 text-sm focus-visible:ring-[#D81B60] dark:focus-visible:ring-[#EC4899]"
                        required
                      />
                    </div>
                  </div>

                  {/* Senha */}
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                      Crie uma Senha
                    </label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                        <Lock className="h-4 w-4" />
                      </div>
                      <Input
                        type={showVisitorPassword ? "text" : "password"}
                        value={visitorPassword}
                        onChange={(e) => setVisitorPassword(e.target.value)}
                        placeholder="Mínimo 4 caracteres"
                        className="h-10 pl-9 pr-10 text-sm focus-visible:ring-[#D81B60] dark:focus-visible:ring-[#EC4899]"
                        required
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setShowVisitorPassword(!showVisitorPassword)
                        }
                        className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        tabIndex={-1}
                      >
                        {showVisitorPassword ? (
                          <EyeOff className="h-4 w-4" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Triagem de Interesses (Tags) */}
                  <div className="space-y-1.5 pt-1">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Áreas de Interesse
                      </label>
                      <span className="text-[10px] font-semibold text-slate-400">
                        {selectedTags.length} selecionada(s)
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-[110px] overflow-y-auto pr-1">
                      {tags.map((tag) => {
                        const active = selectedTags.includes(tag.id);
                        return (
                          <button
                            key={tag.id}
                            type="button"
                            onClick={() => toggleTag(tag.id)}
                            className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition active:scale-95 ${
                              active
                                ? "border-[#D81B60] bg-[#D81B60] text-white shadow-2xs"
                                : "border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300 dark:hover:bg-slate-800"
                            }`}
                          >
                            {active && <Check className="h-3 w-3 stroke-[3]" />}
                            {tag.name}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Botão Cadastrar */}
                  <Button
                    type="submit"
                    disabled={isPending}
                    size="field"
                    className="w-full rounded-xl bg-[#D81B60] font-semibold text-white shadow-md shadow-[#D81B60]/20 hover:bg-[#b0174e] active:scale-[0.99] dark:bg-[#EC4899] dark:hover:bg-[#db2777]"
                  >
                    {isPending ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Criando Passaporte...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Cadastrar & Acessar
                      </>
                    )}
                  </Button>
                </form>

                <div className="pt-2 text-center">
                  <button
                    type="button"
                    onClick={() => setMode("login")}
                    className="text-xs font-semibold text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  >
                    Já possui conta? <span className="underline">Entrar</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Dica discreta de Demonstração / Credenciais de Teste */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setShowDemoHelp(true)}
              className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-500 hover:text-[#1565C0] dark:text-slate-400 dark:hover:text-[#60A5FA] transition"
            >
              <HelpCircle className="h-3.5 w-3.5" />
              <span>Ver usuários de demonstração da 35ª META</span>
            </button>
          </div>
        </div>
      </main>

      {/* Rodapé Institucional */}
      <footer className="border-t border-slate-200/80 bg-white/70 py-4 px-4 text-center text-xs text-slate-500 dark:border-slate-800/80 dark:bg-[#0B1120]/70 dark:text-slate-400">
        <div className="mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>
            35ª META • Mostra Específica de Trabalhos e Aplicações
          </span>
          <span className="font-mono text-[11px]">
            CEFET-MG — Campus Belo Horizonte
          </span>
        </div>
      </footer>

      {/* Modal / Dialog Discreto de Auxílio para Apresentação */}
      {showDemoHelp && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-xs">
          <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#D81B60]" />
                <h3 className="font-display text-sm font-bold">
                  Contas de Demonstração
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowDemoHelp(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="mt-1 text-xs text-slate-500">
              Clique em qualquer usuário para preencher o formulário. A senha
              padrão é <strong className="font-mono text-slate-900 dark:text-white">meta2026</strong>.
            </p>

            <div className="mt-3 space-y-1.5">
              {[
                {
                  label: "Organizador Master",
                  user: "master@cefetmg.br",
                  name: "Profa. Helena",
                  color: "#6A1B4D",
                },
                {
                  label: "Colaborador (Recepção)",
                  user: "colaborador@cefetmg.br",
                  name: "Lucas Andrade",
                  color: "#F57C00",
                },
                {
                  label: "Expositor (Estande #4821)",
                  user: "pedro.expositor",
                  name: "Pedro Henrique",
                  color: "#1565C0",
                },
                {
                  label: "Avaliador Oficial (Banca)",
                  user: "marcos.avaliador",
                  name: "Prof. Marcos",
                  color: "#1E3A8A",
                },
                {
                  label: "Visitante (Passaporte)",
                  user: "beatriz.visitante@gmail.com",
                  name: "Beatriz Lima",
                  color: "#D81B60",
                },
              ].map((item) => (
                <button
                  key={item.user}
                  type="button"
                  onClick={() => fillQuickCredential(item.user)}
                  className="flex w-full items-center justify-between rounded-xl border border-slate-200/80 bg-slate-50/70 p-2 text-left transition hover:border-slate-300 hover:bg-white dark:border-slate-800 dark:bg-slate-900/60 dark:hover:bg-slate-800"
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2.5 w-2.5 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.name}
                      </div>
                      <div className="font-mono text-[10px] text-slate-500">
                        {item.user}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-[#1565C0] dark:text-[#3B82F6]">
                    Usar →
                  </span>
                </button>
              ))}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-800 text-center">
              <span className="text-[11px] text-slate-500">
                Após logar, use o botão flutuante para alternar perfis com 1 clique.
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
