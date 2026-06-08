import { Timestamp } from "firebase/firestore";

export enum FeedbackType {
  SUGESTAO = "sugestao",
  CRITICA = "critica",
  DENUNCIA = "denuncia"
}

export enum FeedbackStatus {
  PENDENTE = "pendente",
  EM_ANALISE = "em_analise",
  RESOLVIDO = "resolvido",
  ARQUIVADO = "arquivado"
}

export enum UrgencyLevel {
  BAIXA = "baixa",
  MEDIA = "media",
  ALTA = "alta",
  CRITICA = "critica"
}

export interface Feedback {
  id: string; // Document ID
  trackingCode: string; // WF-XXXX-YYYY readable code
  type: FeedbackType;
  category: string;
  subject: string;
  description: string;
  isAnonymous: boolean;
  collaboratorName?: string | null;
  collaboratorEmail?: string | null;
  status: FeedbackStatus;
  urgency: UrgencyLevel;
  createdAt: Timestamp; // Firestore Timestamp
  adminNotes?: string | null;
  adminResponse?: string | null;
  adminResponseAt?: Timestamp | null;
  isRead: boolean;
}

export interface CategoryOption {
  value: string;
  label: string;
  type: FeedbackType[];
}

export const CATEGORIES: CategoryOption[] = [
  { value: "Melhoria de Processo", label: "Melhoria de Processo / Eficiência", type: [FeedbackType.SUGESTAO] },
  { value: "Ambiente de Trabalho", label: "Ambiente e Clima Organizacional", type: [FeedbackType.SUGESTAO, FeedbackType.CRITICA] },
  { value: "Equipamentos e Ti", label: "Equipamentos, Software e TI", type: [FeedbackType.SUGESTAO, FeedbackType.CRITICA] },
  { value: "Beneficios e Rh", label: "Benefícios, RH e Políticas Internas", type: [FeedbackType.SUGESTAO, FeedbackType.CRITICA] },
  { value: "Assedio Moral", label: "Ética - Assédio Moral ou Abuso de Poder", type: [FeedbackType.DENUNCIA, FeedbackType.CRITICA] },
  { value: "Assedio Sexual", label: "Ética - Assédio Sexual", type: [FeedbackType.DENUNCIA] },
  { value: "Fraude e Desvio", label: "Ética - Fraude, Corrupção ou Roubo", type: [FeedbackType.DENUNCIA] },
  { value: "Seguranca do Trabalho", label: "Segurança do Trabalho e Riscos", type: [FeedbackType.DENUNCIA, FeedbackType.CRITICA] },
  { value: "Vazamento de Dados", label: "Vazamento de Informações / LGPD", type: [FeedbackType.DENUNCIA] },
  { value: "Outros", label: "Outros Assuntos / Diversos", type: [FeedbackType.SUGESTAO, FeedbackType.CRITICA, FeedbackType.DENUNCIA] }
];

export const URGENCY_LABELS: Record<UrgencyLevel, { label: string; color: string; bg: string }> = {
  [UrgencyLevel.BAIXA]: { label: "Baixa", color: "text-blue-600", bg: "bg-blue-50 border-blue-200" },
  [UrgencyLevel.MEDIA]: { label: "Média", color: "text-yellow-600", bg: "bg-yellow-50 border-yellow-200" },
  [UrgencyLevel.ALTA]: { label: "Alta", color: "text-orange-600", bg: "bg-orange-50 border-orange-200" },
  [UrgencyLevel.CRITICA]: { label: "Crítica", color: "text-red-700 bg-red-50", bg: "bg-red-50 border-red-200" }
};

export const STATUS_LABELS: Record<FeedbackStatus, { label: string; color: string; bg: string }> = {
  [FeedbackStatus.PENDENTE]: { label: "Pendente", color: "text-red-600", bg: "bg-red-50" },
  [FeedbackStatus.EM_ANALISE]: { label: "Em Análise", color: "text-amber-600", bg: "bg-amber-50" },
  [FeedbackStatus.RESOLVIDO]: { label: "Resolvido", color: "text-emerald-600", bg: "bg-emerald-50" },
  [FeedbackStatus.ARQUIVADO]: { label: "Arquivado", color: "text-slate-500", bg: "bg-slate-100" }
};

export const TYPE_LABELS: Record<FeedbackType, { label: string; color: string; bg: string; desc: string }> = {
  [FeedbackType.SUGESTAO]: {
    label: "Sugestão",
    color: "text-teal-700",
    bg: "bg-teal-50 border-teal-200",
    desc: "Ideias e melhorias construtivas para tornar o ambiente, processos ou produtos ainda melhores."
  },
  [FeedbackType.CRITICA]: {
    label: "Crítica",
    color: "text-blue-700",
    bg: "bg-blue-50 border-blue-200",
    desc: "Apontamentos sobre processos ou situações que não estão funcionando como deveriam."
  },
  [FeedbackType.DENUNCIA]: {
    label: "Denúncia Anônima",
    color: "text-red-700",
    bg: "bg-red-50 border-red-200",
    desc: "Ambiente altamente sigiloso para relatar infrações ao código de ética, assédio, ou atos ilícitos."
  }
};
