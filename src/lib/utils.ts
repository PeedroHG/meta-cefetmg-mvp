import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { UserRole } from "@/db/schema";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const ROLE_META_CONFIG: Record<
  UserRole,
  {
    label: string;
    shortLabel: string;
    colorHex: string;
    badgeClass: string;
    borderClass: string;
    bgSoftClass: string;
    textClass: string;
    defaultRoute: string;
  }
> = {
  MASTER: {
    label: "Organizador Master",
    shortLabel: "Master",
    colorHex: "#6A1B4D",
    badgeClass:
      "bg-[#6A1B4D] text-white dark:bg-[#9D2B73] dark:text-white",
    borderClass: "border-[#6A1B4D]/30 dark:border-[#9D2B73]/40",
    bgSoftClass: "bg-[#6A1B4D]/10 dark:bg-[#9D2B73]/15",
    textClass: "text-[#6A1B4D] dark:text-[#E879F9]",
    defaultRoute: "/master",
  },
  COLABORADOR: {
    label: "Colaborador Operacional",
    shortLabel: "Colaborador",
    colorHex: "#F57C00",
    badgeClass:
      "bg-[#F57C00] text-white dark:bg-[#FB923C] dark:text-slate-950",
    borderClass: "border-[#F57C00]/30 dark:border-[#FB923C]/40",
    bgSoftClass: "bg-[#F57C00]/10 dark:bg-[#FB923C]/15",
    textClass: "text-[#D97706] dark:text-[#FB923C]",
    defaultRoute: "/colaborador",
  },
  EXPOSITOR: {
    label: "Expositor de Projeto",
    shortLabel: "Expositor",
    colorHex: "#1565C0",
    badgeClass:
      "bg-[#1565C0] text-white dark:bg-[#3B82F6] dark:text-white",
    borderClass: "border-[#1565C0]/30 dark:border-[#3B82F6]/40",
    bgSoftClass: "bg-[#1565C0]/10 dark:bg-[#3B82F6]/15",
    textClass: "text-[#1565C0] dark:text-[#60A5FA]",
    defaultRoute: "/expositor",
  },
  AVALIADOR: {
    label: "Avaliador Oficial",
    shortLabel: "Avaliador",
    colorHex: "#1E3A8A",
    badgeClass:
      "bg-[#1E3A8A] text-white dark:bg-[#6366F1] dark:text-white",
    borderClass: "border-[#1E3A8A]/30 dark:border-[#6366F1]/40",
    bgSoftClass: "bg-[#1E3A8A]/10 dark:bg-[#6366F1]/15",
    textClass: "text-[#1E3A8A] dark:text-[#818CF8]",
    defaultRoute: "/avaliador",
  },
  VISITANTE: {
    label: "Visitante (Passaporte META)",
    shortLabel: "Visitante",
    colorHex: "#D81B60",
    badgeClass:
      "bg-[#D81B60] text-white dark:bg-[#EC4899] dark:text-white",
    borderClass: "border-[#D81B60]/30 dark:border-[#EC4899]/40",
    bgSoftClass: "bg-[#D81B60]/10 dark:bg-[#EC4899]/15",
    textClass: "text-[#D81B60] dark:text-[#F472B6]",
    defaultRoute: "/visitante",
  },
};

export function generateDynamicStampCode(projectId: string, windowSeconds = 60): {
  code: string;
  secondsRemaining: number;
} {
  const nowSec = Math.floor(Date.now() / 1000);
  const bucket = Math.floor(nowSec / windowSeconds);
  const secondsRemaining = windowSeconds - (nowSec % windowSeconds);
  let hash = 2166136261;
  const input = `${projectId}:meta35:${bucket}`;
  for (let i = 0; i < input.length; i++) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  const num = Math.abs(hash) % 900000 + 100000;
  return {
    code: String(num),
    secondsRemaining,
  };
}
