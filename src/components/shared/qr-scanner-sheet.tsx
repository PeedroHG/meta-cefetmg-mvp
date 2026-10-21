"use client";

import React, { useState, useEffect, useRef } from "react";
import { Camera, Hash, Sparkles, QrCode, CheckCircle2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export interface QuickPresetOption {
  label: string;
  sublabel: string;
  code: string;
}

interface QrScannerSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  placeholder?: string;
  onCodeSubmit: (code: string) => void;
  presets?: QuickPresetOption[];
}

/**
 * Bottom Sheet / Modal com alternância instantânea entre:
 * [ 📷 Ler QR Code ] e [ 🔢 Digitar Código ]
 * Inclui também simulação instantânea de leitura para demonstração fluida à professora.
 */
export function QrScannerSheet({
  open,
  onOpenChange,
  title,
  description,
  placeholder = "Ex: 4821 ou 849201",
  onCodeSubmit,
  presets = [],
}: QrScannerSheetProps) {
  const [tab, setTab] = useState<"camera" | "manual">("camera");
  const [manualCode, setManualCode] = useState("");
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let stream: MediaStream | null = null;
    if (open && tab === "camera") {
      setCameraError(null);
      if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
        navigator.mediaDevices
          .getUserMedia({ video: { facingMode: "environment" } })
          .then((mediaStream) => {
            stream = mediaStream;
            if (videoRef.current) {
              videoRef.current.srcObject = mediaStream;
            }
          })
          .catch(() => {
            setCameraError(
              "Câmera em modo simulação (sem permissão ou sem webcam). Use os atalhos de simulação abaixo ou digite o código numérico!"
            );
          });
      } else {
        setCameraError("Câmera indisponível neste dispositivo. Use o código numérico.");
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [open, tab]);

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualCode.trim()) return;
    onCodeSubmit(manualCode.trim());
    setManualCode("");
    onOpenChange(false);
  };

  const handlePresetClick = (code: string) => {
    onCodeSubmit(code);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-[#1565C0] dark:text-[#60A5FA]" />
            {title}
          </DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        {/* Alternador Instantâneo Câmera vs Digitar Código */}
        <div className="grid grid-cols-2 gap-1.5 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
          <button
            type="button"
            onClick={() => setTab("camera")}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "camera"
                ? "bg-white text-[#1565C0] shadow-xs dark:bg-slate-900 dark:text-[#60A5FA]"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Camera className="h-4 w-4" />
            Ler QR Code
          </button>
          <button
            type="button"
            onClick={() => setTab("manual")}
            className={`flex min-h-[44px] items-center justify-center gap-2 rounded-lg text-xs font-semibold transition-all ${
              tab === "manual"
                ? "bg-white text-[#1565C0] shadow-xs dark:bg-slate-900 dark:text-[#60A5FA]"
                : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
            }`}
          >
            <Hash className="h-4 w-4" />
            Digitar Código
          </button>
        </div>

        {tab === "camera" ? (
          <div className="space-y-3">
            <div className="relative flex h-56 w-full flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed border-[#1565C0]/40 bg-slate-950 text-white">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 h-full w-full object-cover opacity-65"
              />
              {/* Mira do Scanner */}
              <div className="relative z-10 flex h-36 w-36 flex-col items-center justify-center rounded-2xl border-2 border-[#3B82F6] shadow-[0_0_25px_rgba(59,130,246,0.45)]">
                <div className="h-0.5 w-full animate-pulse bg-[#D81B60]" />
              </div>
              <span className="relative z-10 mt-2 rounded-full bg-slate-900/80 px-3 py-1 text-[11px] font-medium text-slate-200">
                Aponte para o QR Code do estande ou passaporte
              </span>
            </div>

            {cameraError && (
              <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 text-xs text-amber-700 dark:text-amber-300">
                {cameraError}
              </p>
            )}
          </div>
        ) : (
          <form onSubmit={handleManualSubmit} className="space-y-3 pt-1">
            <div>
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400">
                Código Numérico Curto ou Token Temporário
              </label>
              <Input
                value={manualCode}
                onChange={(e) => setManualCode(e.target.value)}
                placeholder={placeholder}
                className="h-14 text-center font-mono text-2xl font-bold tracking-widest"
                autoFocus
              />
            </div>
            <Button type="submit" size="field" className="w-full">
              <CheckCircle2 className="h-4 w-4" />
              Confirmar Código
            </Button>
          </form>
        )}

        {/* Atalhos Rápidos de Simulação para Apresentação à Professora */}
        {presets.length > 0 && (
          <div className="border-t border-slate-200 pt-3 dark:border-slate-800">
            <div className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-slate-600 dark:text-slate-400">
              <Sparkles className="h-3.5 w-3.5 text-[#D81B60]" />
              <span>Simulação Rápida (1 Clique p/ Apresentação):</span>
            </div>
            <div className="grid gap-1.5">
              {presets.map((p) => (
                <button
                  key={p.code}
                  type="button"
                  onClick={() => handlePresetClick(p.code)}
                  className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-left text-xs transition hover:border-[#1565C0] hover:bg-[#1565C0]/5 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-[#3B82F6]"
                >
                  <div>
                    <div className="font-semibold text-slate-900 dark:text-slate-100">
                      {p.label}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400">
                      {p.sublabel}
                    </div>
                  </div>
                  <span className="rounded bg-slate-200 px-2 py-0.5 font-mono text-xs font-bold text-slate-900 dark:bg-slate-800 dark:text-slate-200">
                    #{p.code}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
