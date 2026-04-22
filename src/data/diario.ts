/**
 * Camada de acesso ao Diário de Obra.
 * As tabelas `diario_obra` e `obra_historico` ainda não estão no types.ts gerado;
 * usamos cast defensivo enquanto o Supabase não regenera os tipos.
 */
import { supabase } from "@/integrations/supabase/client";

export interface DiarioLancamento {
  id: string;
  obra_id: string;
  data_lancamento: string; // YYYY-MM-DD
  autor: string;
  clima: string;
  equipe_tamanho: number;
  atividade: string;
  material_tipo: string;
  material_dn: number | null;
  metragem_executada: number;
  profundidade_media: number;
  descricao: string;
  ocorrencias: string | null;
  created_at: string;
  updated_at: string;
}

export type DiarioInsert = Omit<DiarioLancamento, "id" | "created_at" | "updated_at"> & {
  id?: string;
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export async function fetchDiarioByObra(obraId: string): Promise<DiarioLancamento[]> {
  const { data, error } = await sb
    .from("diario_obra")
    .select("*")
    .eq("obra_id", obraId)
    .order("data_lancamento", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) throw error;
  return (data ?? []) as DiarioLancamento[];
}

export async function fetchAllDiario(): Promise<DiarioLancamento[]> {
  const { data, error } = await sb
    .from("diario_obra")
    .select("*")
    .order("data_lancamento", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as DiarioLancamento[];
}

export async function insertDiario(values: DiarioInsert) {
  const { error } = await sb.from("diario_obra").insert(values);
  if (error) throw error;
}

export async function deleteDiario(id: string) {
  const { error } = await sb.from("diario_obra").delete().eq("id", id);
  if (error) throw error;
}

/** Soma a metragem executada por obra a partir dos lançamentos. */
export function metragemPorObra(lancamentos: DiarioLancamento[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const l of lancamentos) {
    out[l.obra_id] = (out[l.obra_id] ?? 0) + Number(l.metragem_executada || 0);
  }
  return out;
}
