/**
 * Camada de acesso a dados — Supabase.
 * Inclui tipos derivados do schema, mappers e queries.
 */
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type {
  AlvaraStatus, Finalidade, MaterialTipo, StatusObra, URCode,
} from "./mockData";

export type ObraRow = Database["public"]["Tables"]["obras"]["Row"];
export type ObraInsert = Database["public"]["Tables"]["obras"]["Insert"];
export type MaterialRow = Database["public"]["Tables"]["materiais"]["Row"];
export type MaterialInsert = Database["public"]["Tables"]["materiais"]["Insert"];
export type ConsolidadoRow = Database["public"]["Tables"]["gestao_consolidada"]["Row"];
export type ConsolidadoInsert = Database["public"]["Tables"]["gestao_consolidada"]["Insert"];

/** Modelo enriquecido de obra para a UI (com status/alvara derivados) */
export interface Obra {
  id: string;
  codigo: string;            // sintetizado a partir do id
  prioridade: number;
  ur: URCode;
  bairro: string;
  logradouro: string;
  finalidade: Finalidade;
  dn: number;                // 0 quando ausente
  extensaoM: number;
  material: MaterialTipo;
  alvaraNecessario: boolean;
  alvaraLiberado: boolean | null;
  status: StatusObra;
  alvaraStatus: AlvaraStatus;
  rawStatus: string;
  dataInicio: string | null;   // ISO date YYYY-MM-DD
  dataTermino: string | null;  // ISO date YYYY-MM-DD
  observacoes: string | null;
}

/* --------------------------- Mappers --------------------------- */

export function toObra(r: ObraRow): Obra {
  const alvaraStatus: AlvaraStatus = !r.alvara_necessario
    ? "nao_aplicavel"
    : r.alvara_liberado === true
      ? "liberado"
      : "pendente";

  // Acesso defensivo aos campos novos (data_inicio, data_termino, observacoes)
  // que podem não estar no tipo Database até o Supabase regerar os types.
  const extra = r as ObraRow & {
    data_inicio?: string | null;
    data_termino?: string | null;
    observacoes?: string | null;
  };
  const dataInicio = extra.data_inicio ?? null;
  const dataTermino = extra.data_termino ?? null;
  const hoje = new Date().toISOString().slice(0, 10);

  // Status derivado: prioriza datas reais quando preenchidas, depois alvará
  let status: StatusObra;
  if (dataTermino && dataTermino <= hoje) {
    status = "concluida";
  } else if (dataInicio && dataInicio <= hoje && (!dataTermino || dataTermino > hoje)) {
    status = "em_execucao";
  } else if (r.alvara_necessario && r.alvara_liberado !== true) {
    status = "aguardando_alvara";
  } else if (dataInicio && dataInicio > hoje) {
    status = "planejada";
  } else {
    status = "liberada";
  }

  return {
    id: r.id,
    codigo: `OBR-${r.id.slice(0, 8).toUpperCase()}`,
    prioridade: r.prioridade,
    ur: (r.ur as URCode) ?? "UMF",
    bairro: r.bairro,
    logradouro: r.logradouro,
    finalidade: (r.finalidade as Finalidade) || "extensao",
    dn: r.dn ?? 0,
    extensaoM: Number(r.extensao) || 0,
    material: (r.material as MaterialTipo) || "OUTRO",
    alvaraNecessario: r.alvara_necessario,
    alvaraLiberado: r.alvara_liberado,
    status,
    alvaraStatus,
    rawStatus: r.status,
    dataInicio,
    dataTermino,
    observacoes: extra.observacoes ?? null,
  };
}

/* --------------------------- Queries --------------------------- */

export async function fetchObras(): Promise<Obra[]> {
  const { data, error } = await supabase
    .from("obras")
    .select("*")
    .order("prioridade", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []).map(toObra);
}

