"use client";

import React, { useState, useEffect, useTransition } from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  Presentation,
  QrCode,
  RefreshCw,
  CheckCircle2,
  Clock,
  Lock,
  Palette,
  PenTool,
  Users,
  ClipboardCheck,
  MapPin,
} from "lucide-react";
import { toast } from "sonner";
import type { ProjectRecord, TagRecord } from "@/db/local-store";
import { generateDynamicStampCode } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { SignatureCanvasBox } from "@/components/shared/signature-canvas-box";
import { MobileBottomNav } from "@/components/shared/mobile-bottom-nav";
import { updateProjectStandByExpositorAction } from "@/features/projects/actions";
import { signProjectAccreditationAction } from "@/features/accreditation/actions";
import { refreshProjectStampTokenAction } from "@/features/passport/actions";

interface ExpositorProject extends ProjectRecord {
  tags: TagRecord[];
  teamMembers: { id: string; name: string; username: string }[];
  assignedEvaluators: {
    id: string;
    name: string;
    hasEvaluated: boolean;
  }[];
  stampsCollectedCount: number;
}

interface ExpositorDashboardViewProps {
  currentUser: { id: string; name: string };
  project: ExpositorProject;
}

type ExpositorTab = "selo" | "banca" | "personalizar" | "equipe";

