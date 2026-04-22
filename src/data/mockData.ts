/**
 * RedeGestor — Tipos de domínio + helpers de label/tom.
 * Os dados agora vêm do Supabase (tabelas: obras, materiais, gestao_consolidada).
 * Este arquivo expõe apenas tipos, constantes de URs e funções de derivação visual.
 */

export type URCode = "UMB" | "UML" | "UMF";

export type Finalidade = "substituicao" | "extensao" | "extensao_substituicao";
export type MaterialTipo = "DEFOFO" | "PEAD" | "FOFO" | "OUTRO";

/** Status visual derivado dos campos do banco (alvará + status text) */
export type StatusObra =
  | "planejada"
  | "aguardando_alvara"
  | "liberada"
  | "em_execucao"
  | "concluida"
  | "suspensa";

export type AlvaraStatus = "liberado" | "pendente" | "nao_aplicavel" | "vencido";

export interface UR {
  code: URCode;
  nome: string;
  cidade: string;
  gerente: string;
  cor: string;
}

/* ----------------------------- URs ----------------------------- */

export const urs: UR[] = [
  { code: "UMB", nome: "Unidade UMB", cidade: "Salvador — Bahia", gerente: "Eng. Marina Cardoso", cor: "oklch(0.42 0.10 240)" },
  { code: "UML", nome: "Unidade UML", cidade: "Salvador — Lobato/Vila Ruy Barbosa", gerente: "Eng. Rafael Mendes", cor: "oklch(0.55 0.12 220)" },
  { code: "UMF", nome: "Unidade UMF", cidade: "Salvador — Caixa D'Água/Liberdade", gerente: "Eng. Beatriz Lima", cor: "oklch(0.50 0.08 260)" },
];

/* ----------------------------- Labels ----------------------------- */

export const statusObraLabels: Record<StatusObra, string> = {
  planejada: "Planejada",
  aguardando_alvara: "Aguardando alvará",
  liberada: "Liberada",
  em_execucao: "Em execução",
  concluida: "Concluída",
  suspensa: "Suspensa",
};

export const alvaraStatusLabels: Record<AlvaraStatus, string> = {
  liberado: "Liberado",
  pendente: "Pendente",
  vencido: "Vencido",
  nao_aplicavel: "N/A",
};

export const finalidadeLabels: Record<Finalidade, string> = {
  substituicao: "Substituição",
  extensao: "Extensão",
  extensao_substituicao: "Ext./Subst.",
};

/* ----------------------------- Tons ----------------------------- */

export const statusObraTone: Record<StatusObra, string> = {
  planejada: "bg-muted text-muted-foreground border-border",
  aguardando_alvara: "bg-warning-soft text-warning-foreground border-warning/30",
  liberada: "bg-info-soft text-info border-info/20",
  em_execucao: "bg-accent-soft text-accent border-accent/20",
  concluida: "bg-primary-soft text-primary border-primary/20",
  suspensa: "bg-destructive-soft text-destructive border-destructive/20",
};

export const alvaraTone: Record<AlvaraStatus, string> = {
  liberado: "bg-accent-soft text-accent border-accent/20",
  pendente: "bg-warning-soft text-warning-foreground border-warning/30",
  vencido: "bg-destructive-soft text-destructive border-destructive/20",
  nao_aplicavel: "bg-muted text-muted-foreground border-border",
};

export function getUR(code: URCode): UR | undefined {
  return urs.find(u => u.code === code);
}
