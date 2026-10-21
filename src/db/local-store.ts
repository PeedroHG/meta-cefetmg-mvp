import fs from "fs";
import path from "path";
import bcrypt from "bcryptjs";
import type { UserRole, MemberRole } from "./schema";

export interface UserRecord {
  id: string;
  username: string;
  name: string;
  passwordHash: string;
  role: UserRole;
  mustChangePassword: boolean;
  tempPasswordHint: string | null;
  isAccredited: boolean;
  accreditationUnlocked: boolean;
  savedSignatureData: string | null;
  accreditationSignature: string | null;
  accreditedAt: string | null;
  onboardingCompleted: boolean;
  visitorShortCode: string | null;
  createdAt: string;
}

export interface ProjectRecord {
  id: string;
  sigaaCode: string;
  shortCode: string;
  title: string;
  standLocation: string;
  shift: "Manhã" | "Tarde" | "Integral";
  bio: string;
  logoUrl: string | null;
  stampImageUrl: string | null;
  isAccredited: boolean;
  accreditationUnlocked: boolean;
  accreditationSignature: string | null;
  accreditedByUserId: string | null;
  accreditedAt: string | null;
  activeStampToken: string | null;
  stampTokenExpiresAt: string | null;
  createdAt: string;
}

export interface TagRecord {
  id: string;
  name: string;
  color: string;
}

export interface ProjectTagRecord {
  id: string;
  projectId: string;
  tagId: string;
}

export interface ProjectMemberRecord {
  id: string;
  projectId: string;
  userId: string;
  memberRole: MemberRole;
}

export interface VisitorInterestRecord {
  id: string;
  visitorId: string;
  tagId: string;
}

export interface EvaluationRecord {
  id: string;
  projectId: string;
  evaluatorId: string;
  scoreLogbook: number;
  scoreRelevance: number;
  scoreMethodology: number;
  scorePresentation: number;
  scoreStand: number;
  totalScore: number;
  feedbackNotes: string;
  signatureData: string;
  createdAt: string;
}

export interface PassportStampRecord {
  id: string;
  visitorId: string;
  projectId: string;
  isSpent: boolean;
  redemptionId: string | null;
  likedProject: boolean;
  collectedAt: string;
}

export interface RewardRecord {
  id: string;
  name: string;
  description: string;
  iconName: string;
  stampCost: number;
  stockQuantity: number;
}

export interface RewardRedemptionRecord {
  id: string;
  visitorId: string;
  rewardId: string;
  collaboratorId: string;
  stampsDebited: number;
  redeemedAt: string;
}

export interface ScheduleItemRecord {
  id: string;
  dayLabel: string;
  timeRange: string;
  title: string;
  location: string;
  category: string;
  description: string;
}

export interface DatabaseState {
  users: UserRecord[];
  projects: ProjectRecord[];
  tags: TagRecord[];
  projectTags: ProjectTagRecord[];
  projectMembers: ProjectMemberRecord[];
  visitorInterests: VisitorInterestRecord[];
  evaluations: EvaluationRecord[];
  passportStamps: PassportStampRecord[];
  rewards: RewardRecord[];
  rewardRedemptions: RewardRedemptionRecord[];
  scheduleItems: ScheduleItemRecord[];
  updatedAt: number;
}

const DATA_DIR = path.join(process.cwd(), ".data");
const DB_FILE = path.join(DATA_DIR, "meta-db.json");

const SAMPLE_PROFESSOR_SIGNATURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="100" viewBox="0 0 320 100"><path d="M22,68 C45,25 65,75 88,42 C102,22 115,65 135,52 C158,38 175,20 190,58 C202,82 225,30 255,44 C272,52 288,38 302,34" fill="none" stroke="#0F172A" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M45,76 L265,64" fill="none" stroke="#1565C0" stroke-width="1.8" stroke-linecap="round"/></svg>`
  );

