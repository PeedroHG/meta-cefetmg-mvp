"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Search,
  LogIn,
  ArrowLeft,
  Presentation,
} from "lucide-react";
import type {
  ProjectRecord,
  ScheduleItemRecord,
  TagRecord,
} from "@/db/local-store";
import type { UserRole } from "@/db/schema";
import { ROLE_META_CONFIG } from "@/lib/utils";
import { AppShell } from "@/components/shared/app-shell";
import { MetaLogo } from "@/components/shared/meta-logo";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";

interface EnrichedPublicProject extends ProjectRecord {
  tags: TagRecord[];
  expositores: string[];
}

interface CronogramaClientViewProps {
  user: {
    id: string;
    name: string;
    username: string;
    role: UserRole;
    isAccredited: boolean;
  } | null;
  scheduleItems: ScheduleItemRecord[];
  projects: EnrichedPublicProject[];
  tags: TagRecord[];
}

export function CronogramaClientView({
  user,
  scheduleItems,
  projects,
  tags,
}: CronogramaClientViewProps) {
  const [tab, setTab] = useState<"estandes" | "horarios">("estandes");
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState<string>("ALL");

  const filteredProjects = projects.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.shortCode.includes(search) ||
      p.standLocation.toLowerCase().includes(search.toLowerCase());
    const matchesTag =
      selectedTag === "ALL" || p.tags.some((t) => t.id === selectedTag);
    return matchesSearch && matchesTag;
  });

  const backRoute = user ? ROLE_META_CONFIG[user.role].defaultRoute : "/login";

  const content = (
    <div className="space-y-3.5">
      {/* Header Compacto com Botão Voltar */}
      <div className="flex items-center justify-between gap-2 rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]">
        <div>
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#1565C0] dark:text-[#60A5FA]">
            Campus Nova Suíça • 35ª META
          </span>
          <h1 className="font-display text-base font-bold text-slate-900 dark:text-white">
            Mapa de Estandes & Horários
          </h1>
        </div>
        <Link
          href={backRoute}
          className="inline-flex shrink-0 items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-bold text-slate-700 transition hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Voltar
        </Link>
      </div>

      {/* Segmented Switcher: Estandes vs Horários */}
      <div className="grid grid-cols-2 rounded-xl bg-slate-200/75 p-1 dark:bg-slate-900">
        <button
          type="button"
          onClick={() => setTab("estandes")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
            tab === "estandes"
              ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <Presentation className="h-3.5 w-3.5 text-[#1565C0]" />
          Estandes ({filteredProjects.length})
        </button>
        <button
          type="button"
          onClick={() => setTab("horarios")}
          className={`inline-flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition ${
            tab === "horarios"
              ? "bg-white text-slate-900 shadow-2xs dark:bg-slate-800 dark:text-white"
              : "text-slate-600 dark:text-slate-400"
          }`}
        >
          <CalendarDays className="h-3.5 w-3.5 text-[#D81B60]" />
          Programação ({scheduleItems.length})
        </button>
      </div>

      {tab === "estandes" ? (
        <div className="space-y-3">
          {/* Busca Rápida */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projeto, #4821 ou bloco..."
              className="h-10 pl-9 text-xs"
            />
          </div>

          {/* Pílulas Horizontais de Tags */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar">
            <button
              type="button"
              onClick={() => setSelectedTag("ALL")}
              className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                selectedTag === "ALL"
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                  : "border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              Todos
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                type="button"
                onClick={() => setSelectedTag(tag.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[11px] font-bold transition ${
                  selectedTag === tag.id
                    ? "bg-[#1565C0] text-white"
                    : "border border-slate-200 bg-white text-slate-600 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
                }`}
              >
                {tag.name}
              </button>
            ))}
          </div>

          {/* Lista Compacta de Estandes */}
          <div className="space-y-2.5">
            {filteredProjects.map((proj) => (
              <div
                key={proj.id}
                className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-[#1565C0] px-2 py-0.5 font-mono text-xs font-bold text-white">
                    #{proj.shortCode}
                  </span>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-600 dark:text-slate-300">
                    <MapPin className="h-3 w-3 text-[#D81B60]" />
                    {proj.standLocation} ({proj.shift})
                  </span>
                </div>

                <h3 className="mt-1.5 font-display text-sm font-bold leading-snug text-slate-900 dark:text-white">
                  {proj.title}
                </h3>
                <p className="mt-1 line-clamp-2 text-xs text-slate-500">
                  {proj.bio}
                </p>

                <div className="mt-2.5 flex flex-wrap gap-1">
                  {proj.tags.map((t) => (
                    <Badge key={t.id} variant="secondary">
                      {t.name}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-2.5">
          {scheduleItems.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-2xs dark:border-slate-800 dark:bg-[#0F172A]"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-[#1565C0] dark:text-[#60A5FA]">
                  {item.dayLabel}
                </span>
                <Badge variant="secondary">{item.category}</Badge>
              </div>
              <h3 className="mt-1 font-display text-sm font-bold text-slate-900 dark:text-white">
                {item.title}
              </h3>
              <p className="mt-0.5 text-xs text-slate-500">
                {item.description}
              </p>
              <div className="mt-2.5 flex items-center gap-3 border-t border-slate-100 pt-2 text-[11px] font-semibold text-slate-700 dark:border-slate-800 dark:text-slate-300">
                <span className="inline-flex items-center gap-1">
                  <Clock className="h-3 w-3 text-[#F57C00]" />
                  {item.timeRange}
                </span>
                <span className="inline-flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-[#D81B60]" />
                  {item.location}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (user) {
    return <AppShell user={user}>{content}</AppShell>;
  }

  return (
    <div className="min-h-dvh bg-slate-200/70 dark:bg-[#050811] flex justify-center">
      <div className="relative flex min-h-dvh w-full max-w-[440px] flex-col bg-background text-foreground shadow-[0_0_50px_rgba(15,23,42,0.15)] md:border-x md:border-slate-200/80 dark:md:border-slate-800/80">
        <div className="h-[3.5px] w-full bg-meta-gradient" />
        <header className="flex items-center justify-between border-b border-slate-200/80 bg-white/95 px-4 py-3 dark:border-slate-800/80 dark:bg-[#0F172A]/95">
          <MetaLogo compact />
          <Link
            href="/login"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#1565C0] px-3 py-1.5 text-xs font-bold text-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            Entrar
          </Link>
        </header>
        <main className="flex-1 px-3.5 py-4">{content}</main>
      </div>
    </div>
  );
}
