"use client";

import React from "react";
import type { LucideIcon } from "lucide-react";

export interface MobileTabItem {
  id: string;
  label: string;
  icon: LucideIcon;
  badge?: string | number;
}

export interface MobileCenterAction {
  label: string;
  icon: LucideIcon;
  onClick: () => void;
  colorHex: string;
  pulse?: boolean;
}

interface MobileBottomNavProps {
  tabs: [MobileTabItem, MobileTabItem, MobileTabItem, MobileTabItem];
  activeTab: string;
  onSelectTab: (id: string) => void;
  centerAction: MobileCenterAction;
  accentColorHex: string;
}

export function MobileBottomNav({
  tabs,
  activeTab,
  onSelectTab,
  centerAction,
  accentColorHex,
}: MobileBottomNavProps) {
  const CenterIcon = centerAction.icon;
  const leftTabs = tabs.slice(0, 2);
  const rightTabs = tabs.slice(2, 4);

  return (
    <nav className="no-print fixed bottom-0 left-1/2 z-40 w-full max-w-[440px] -translate-x-1/2 border-t border-slate-200/90 bg-white/95 px-2 pb-1.5 pt-1 backdrop-blur-lg dark:border-slate-800/90 dark:bg-[#0F172A]/95 shadow-[0_-8px_24px_rgba(15,23,42,0.08)]">
      <div className="grid grid-cols-5 items-end">
        {/* 2 Abas da Esquerda */}
        {leftTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className="group relative flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all active:scale-95"
            >
              <div className="relative flex h-7 w-11 items-center justify-center rounded-full transition-colors">
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full opacity-15"
                    style={{ backgroundColor: accentColorHex }}
                  />
                )}
                <Icon
                  className={`h-[19px] w-[19px] transition-transform ${
                    isActive
                      ? "scale-105 stroke-[2.4px]"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                  style={isActive ? { color: accentColorHex } : undefined}
                />
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: accentColorHex }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight transition-colors ${
                  isActive
                    ? "font-bold text-slate-900 dark:text-white"
                    : "font-medium text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}

        {/* Botão Central Elevado (FAB Principal do Perfil) — 48x48px real (h-12 w-12) */}
        <div className="flex flex-col items-center justify-end pb-1.5">
          <button
            type="button"
            onClick={centerAction.onClick}
            className="group relative -mt-6 flex h-12 w-12 items-center justify-center rounded-2xl text-white shadow-lg ring-4 ring-white transition-transform active:scale-90 dark:ring-[#0F172A]"
            style={{
              backgroundColor: centerAction.colorHex,
              boxShadow: `0 8px 20px -4px ${centerAction.colorHex}85`,
            }}
          >
            <CenterIcon className="h-5 w-5 stroke-[2.4px]" />
            <span className="sr-only">{centerAction.label}</span>
          </button>
          <span className="mt-0.5 text-[10px] font-bold tracking-tight text-slate-800 dark:text-slate-200">
            {centerAction.label}
          </span>
        </div>

        {/* 2 Abas da Direita */}
        {rightTabs.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className="group relative flex flex-col items-center justify-center gap-0.5 py-1.5 transition-all active:scale-95"
            >
              <div className="relative flex h-7 w-11 items-center justify-center rounded-full transition-colors">
                {isActive && (
                  <span
                    className="absolute inset-0 rounded-full opacity-15"
                    style={{ backgroundColor: accentColorHex }}
                  />
                )}
                <Icon
                  className={`h-[19px] w-[19px] transition-transform ${
                    isActive
                      ? "scale-105 stroke-[2.4px]"
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                  style={isActive ? { color: accentColorHex } : undefined}
                />
                {item.badge !== undefined && Number(item.badge) > 0 && (
                  <span
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 font-mono text-[9px] font-bold text-white shadow-xs"
                    style={{ backgroundColor: accentColorHex }}
                  >
                    {item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] tracking-tight transition-colors ${
                  isActive
                    ? "font-bold text-slate-900 dark:text-white"
                    : "font-medium text-slate-500 dark:text-slate-400"
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