const SAMPLE_STUDENT_SIGNATURE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="100" viewBox="0 0 320 100"><path d="M35,64 Q60,18 82,58 T130,48 Q155,30 175,62 T230,45 L285,52" fill="none" stroke="#0F172A" stroke-width="3" stroke-linecap="round"/></svg>`
  );

function makeStampSvgDataUrl(label: string, code: string, primaryColor: string, secondaryColor: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="160" height="160" viewBox="0 0 160 160">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${primaryColor}" />
        <stop offset="100%" stop-color="${secondaryColor}" />
      </linearGradient>
    </defs>
    <circle cx="80" cy="80" r="72" fill="url(#g)" stroke="#ffffff" stroke-width="4" stroke-dasharray="6 4"/>
    <circle cx="80" cy="80" r="60" fill="none" stroke="#ffffff" stroke-opacity="0.6" stroke-width="1.5"/>
    <text x="80" y="46" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="10" font-weight="700" letter-spacing="1.5">35ª META • CEFET-MG</text>
    <text x="80" y="86" text-anchor="middle" fill="#ffffff" font-family="sans-serif" font-size="18" font-weight="800">${label}</text>
    <rect x="46" y="102" width="68" height="22" rx="11" fill="#0F172A" fill-opacity="0.35"/>
    <text x="80" y="117" text-anchor="middle" fill="#ffffff" font-family="monospace" font-size="12" font-weight="700">#${code}</text>
  </svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export function createInitialSeedState(): DatabaseState {
  const defaultHash = bcrypt.hashSync("meta2026", 8);
  const nowIso = new Date().toISOString();

  const tags: TagRecord[] = [
    { id: "tag-ia", name: "Inteligência Artificial", color: "#1565C0" },
    { id: "tag-robotica", name: "Robótica & Automação", color: "#1E3A8A" },
    { id: "tag-ml", name: "Machine Learning", color: "#6A1B4D" },
    { id: "tag-ecologia", name: "Ecologia & Sustentabilidade", color: "#10B981" },
    { id: "tag-saude", name: "Saúde & Biotecnologia", color: "#D81B60" },
    { id: "tag-iot", name: "IoT & Cidades Inteligentes", color: "#F57C00" },
    { id: "tag-jogos", name: "Jogos Digitais & Educação", color: "#FBC02D" },
    { id: "tag-energia", name: "Energias Renováveis", color: "#0284C7" },
  ];

  const users: UserRecord[] = [
    {
      id: "user-master-1",
      username: "master@cefetmg.br",
      name: "Profa. Dra. Helena Vasconcelos (Coord. META)",
      passwordHash: defaultHash,
      role: "MASTER",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: SAMPLE_PROFESSOR_SIGNATURE,
      accreditationSignature: SAMPLE_PROFESSOR_SIGNATURE,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-colab-1",
      username: "colaborador@cefetmg.br",
      name: "Lucas Andrade (Recepção & Balcão de Brindes)",
      passwordHash: defaultHash,
      role: "COLABORADOR",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-exp-1",
      username: "pedro.expositor",
      name: "Pedro Henrique Gomes (3º Info - Líder)",
      passwordHash: defaultHash,
      role: "EXPOSITOR",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: SAMPLE_STUDENT_SIGNATURE,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-exp-2",
      username: "mariana.costa",
      name: "Mariana Costa Silva (3º Info)",
      passwordHash: defaultHash,
      role: "EXPOSITOR",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-exp-3",
      username: "gabriel.mecatronica",
      name: "Gabriel Martins (3º Mecatrônica)",
      passwordHash: defaultHash,
      role: "EXPOSITOR",
      mustChangePassword: false,
      tempPasswordHint: "META-4829",
      isAccredited: false,
      accreditationUnlocked: false,
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: null,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-exp-4",
      username: "clara.meioambiente",
      name: "Clara Ribeiro (3º Meio Ambiente)",
      passwordHash: defaultHash,
      role: "EXPOSITOR",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: SAMPLE_STUDENT_SIGNATURE,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-exp-5",
      username: "rafael.eletro",
      name: "Rafael Dorneles (3º Eletrotécnica)",
      passwordHash: defaultHash,
      role: "EXPOSITOR",
      mustChangePassword: true,
      tempPasswordHint: "META-9012",
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: SAMPLE_STUDENT_SIGNATURE,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedAt: nowIso,
      onboardingCompleted: false,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-aval-1",
      username: "avaliador@cefetmg.br",
      name: "Prof. Dr. Marcos Vinícius Ferreira (DECOM)",
      passwordHash: defaultHash,
      role: "AVALIADOR",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: SAMPLE_PROFESSOR_SIGNATURE,
      accreditationSignature: SAMPLE_PROFESSOR_SIGNATURE,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-aval-2",
      username: "profa.camila",
      name: "Profa. Dra. Camila Alvarenga (ENG)",
      passwordHash: defaultHash,
      role: "AVALIADOR",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: SAMPLE_PROFESSOR_SIGNATURE,
      accreditationSignature: SAMPLE_PROFESSOR_SIGNATURE,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-aval-3",
      username: "prof.eduardo",
      name: "Prof. Me. Eduardo Lacerda (DCSF)",
      passwordHash: defaultHash,
      role: "AVALIADOR",
      mustChangePassword: true,
      tempPasswordHint: "AVAL-3510",
      isAccredited: false,
      accreditationUnlocked: false,
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: null,
      onboardingCompleted: false,
      visitorShortCode: null,
      createdAt: nowIso,
    },
    {
      id: "user-vis-1",
      username: "visitante@gmail.com",
      name: "Beatriz Nogueira (Visitante)",
      passwordHash: defaultHash,
      role: "VISITANTE",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: "V-3590",
      createdAt: nowIso,
    },
    {
      id: "user-vis-2",
      username: "joao.visitante@gmail.com",
      name: "João Vitor Almeida (Estudante Visitante)",
      passwordHash: defaultHash,
      role: "VISITANTE",
      mustChangePassword: false,
      tempPasswordHint: null,
      isAccredited: true,
      accreditationUnlocked: true,
      savedSignatureData: null,
      accreditationSignature: null,
      accreditedAt: nowIso,
      onboardingCompleted: true,
      visitorShortCode: "V-7741",
      createdAt: nowIso,
    },
  ];

  const projects: ProjectRecord[] = [
    {
      id: "proj-1",
      sigaaCode: "META2026-INF-014",
      shortCode: "4821",
      title: "NeuroGlove: Luva Robótica com IA Embarcada para Reabilitação Motora Pós-AVC",
      standLocation: "Pátio Central • Bloco A — Estande 12",
      shift: "Manhã",
      bio: "Protótipo de luva sensorial de baixo custo que utiliza sensores flexíveis e modelos de Machine Learning embarcados para auxiliar pacientes em exercícios de fisioterapia neuromotora com feedback em tempo real.",
      logoUrl: null,
      stampImageUrl: makeStampSvgDataUrl("NEUROGLOVE", "4821", "#1565C0", "#D81B60"),
      isAccredited: true,
      accreditationUnlocked: true,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedByUserId: "user-exp-1",
      accreditedAt: nowIso,
      activeStampToken: "849201",
      stampTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: nowIso,
    },
    {
      id: "proj-2",
      sigaaCode: "META2026-AMB-008",
      shortCode: "3109",
      title: "EcoSense Bacia do Arrudas: Rede IoT Autônoma para Monitoramento Hídrico",
      standLocation: "Corredor Cultural • Bloco B — Estande 04",
      shift: "Manhã",
      bio: "Estações flutuantes movidas a energia solar que medem turbidez, pH e oxigênio dissolvido em córregos urbanos de Belo Horizonte, enviando alertas preditivos via LoRaWAN.",
      logoUrl: null,
      stampImageUrl: makeStampSvgDataUrl("ECOSENSE", "3109", "#10B981", "#1565C0"),
      isAccredited: true,
      accreditationUnlocked: true,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedByUserId: "user-exp-4",
      accreditedAt: nowIso,
      activeStampToken: "512094",
      stampTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: nowIso,
    },
    {
      id: "proj-3",
      sigaaCode: "META2026-MEC-022",
      shortCode: "7540",
      title: "AgroBot Cerrado: Rover Autônomo para Detecção Precoce de Pragas Agrícolas",
      standLocation: "Hall Tecnológico • Bloco C — Estande 19",
      shift: "Tarde",
      bio: "Veículo terrestre autônomo com visão computacional capaz de percorrer plantações familiares e identificar deficiências nutricionais nas folhas sem uso excessivo de defensivos.",
      logoUrl: null,
      stampImageUrl: makeStampSvgDataUrl("AGROBOT", "7540", "#F57C00", "#6A1B4D"),
      isAccredited: false,
      accreditationUnlocked: false,
      accreditationSignature: null,
      accreditedByUserId: null,
      accreditedAt: null,
      activeStampToken: "309412",
      stampTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: nowIso,
    },
    {
      id: "proj-4",
      sigaaCode: "META2026-ELE-031",
      shortCode: "6215",
      title: "SolarGrid CEFET: Microinversor Inteligente com Predição de Carga via Redes Neurais",
      standLocation: "Pátio Central • Bloco A — Estande 07",
      shift: "Integral",
      bio: "Sistema integrado de gestão energética para os laboratórios do Campus Nova Suíça, otimizando o despacho de placas fotovoltaicas e bancos de baterias de segunda vida.",
      logoUrl: null,
      stampImageUrl: makeStampSvgDataUrl("SOLARGRID", "6215", "#0284C7", "#F57C00"),
      isAccredited: true,
      accreditationUnlocked: true,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedByUserId: "user-exp-5",
      accreditedAt: nowIso,
      activeStampToken: "994120",
      stampTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: nowIso,
    },
    {
      id: "proj-5",
      sigaaCode: "META2026-INF-045",
      shortCode: "1984",
      title: "LudiMath VR: Gamificação Inclusiva para Ensino de Geometria Espacial com LIBRAS",
      standLocation: "Auditório Anexo • Bloco D — Estande 02",
      shift: "Tarde",
      bio: "Jogo educacional 3D com suporte bilíngue (Português/LIBRAS) que auxilia estudantes do ensino médio na visualização de sólidos geométricos e poliedros.",
      logoUrl: null,
      stampImageUrl: makeStampSvgDataUrl("LUDIMATH", "1984", "#6A1B4D", "#D81B60"),
      isAccredited: true,
      accreditationUnlocked: true,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedByUserId: "user-exp-2",
      accreditedAt: nowIso,
      activeStampToken: "741852",
      stampTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: nowIso,
    },
    {
      id: "proj-6",
      sigaaCode: "META2026-BIO-019",
      shortCode: "5302",
      title: "BioPlast Minas: Biofilme Biodegradável a partir de Resíduos da Casca do Café",
      standLocation: "Corredor Cultural • Bloco B — Estande 11",
      shift: "Manhã",
      bio: "Desenvolvimento de embalagens sustentáveis utilizando subprodutos da cafeicultura mineira, reduzindo em 85% o tempo de decomposição em comparação ao plástico convencional.",
      logoUrl: null,
      stampImageUrl: makeStampSvgDataUrl("BIOPLAST", "5302", "#D81B60", "#F57C00"),
      isAccredited: true,
      accreditationUnlocked: true,
      accreditationSignature: SAMPLE_STUDENT_SIGNATURE,
      accreditedByUserId: "user-exp-4",
      accreditedAt: nowIso,
      activeStampToken: "663108",
      stampTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      createdAt: nowIso,
    },
  ];

  const projectTags: ProjectTagRecord[] = [
    { id: "pt-1", projectId: "proj-1", tagId: "tag-ia" },
    { id: "pt-2", projectId: "proj-1", tagId: "tag-robotica" },
    { id: "pt-3", projectId: "proj-1", tagId: "tag-ml" },
    { id: "pt-4", projectId: "proj-1", tagId: "tag-saude" },
    { id: "pt-5", projectId: "proj-2", tagId: "tag-ecologia" },
    { id: "pt-6", projectId: "proj-2", tagId: "tag-iot" },
    { id: "pt-7", projectId: "proj-3", tagId: "tag-robotica" },
    { id: "pt-8", projectId: "proj-3", tagId: "tag-ia" },
    { id: "pt-9", projectId: "proj-3", tagId: "tag-ecologia" },
    { id: "pt-10", projectId: "proj-4", tagId: "tag-energia" },
    { id: "pt-11", projectId: "proj-4", tagId: "tag-ml" },
    { id: "pt-12", projectId: "proj-4", tagId: "tag-iot" },
    { id: "pt-13", projectId: "proj-5", tagId: "tag-jogos" },
    { id: "pt-14", projectId: "proj-5", tagId: "tag-ia" },
    { id: "pt-15", projectId: "proj-6", tagId: "tag-ecologia" },
    { id: "pt-16", projectId: "proj-6", tagId: "tag-saude" },
  ];

  const projectMembers: ProjectMemberRecord[] = [
    // Proj 1: NeuroGlove
    { id: "pm-1", projectId: "proj-1", userId: "user-exp-1", memberRole: "EXPOSITOR" },
    { id: "pm-2", projectId: "proj-1", userId: "user-exp-2", memberRole: "EXPOSITOR" },
    { id: "pm-3", projectId: "proj-1", userId: "user-aval-1", memberRole: "AVALIADOR" },
    { id: "pm-4", projectId: "proj-1", userId: "user-aval-2", memberRole: "AVALIADOR" },
    { id: "pm-5", projectId: "proj-1", userId: "user-aval-3", memberRole: "AVALIADOR" },
    // Proj 2: EcoSense
    { id: "pm-6", projectId: "proj-2", userId: "user-exp-4", memberRole: "EXPOSITOR" },
    { id: "pm-7", projectId: "proj-2", userId: "user-aval-1", memberRole: "AVALIADOR" },
    { id: "pm-8", projectId: "proj-2", userId: "user-aval-2", memberRole: "AVALIADOR" },
    // Proj 3: AgroBot (Não credenciado ainda para demonstrar o credenciamento na hora!)
    { id: "pm-9", projectId: "proj-3", userId: "user-exp-3", memberRole: "EXPOSITOR" },
    { id: "pm-10", projectId: "proj-3", userId: "user-aval-1", memberRole: "AVALIADOR" },
    { id: "pm-11", projectId: "proj-3", userId: "user-aval-3", memberRole: "AVALIADOR" },
    // Proj 4: SolarGrid
    { id: "pm-12", projectId: "proj-4", userId: "user-exp-5", memberRole: "EXPOSITOR" },
    { id: "pm-13", projectId: "proj-4", userId: "user-aval-1", memberRole: "AVALIADOR" },
    { id: "pm-14", projectId: "proj-4", userId: "user-aval-2", memberRole: "AVALIADOR" },
    // Proj 5: LudiMath
    { id: "pm-15", projectId: "proj-5", userId: "user-exp-2", memberRole: "EXPOSITOR" },
    { id: "pm-16", projectId: "proj-5", userId: "user-aval-1", memberRole: "AVALIADOR" },
    { id: "pm-17", projectId: "proj-5", userId: "user-aval-2", memberRole: "AVALIADOR" },
    // Proj 6: BioPlast
    { id: "pm-18", projectId: "proj-6", userId: "user-exp-4", memberRole: "EXPOSITOR" },
    { id: "pm-19", projectId: "proj-6", userId: "user-aval-2", memberRole: "AVALIADOR" },
  ];

  const visitorInterests: VisitorInterestRecord[] = [
    { id: "vi-1", visitorId: "user-vis-1", tagId: "tag-ia" },
    { id: "vi-2", visitorId: "user-vis-1", tagId: "tag-robotica" },
    { id: "vi-3", visitorId: "user-vis-1", tagId: "tag-ml" },
    { id: "vi-4", visitorId: "user-vis-1", tagId: "tag-jogos" },
  ];

  // Profa. Camila já avaliou o Proj 1 (NeuroGlove) e Proj 2 (EcoSense), enquanto Prof. Marcos (Avaliador padrão do Demo) já avaliou o Proj 2 mas falta avaliar o Proj 1 (NeuroGlove) e Proj 4 (SolarGrid)!
  const evaluations: EvaluationRecord[] = [
    {
      id: "eval-1",
      projectId: "proj-1",
      evaluatorId: "user-aval-2",
      scoreLogbook: 5,
      scoreRelevance: 5,
      scoreMethodology: 5,
      scorePresentation: 5,
      scoreStand: 4,
      totalScore: 24,
      feedbackNotes: "Excelente domínio técnico da equipe e protótipo funcional impressionante. Diário de bordo muito bem documentado.",
      signatureData: SAMPLE_PROFESSOR_SIGNATURE,
      createdAt: new Date(Date.now() - 3600 * 1000).toISOString(),
    },
    {
      id: "eval-2",
      projectId: "proj-2",
      evaluatorId: "user-aval-1",
      scoreLogbook: 5,
      scoreRelevance: 5,
      scoreMethodology: 4,
      scorePresentation: 5,
      scoreStand: 5,
      totalScore: 24,
      feedbackNotes: "Aplicação direta para os recursos hídricos de BH. Ótima demonstração da telemetria LoRa.",
      signatureData: SAMPLE_PROFESSOR_SIGNATURE,
      createdAt: new Date(Date.now() - 5400 * 1000).toISOString(),
    },
    {
      id: "eval-3",
      projectId: "proj-2",
      evaluatorId: "user-aval-2",
      scoreLogbook: 4,
      scoreRelevance: 5,
      scoreMethodology: 4,
      scorePresentation: 5,
      scoreStand: 4,
      totalScore: 22,
      feedbackNotes: "Projeto muito relevante e bem apresentado.",
      signatureData: SAMPLE_PROFESSOR_SIGNATURE,
      createdAt: new Date(Date.now() - 4000 * 1000).toISOString(),
    },
    {
      id: "eval-4",
      projectId: "proj-6",
      evaluatorId: "user-aval-2",
      scoreLogbook: 5,
      scoreRelevance: 5,
      scoreMethodology: 5,
      scorePresentation: 4,
      scoreStand: 5,
      totalScore: 24,
      feedbackNotes: "Amostras de biofilme muito bem caracterizadas em laboratório.",
      signatureData: SAMPLE_PROFESSOR_SIGNATURE,
      createdAt: new Date(Date.now() - 2500 * 1000).toISOString(),
    },
  ];

  // Beatriz (Visitante Demo) tem 5 selos na carteira:
  // - 2 selos JÁ GASTOS em um Adesivo Holográfico (aparecem em Preto e Branco com carimbo "TROCA REALIZADA")
  // - 3 selos COLORIDOS DISPONÍVEIS (e ela pode escanear o NeuroGlove #4821 ao vivo para ganhar o 4º selo!)
  const passportStamps: PassportStampRecord[] = [
    {
      id: "stamp-1",
      visitorId: "user-vis-1",
      projectId: "proj-2",
      isSpent: true,
      redemptionId: "redemp-1",
      likedProject: true,
      collectedAt: new Date(Date.now() - 7200 * 1000).toISOString(),
    },
    {
      id: "stamp-2",
      visitorId: "user-vis-1",
      projectId: "proj-6",
      isSpent: true,
      redemptionId: "redemp-1",
      likedProject: true,
      collectedAt: new Date(Date.now() - 6800 * 1000).toISOString(),
    },
    {
      id: "stamp-3",
      visitorId: "user-vis-1",
      projectId: "proj-4",
      isSpent: false,
      redemptionId: null,
      likedProject: true,
      collectedAt: new Date(Date.now() - 3200 * 1000).toISOString(),
    },
    {
      id: "stamp-4",
      visitorId: "user-vis-1",
      projectId: "proj-5",
      isSpent: false,
      redemptionId: null,
      likedProject: true,
      collectedAt: new Date(Date.now() - 1800 * 1000).toISOString(),
    },
    {
      id: "stamp-5",
      visitorId: "user-vis-2",
      projectId: "proj-1",
      isSpent: false,
      redemptionId: null,
      likedProject: true,
      collectedAt: new Date(Date.now() - 1200 * 1000).toISOString(),
    },
  ];

  const rewards: RewardRecord[] = [
    {
      id: "rew-1",
      name: "Pack Adesivos Holográficos 35ª META",
      description: "Kit com 3 adesivos vinílicos resistentes à água com a fita geométrica da 35ª META.",
      iconName: "Sparkles",
      stampCost: 2,
      stockQuantity: 140,
    },
    {
      id: "rew-2",
      name: "Botton Metálico Colecionável CEFET-MG",
      description: "Botton oficial da 35ª Mostra Específica de Trabalhos e Aplicações.",
      iconName: "Award",
      stampCost: 3,
      stockQuantity: 85,
    },
    {
      id: "rew-3",
      name: "Chaveiro Acrílico Geométrico 35ª META",
      description: "Chaveiro cortado a laser com o polígono oficial da mostra.",
      iconName: "Key",
      stampCost: 5,
      stockQuantity: 45,
    },
    {
      id: "rew-4",
      name: "Livro Edições CEFET-MG / Caderno Sketch",
      description: "Publicação acadêmica ou caderno pontilhado exclusivo para pesquisadores.",
      iconName: "BookOpen",
      stampCost: 8,
      stockQuantity: 20,
    },
  ];

  const rewardRedemptions: RewardRedemptionRecord[] = [
    {
      id: "redemp-1",
      visitorId: "user-vis-1",
      rewardId: "rew-1",
      collaboratorId: "user-colab-1",
      stampsDebited: 2,
      redeemedAt: new Date(Date.now() - 5000 * 1000).toISOString(),
    },
  ];

  const scheduleItems: ScheduleItemRecord[] = [
    {
      id: "sched-1",
      dayLabel: "Dia 1 • Quarta-feira (21/10)",
      timeRange: "08:00 — 09:30",
      title: "Credenciamento das Equipes Expositoras e Retirada de Kits/Banners",
      location: "Recepção Central — Hall do Campus I (Nova Suíça)",
      category: "Credenciamento",
      description: "Entrega de crachás, kits e assinatura digital do termo de presença pelas equipes e avaliadores.",
    },
    {
      id: "sched-2",
      dayLabel: "Dia 1 • Quarta-feira (21/10)",
      timeRange: "09:30 — 10:30",
      title: "Cerimônia Oficial de Abertura da 35ª META",
      location: "Auditório Principal — Campus I",
      category: "Solenidade",
      description: "Mesa de abertura com a Diretoria Geral, Diretoria de Pesquisa e Pós-Graduação e Comissão Organizadora.",
    },
    {
      id: "sched-3",
      dayLabel: "Dia 1 • Quarta-feira (21/10)",
      timeRange: "10:30 — 12:30",
      title: "Visitação Pública & Rodada de Avaliação — Turno Manhã",
      location: "Pátio Central e Corredores dos Blocos A, B, C e D",
      category: "Mostra de Estandes",
      description: "Apresentação dos projetos científicos e tecnológicos, coleta de selos no Passaporte Digital e avaliação pelas bancas.",
    },
    {
      id: "sched-4",
      dayLabel: "Dia 1 • Quarta-feira (21/10)",
      timeRange: "14:00 — 17:30",
      title: "Visitação Pública, Troca de Brindes & Avaliação — Turno Tarde",
      location: "Pátio Central e Balcão Passaporte META",
      category: "Mostra de Estandes",
      description: "Sessão vespertina de apresentação de protótipos e funcionamento do Balcão de Brindes do Passaporte META.",
    },
    {
      id: "sched-5",
      dayLabel: "Dia 2 • Quinta-feira (22/10)",
      timeRange: "16:30 — 18:30",
      title: "Encerramento e Premiação Oficial + Voto Popular 35ª META",
      location: "Auditório Principal — Campus I",
      category: "Premiação",
      description: "Divulgação dos trabalhos destaques avaliados pelas bancas e entrega do troféu Voto Popular.",
    },
  ];

  return {
    users,
    projects,
    tags,
    projectTags,
    projectMembers,
    visitorInterests,
    evaluations,
    passportStamps,
    rewards,
    rewardRedemptions,
    scheduleItems,
    updatedAt: Date.now(),
  };
}

export function readDb(): DatabaseState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initial = createInitialSeedState();
      fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2), "utf-8");
      return initial;
    }
    const raw = fs.readFileSync(DB_FILE, "utf-8");
    return JSON.parse(raw) as DatabaseState;
  } catch {
    return createInitialSeedState();
  }
}

export function writeDb(state: DatabaseState): DatabaseState {
  state.updatedAt = Date.now();
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  fs.writeFileSync(DB_FILE, JSON.stringify(state, null, 2), "utf-8");
  return state;
}

export function mutateDb<T>(mutator: (state: DatabaseState) => T): T {
  const state = readDb();
  const result = mutator(state);
  writeDb(state);
  return result;
}

export function resetDbToSeed(): DatabaseState {
  const initial = createInitialSeedState();
  return writeDb(initial);
}
