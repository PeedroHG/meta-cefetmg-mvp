"use client";

import React, { useRef, useEffect, useState, useCallback } from "react";
import { Eraser, Check, PenTool } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SignatureCanvasBoxProps {
  onSaveSignature: (dataUrl: string) => void;
  initialSignature?: string | null;
  confirmLabel?: string;
  height?: number;
}

/**
 * Canvas de Assinatura Digital da 35ª META.
 * REGRA VISUAL ESTRITA: Sempre fundo Papel Claro (#F8FAFC) e traço Navy/Slate Escuro (#0F172A),
 * mesmo quando o usuário está em Dark Mode, garantindo fidelidade documental e impressão limpa.
 */
export function SignatureCanvasBox({
  onSaveSignature,
  initialSignature,
  confirmLabel = "Confirmar Assinatura Digital",
  height = 170,
}: SignatureCanvasBoxProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasStrokes, setHasStrokes] = useState(false);
  const [useSavedMode, setUseSavedMode] = useState<boolean>(!!initialSignature);

  const setupCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    canvas.width = rect.width * dpr;
    canvas.height = height * dpr;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.scale(dpr, dpr);
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#0F172A"; // Tinta Azul Marinho/Preto documental
    ctx.lineWidth = 2.8;
  }, [height]);

  useEffect(() => {
    if (!useSavedMode) {
      setupCanvas();
      window.addEventListener("resize", setupCanvas);
      return () => window.removeEventListener("resize", setupCanvas);
    }
  }, [useSavedMode, setupCanvas]);

  const getCoordinates = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    if ("touches" in e) {
      const touch = e.touches[0] || e.changedTouches[0];
      return {
        x: touch.clientX - rect.left,
        y: touch.clientY - rect.top,
      };
    }
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const startDrawing = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
    setHasStrokes(true);
  };

  const draw = (
    e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>
  ) => {
    if (!isDrawing) return;
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasStrokes(false);
  };

  const handleConfirm = () => {
    if (useSavedMode && initialSignature) {
      onSaveSignature(initialSignature);
      return;
    }
    const canvas = canvasRef.current;
    if (!canvas || !hasStrokes) return;
    const dataUrl = canvas.toDataURL("image/png");
    onSaveSignature(dataUrl);
  };

  return (
    <div className="space-y-3">
      {initialSignature && (
        <div className="flex items-center justify-between gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900">
          <span className="font-medium text-slate-700 dark:text-slate-300">
            {useSavedMode
              ? "Usando sua assinatura digital salva no 1º acesso"
              : "Desenhando nova assinatura manual"}
          </span>
          <button
            type="button"
            onClick={() => setUseSavedMode(!useSavedMode)}
            className="font-semibold text-[#1565C0] hover:underline dark:text-[#60A5FA]"
          >
            {useSavedMode ? "Redesenhar na hora" : "Usar assinatura salva"}
          </button>
        </div>
      )}

      {useSavedMode && initialSignature ? (
        <div className="relative flex flex-col items-center justify-center rounded-xl border-2 border-slate-300 bg-[#F8FAFC] p-4 shadow-inner">
          <span className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            Assinatura Registrada no Perfil — Papel Oficial (#F8FAFC)
          </span>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={initialSignature}
            alt="Assinatura Digital Salva"
            className="h-24 object-contain"
          />
          <div className="mt-2 w-4/5 border-b border-dashed border-slate-400" />
          <span className="mt-1 text-[11px] text-slate-500">
            Assinatura Digital Verificada • 35ª META CEFET-MG
          </span>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-xl border-2 border-slate-300 bg-[#F8FAFC] shadow-inner">
          <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-3 py-1.5 text-[11px] font-medium text-slate-600">
            <span className="inline-flex items-center gap-1.5">
              <PenTool className="h-3.5 w-3.5 text-[#1565C0]" />
              Assine com o dedo ou mouse sobre o papel claro
            </span>
            <button
              type="button"
              onClick={clearCanvas}
              className="inline-flex items-center gap-1 rounded px-2 py-0.5 text-xs font-semibold text-slate-700 hover:bg-slate-200"
            >
              <Eraser className="h-3.5 w-3.5" />
              Limpar
            </button>
          </div>

          <div className="relative">
            <canvas
              ref={canvasRef}
              style={{ height: `${height}px` }}
              className="w-full touch-none cursor-crosshair bg-[#F8FAFC]"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawing}
              onTouchStart={startDrawing}
              onTouchMove={draw}
              onTouchEnd={stopDrawing}
            />
            {/* Linha Guia Documental */}
            <div className="pointer-events-none absolute inset-x-8 bottom-7 border-b border-dashed border-[#CBD5E1]" />
            <span className="pointer-events-none absolute inset-x-0 bottom-2 text-center text-[10px] font-medium uppercase tracking-widest text-slate-400">
              Assinatura do Participante • 35ª META
            </span>
          </div>
        </div>
      )}

      <Button
        type="button"
        size="field"
        onClick={handleConfirm}
        disabled={!useSavedMode && !hasStrokes}
        className="w-full"
      >
        <Check className="h-4 w-4" />
        {confirmLabel}
      </Button>
    </div>
  );
}
