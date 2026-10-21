"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  CalendarDays,
  Clock,
  MapPin,
  Search,
  LogIn,
  Users,
  CheckCircle2,
} from "lucide-react";
import type {
  ProjectRecord,
  ScheduleItemRecord,
  TagRecord,
} from "@/db/local-store";
import type { UserRole } from "@/db/schema";
import { AppShell } from "@/components/shared/app-shell";
import { MetaLogo } from "@/components/shared/meta-logo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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

  const content = (
    <div className="space-y-8">
      {/* Banner Topo */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs dark:border-slate-800 dark:bg-[#0F172A] bg-meta-halftone">
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
          <div>
            <Badge variant="default" className="mb-2">
              Programação Oficial • Campus Nova Suíça
            </Badge>
            <h1 className="font-display text-2xl font-bold sm:text-3xl text-slate-900 dark:text-white">
              Cronograma & Catálogo de Estandes — 35ª META
            </h1>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
              Consulte os horários das sessões, localização dos blocos e todos os trabalhos científicos e tecnológicos expostos.
            </p>
          </div>
          {!user && (
            <Link
              href="/login"
              className="inline-flex h-11 items-center gap-2 rounded-lg bg-[#1565C0] px-5 text-sm font-semibold text-white shadow-xs hover:bg-[#1565C0]/90"
            >
              <LogIn className="h-4 w-4" />
              Entrar / Criar Passaporte
            </Link>
          )}
        </div>
      </div>

      {/* Seção 1: Cronograma Oficial */}
      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-[#1565C0]" />
          <h2 className="font-display text-xl font-bold">
            Cronograma de Atividades
          </h2>
        </div>

        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
          {scheduleItems.map((item) => (
            <Card key={item.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-[#1565C0] dark:text-[#60A5FA]">
                    {item.dayLabel}
                  </span>
                  <Badge variant="secondary">{item.category}</Badge>
                </div>
                <CardTitle className="mt-1 text-base">{item.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <p>{item.description}</p>
                <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 font-medium text-slate-700 dark:text-slate-300">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3.5 w-3.5 text-[#F57C00]" />
                    {item.timeRange}
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5 text-[#D81B60]" />
                    {item.location}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Seção 2: Catálogo Público de Projetos e Estandes */}
      <section className="space-y-4">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="font-display text-xl font-bold">
              Catálogo Completo de Estandes ({filteredProjects.length})
            </h2>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Pesquise por título, código curto de 4 dígitos, bloco ou filtre por área temática.
            </p>
          </div>
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-3.5 h-4 w-4 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar projeto, #4821 ou bloco..."
              className="pl-9"
            />
          </div>
        </div>

        {/* Filtro de Pílulas de Tags */}
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => setSelectedTag("ALL")}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
              selectedTag === "ALL"
                ? "bg-slate-900 text-white dark:bg-white dark:text-slate-950"
                : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
            }`}
          >
            Todas as Áreas ({projects.length})
          </button>
          {tags.map((tag) => (
            <button
              key={tag.id}
              type="button"
              onClick={() => setSelectedTag(tag.id)}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                selectedTag === tag.id
                  ? "bg-[#1565C0] text-white"
                  : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-100 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              }`}
            >
              {tag.name}
            </button>
          ))}
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card key={project.id} className="flex flex-col justify-between">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="rounded-md bg-slate-100 px-2.5 py-1 font-mono text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-100">
                    #{project.shortCode}
                  </span>
                  {project.isAccredited ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Estande Ativo
                    </Badge>
                  ) : (
                    <Badge variant="warning">Aguardando Montagem</Badge>
                  )}
                </div>
                <CardTitle className="mt-2 text-base">{project.title}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-xs">
                <p className="text-slate-600 dark:text-slate-400 line-clamp-3">
                  {project.bio}
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.tags.map((t) => (
                    <span
                      key={t.id}
                      className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[11px] font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
                <div className="space-y-1 border-t border-slate-100 pt-2.5 text-slate-600 dark:border-slate-800 dark:text-slate-400">
                  <div className="flex items-center gap-1.5 font-medium text-slate-800 dark:text-slate-200">
                    <MapPin className="h-3.5 w-3.5 text-[#D81B60]" />
                    <span>
                      {project.standLocation} ({project.shift})
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Users className="h-3.5 w-3.5 text-[#1565C0]" />
                    <span className="truncate">
                      {project.expositores.join(", ")}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );

  if (user) {
    return <AppShell user={user}>{content}</AppShell>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="h-1 w-full bg-meta-gradient" />
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0F172A]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <Link href="/login">
            <MetaLogo />
          </Link>
          <Link
            href="/login"
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-[#1565C0] px-4 text-xs font-semibold text-white"
          >
            <LogIn className="h-3.5 w-3.5" />
            Entrar
          </Link>
        </div>
      </header>
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">{content}</main>
    </div>
  );
}