export function ExpositorDashboardView({
  currentUser,
  project,
}: ExpositorDashboardViewProps) {
  const [activeTab, setActiveTab] = useState<ExpositorTab>("selo");
  const [isPending, startTransition] = useTransition();

  // QR Code Dinâmico de Selo com rotação de 60s
  const [stampToken, setStampToken] = useState(project.activeStampToken);
  const [secondsLeft, setSecondsLeft] = useState(60);

  // Personalização da página pública e selo do estande
  const [bio, setBio] = useState(project.bio);
  const [stampLabel, setStampLabel] = useState(
    project.title.split(":")[0].slice(0, 11)
  );
  const [primaryColor, setPrimaryColor] = useState("#1565C0");
  const [secondaryColor, setSecondaryColor] = useState("#D81B60");

  useEffect(() => {
    const updateTick = () => {
      const info = generateDynamicStampCode(project.id);
      setSecondsLeft(info.secondsRemaining);
    };
    updateTick();
    const timer = setInterval(updateTick, 1000);
    return () => clearInterval(timer);
  }, [project.id]);

  const handleRefreshToken = () => {
    startTransition(async () => {
      const res = await refreshProjectStampTokenAction(project.id);
      if (res.success && res.token) {
        setStampToken(res.token);
        toast.success(`Novo código temporário: #${res.token}`);
      }
    });
  };

  const handleSaveStandCustomization = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await updateProjectStandByExpositorAction({
        projectId: project.id,
        bio,
        stampLabel,
        stampPrimaryColor: primaryColor,
        stampSecondaryColor: secondaryColor,
      });
      if (res.success) {
        toast.success("Página do estande e arte do selo atualizadas!");
      } else {
        toast.error(res.error);
      }
    });
  };

  const handleSignAccreditationOnOwnPhone = (signatureData: string) => {
    startTransition(async () => {
      const res = await signProjectAccreditationAction({
        projectId: project.id,
        signatureData,
        exhibitorUserId: currentUser.id,
      });
      if (res.success) {
        toast.success("Credenciamento assinado! Estande liberado.");
      } else {
        toast.error(res.error);
      }
    });
  };

  const evalDoneCount = project.assignedEvaluators.filter(
    (e) => e.hasEvaluated
  ).length;

  return (
    <div className="space-y-3.5">
      {/* Header Compacto Mobile do Estande Expositor */}
      <div className="rounded-2xl border border-[#1565C0]/25 bg-white p-3.5 shadow-xs dark:border-[#3B82F6]/25 dark:bg-[#0F172A]">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#1565C0]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#1565C0] dark:bg-[#3B82F6]/20 dark:text-[#60A5FA]">
              <Presentation className="h-3 w-3" />
              Estande #{project.shortCode}
            </span>
            {project.isAccredited ? (
              <Badge variant="success">Credenciado</Badge>
            ) : (
              <Badge variant="warning">Check-in Pendente</Badge>
            )}
          </div>
          {project.stampImageUrl && (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={project.stampImageUrl}
              alt="Selo"
              className="h-9 w-9 shrink-0 rounded-full border border-slate-200 shadow-2xs"
            />
          )}
        </div>

        <h1 className="mt-1.5 line-clamp-1 font-display text-sm font-bold text-slate-900 dark:text-white">
          {project.title}
        </h1>

        <div className="mt-1 flex items-center gap-1 text-[11px] text-slate-500">
          <MapPin className="h-3 w-3 shrink-0 text-[#D81B60]" />
          <span className="truncate">
            {project.standLocation} ({project.shift})
          </span>
        </div>

        {/* 2 Pílulas Rápidas de Status */}
        <div className="mt-2.5 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("selo")}
            className="flex items-center justify-between rounded-xl border border-[#1565C0]/20 bg-[#1565C0]/5 px-3 py-1.5 text-left"
          >
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              Selos Emitidos
            </span>
            <span className="font-mono text-sm font-extrabold text-[#1565C0] dark:text-[#60A5FA]">
              {project.stampsCollectedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("banca")}
            className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-left dark:border-slate-800 dark:bg-slate-900"
          >
            <span className="text-[10px] font-semibold text-slate-600 dark:text-slate-300">
              Avaliações
            </span>
            <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-white">
              {evalDoneCount}/{project.assignedEvaluators.length}
            </span>
          </button>
        </div>
      </div>

      {/* Caso a Recepção tenha liberado assinatura no celular do aluno */}
      {!project.isAccredited && project.accreditationUnlocked && (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-50/80 p-3.5 dark:border-amber-700 dark:bg-amber-950/30">
          <div className="flex items-center gap-2 font-display text-xs font-bold text-amber-950 dark:text-amber-200">
            <PenTool className="h-4 w-4 text-amber-600" />
            Check-in Liberado pela Recepção!
          </div>
          <p className="mt-0.5 mb-2.5 text-[11px] text-amber-800 dark:text-amber-300">
            Assine abaixo para confirmar a retirada do kit/banner da equipe:
          </p>
          <SignatureCanvasBox
            confirmLabel="Assinar e Credenciar Estande"
            onSaveSignature={handleSignAccreditationOnOwnPhone}
          />
        </div>
      )}

      {/* =========================================================
          ABA 1: EMISSOR DE SELO QR DINÂMICO (FOCO DE TELA INTEIRA)
         ========================================================= */}
      {activeTab === "selo" && (
        <div className="rounded-2xl border border-[#1565C0]/30 bg-white p-4 text-center shadow-xs dark:border-[#3B82F6]/30 dark:bg-[#0F172A]">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-800 dark:text-slate-100">
              <QrCode className="h-4 w-4 text-[#1565C0]" />
              Selo p/ Visitantes
            </span>
            <span className="rounded-full bg-[#1565C0]/10 px-2.5 py-0.5 font-mono text-[11px] font-bold text-[#1565C0] dark:text-[#60A5FA]">
              Renova em {secondsLeft}s
            </span>
          </div>

          {/* Barra de Contagem Regressiva de 60s */}
          <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div
              className="h-full rounded-full bg-[#1565C0] transition-all duration-1000"
              style={{ width: `${(secondsLeft / 60) * 100}%` }}
            />
          </div>

          <div className="mx-auto my-3.5 flex w-fit flex-col items-center rounded-2xl border-2 border-slate-200 bg-white p-3.5 shadow-xs">
            <QRCodeSVG
              value={stampToken || project.shortCode}
              size={168}
              level="M"
            />
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-900">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
              Token de 6 Dígitos (Digitação Rápida)
            </div>
            <div className="mt-0.5 font-mono text-2xl font-extrabold tracking-widest text-[#1565C0] dark:text-[#60A5FA]">
              {stampToken || project.shortCode}
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isPending}
            onClick={handleRefreshToken}
            className="mt-3 w-full rounded-xl"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Gerar Novo Token Agora
          </Button>
        </div>
      )}

      {/* =========================================================
          ABA 2: STATUS DA BANCA AVALIADORA
         ========================================================= */}
      {activeTab === "banca" && (
        <div className="space-y-2.5">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-sm font-bold">
                Professores Designados
              </h2>
              <Badge variant="default">
                {evalDoneCount}/{project.assignedEvaluators.length} concluídas
              </Badge>
            </div>
            <p className="mt-0.5 text-[11px] text-slate-500">
              Acompanhe quem já avaliou seu estande (as notas são sigilosas).
            </p>

            <div className="mt-3 space-y-2">
              {project.assignedEvaluators.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 p-3 text-xs dark:border-slate-800"
                >
                  <span className="font-semibold text-slate-900 dark:text-slate-100">
                    {ev.name}
                  </span>
                  {ev.hasEvaluated ? (
                    <Badge variant="success">
                      <CheckCircle2 className="h-3 w-3" /> Avaliado
                    </Badge>
                  ) : (
                    <Badge variant="warning">
                      <Clock className="h-3 w-3" /> Aguardando
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 text-center dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="text-[11px] font-semibold text-slate-500">
              Código Fixo para a Banca e Recepção:
            </div>
            <div className="mt-1 font-mono text-2xl font-extrabold text-slate-900 dark:text-white">
              #{project.shortCode}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================
          ABA 3: PERSONALIZAR BIO & ARTE DO SELO
         ========================================================= */}
      {activeTab === "personalizar" && (
        <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
          <div className="flex items-center gap-2">
            <Palette className="h-4 w-4 text-[#D81B60]" />
            <h2 className="font-display text-sm font-bold">
              Customizar Estande & Carimbo
            </h2>
          </div>

          <form
            onSubmit={handleSaveStandCustomization}
            className="mt-3 space-y-3"
          >
            <div>
              <label className="mb-1 block text-xs font-bold">
                Resumo Público do Projeto
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white p-2.5 text-xs focus:outline-none focus:ring-2 focus:ring-[#1565C0] dark:border-slate-800 dark:bg-slate-950"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold">
                Texto no Carimbo (Máx 12 letras)
              </label>
              <Input
                value={stampLabel}
                maxLength={12}
                onChange={(e) => setStampLabel(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Cor Principal
                </label>
                <Input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="h-10 cursor-pointer p-1"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-bold">
                  Cor Secundária
                </label>
                <Input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="h-10 cursor-pointer p-1"
                />
              </div>
            </div>

            <Button
              type="submit"
              size="field"
              disabled={isPending}
              className="w-full rounded-xl"
            >
              Salvar Alterações
            </Button>
          </form>
        </div>
      )}

      {/* =========================================================
          ABA 4: EQUIPE & DADOS SIGAA
         ========================================================= */}
      {activeTab === "equipe" && (
        <div className="space-y-2.5">
          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700 dark:text-slate-300">
              <Lock className="h-3.5 w-3.5 text-slate-400" />
              Integrantes Oficiais (SIGAA)
            </div>
            <div className="mt-2.5 space-y-2">
              {project.teamMembers.map((m) => (
                <div
                  key={m.id}
                  className="flex items-center justify-between rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs dark:border-slate-800 dark:bg-slate-900"
                >
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {m.name}
                  </span>
                  <span className="font-mono text-[10px] text-slate-500">
                    {m.username}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-3.5 dark:border-slate-800 dark:bg-[#0F172A]">
            <div className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Tags de Recomendação do Projeto
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {project.tags.map((t) => (
                <Badge key={t.id} variant="secondary">
                  {t.name}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Bottom Bar Nativa do Expositor */}
      <MobileBottomNav
        tabs={[
          {
            id: "selo",
            label: "Selo QR",
            icon: QrCode,
          },
          {
            id: "banca",
            label: "Banca",
            icon: ClipboardCheck,
            badge: `${evalDoneCount}/${project.assignedEvaluators.length}`,
          },
          {
            id: "personalizar",
            label: "Editar",
            icon: Palette,
          },
          {
            id: "equipe",
            label: "Equipe",
            icon: Users,
          },
        ]}
        activeTab={activeTab}
        onSelectTab={(id) => setActiveTab(id as ExpositorTab)}
        centerAction={{
          label: "Emitir Selo",
          icon: QrCode,
          colorHex: "#1565C0",
          onClick: () => {
            setActiveTab("selo");
            handleRefreshToken();
          },
        }}
        accentColorHex="#1565C0"
      />
    </div>
  );
}
