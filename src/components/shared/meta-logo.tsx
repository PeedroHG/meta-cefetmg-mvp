import React from "react";
import { cn } from "@/lib/utils";

interface MetaLogoProps {
  className?: string;
  compact?: boolean;
}

export function MetaLogo({ className, compact = false }: MetaLogoProps) {
  return (
    <div className={cn("inline-flex items-center gap-2.5 select-none", className)}>
      {/* Fita Poligonal 3D da 35ª META com Halftone */}
      <svg
        width={compact ? "38" : "46"}
        height={compact ? "28" : "34"}
        viewBox="0 0 120 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="shrink-0"
        aria-label="Logo 35ª META CEFET-MG"
      >
        <defs>
          <pattern
            id="halftone-dots"
            x="0"
            y="0"
            width="6"
            height="6"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="2" cy="2" r="1.15" fill="white" fillOpacity="0.45" />
          </pattern>
        </defs>
        {/* Segmento 1: Navy -> Azul */}
        <polygon points="8,54 28,68 22,36 4,42" fill="#1E3A8A" />
        <polygon points="28,68 10,22 36,12 52,32" fill="#1565C0" />
        {/* Segmento 2: Vinho / Plum */}
        <polygon points="52,14 38,34 52,72 68,54" fill="#6A1B4D" />
        {/* Segmento 3: Magenta */}
        <polygon points="64,18 92,10 82,42 54,68" fill="#D81B60" />
        {/* Segmento 4: Laranja */}
        <polygon points="92,10 112,28 96,64 82,42" fill="#F57C00" />
        {/* Segmento 5: Amarelo */}
        <polygon points="104,48 116,48 114,68 96,64" fill="#FBC02D" />

        {/* Textura Halftone sobre os polígonos */}
        <polygon
          points="8,54 28,68 10,22 36,12 52,14 64,18 92,10 112,28 116,48 114,68 96,64 52,72"
          fill="url(#halftone-dots)"
        />

        {/* Wireframe Poligonal Angular em Slate/Navy */}
        <polyline
          points="6,68 30,66 10,22 52,32 62,76 80,14 96,4"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinejoin="miter"
          className="text-slate-900 dark:text-slate-200"
        />
        <polyline
          points="12,12 52,14 68,66 82,42 110,32 96,68 116,66"
          stroke="currentColor"
          strokeWidth="2.2"
          strokeLinejoin="miter"
          className="text-slate-900 dark:text-slate-200"
        />
      </svg>

      <div className="flex flex-col leading-none">
        <div className="flex items-baseline gap-1">
          <span className="font-display font-bold text-lg md:text-xl tracking-tight text-slate-900 dark:text-slate-50">
            35ª META
          </span>
          <span className="hidden sm:inline-block text-[10px] font-mono font-semibold uppercase px-1.5 py-0.5 rounded bg-slate-200/80 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            CEFET-MG
          </span>
        </div>
        {!compact && (
          <span className="text-[10px] text-slate-500 dark:text-slate-400 font-medium tracking-tight">
            Mostra Específica de Trabalhos e Aplicações
          </span>
        )}
      </div>
    </div>
  );
}