export async function fetchMateriais(): Promise<MaterialRow[]> {
  const { data, error } = await supabase
    .from("materiais")
    .select("*")
    .order("codigo", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

export async function fetchConsolidado(): Promise<ConsolidadoRow[]> {
  const { data, error } = await supabase
    .from("gestao_consolidada")
    .select("*")
    .order("codigo", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return data ?? [];
}

/* --------------------------- Mutations --------------------------- */

export async function upsertObra(values: ObraInsert & { id?: string }) {
  if (values.id) {
    const { error } = await supabase.from("obras").update(values).eq("id", values.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("obras").insert(values);
    if (error) throw error;
  }
}

export async function deleteObra(id: string) {
  const { error } = await supabase.from("obras").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertMaterial(values: MaterialInsert & { id?: string }) {
  if (values.id) {
    const { error } = await supabase.from("materiais").update(values).eq("id", values.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("materiais").insert(values);
    if (error) throw error;
  }
}

export async function deleteMaterial(id: string) {
  const { error } = await supabase.from("materiais").delete().eq("id", id);
  if (error) throw error;
}

export async function upsertConsolidado(values: ConsolidadoInsert & { id?: string }) {
  if (values.id) {
    const { error } = await supabase.from("gestao_consolidada").update(values).eq("id", values.id);
    if (error) throw error;
  } else {
    const { error } = await supabase.from("gestao_consolidada").insert(values);
    if (error) throw error;
  }
}

export async function deleteConsolidado(id: string) {
  const { error } = await supabase.from("gestao_consolidada").delete().eq("id", id);
  if (error) throw error;
}

/* --------------------------- Derivações --------------------------- */

export function obrasByUR(list: Obra[], code: URCode): Obra[] {
  return list.filter(o => o.ur === code);
}

export function totalExtensao(list: Obra[]): number {
  return list.reduce((s, o) => s + o.extensaoM, 0);
}

export function extensaoPorMaterial(list: Obra[]): Record<MaterialTipo, number> {
  const out: Record<MaterialTipo, number> = { DEFOFO: 0, PEAD: 0, FOFO: 0, OUTRO: 0 };
  list.forEach(o => { out[o.material] = (out[o.material] ?? 0) + o.extensaoM; });
  return out;
}

export function urStats(list: Obra[], code: URCode) {
  const sub = obrasByUR(list, code);
  return {
    obras: sub.length,
    extensaoM: totalExtensao(sub),
    emExecucao: sub.filter(o => o.status === "em_execucao").length,
    aguardandoAlvara: sub.filter(o => o.status === "aguardando_alvara").length,
    concluidas: sub.filter(o => o.status === "concluida").length,
    criticas: sub.filter(o => o.prioridade <= 2 && (o.alvaraStatus === "pendente" || o.alvaraStatus === "vencido")).length,
  };
}

/** Atualização parcial de uma obra (usada em edição inline) */
export async function patchObra(id: string, patch: Partial<ObraInsert>) {
  const { error } = await supabase.from("obras").update(patch).eq("id", id);
  if (error) throw error;
}

export function topPrioridades(list: Obra[], n = 5, urFilter?: URCode): Obra[] {
  const base = urFilter ? obrasByUR(list, urFilter) : list;
  return [...base]
    .filter(o => o.status !== "em_execucao" && o.status !== "concluida")
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, n);
}

/** Top N prioridades por cada UR, concatenadas (não iniciadas) */
export function topPrioridadesPorUR(list: Obra[], nPorUr = 3, urFilter?: URCode | "TODAS"): Obra[] {
  const codes: URCode[] = urFilter && urFilter !== "TODAS" ? [urFilter] : ["UMB", "UML", "UMF"];
  const out: Obra[] = [];
  codes.forEach(code => {
    const sub = list
      .filter(o => o.ur === code && o.status !== "em_execucao" && o.status !== "concluida")
      .sort((a, b) => a.prioridade - b.prioridade)
      .slice(0, nPorUr);
    out.push(...sub);
  });
  return out;
}

/** Obras em execução (com data_inicio preenchida e ainda não concluídas) */
export function obrasEmExecucao(list: Obra[], urFilter?: URCode | "TODAS"): Obra[] {
  const base = urFilter && urFilter !== "TODAS" ? obrasByUR(list, urFilter) : list;
  return base
    .filter(o => o.status === "em_execucao")
    .sort((a, b) => a.prioridade - b.prioridade);
}

/** Marca uma obra como executada/concluída (define data_termino = hoje) */
export async function marcarServicoExecutado(id: string) {
  const hoje = new Date().toISOString().slice(0, 10);
  const { error } = await supabase
    .from("obras")
    .update({ data_termino: hoje, status: "concluida" })
    .eq("id", id);
  if (error) throw error;
}
