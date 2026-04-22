/**
 * Caderno de Encargos — camada de acesso a dados.
 * As tabelas (caderno_encargos, execucao_servicos, medicoes_mensais) foram
 * criadas via migration mas o Database type pode não ter sido regenerado
 * ainda — usamos casts pontuais com `as any` para o cliente Supabase.
 */
import { supabase } from "@/integrations/supabase/client";

/* eslint-disable @typescript-eslint/no-explicit-any */
const sb = supabase as any;

export interface CadernoEncargo {
  id: string;
  codigo: string;
  descricao: string;
  unidade: string;
  preco_unitario: number;
  created_at?: string;
  updated_at?: string;
}

export interface CadernoEncargoInsert {
  codigo: string;
  descricao: string;
  unidade: string;
  preco_unitario: number;
  id?: string;
}

export interface ExecucaoServico {
  id: string;
  obra_id: string;
  item_encargo_id: string;
  quantidade: number;
  data_execucao: string;
  mes_referencia: string;
  created_at?: string;
  updated_at?: string;
}

export interface ExecucaoServicoInsert {
  obra_id: string;
  item_encargo_id: string;
  quantidade: number;
  data_execucao: string;
  mes_referencia: string;
  id?: string;
}

export interface MedicaoMensal {
  id: string;
  ur: string;
  mes_referencia: string;
  valor_total: number;
  status: string;
  created_at?: string;
  updated_at?: string;
}

/* ------------------- Caderno de Encargos ------------------- */

export async function fetchCaderno(): Promise<CadernoEncargo[]> {
  const { data, error } = await sb
    .from("caderno_encargos")
    .select("*")
    .order("codigo", { ascending: true })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as CadernoEncargo[];
}

export async function upsertCaderno(values: CadernoEncargoInsert) {
  if (values.id) {
    const { error } = await sb.from("caderno_encargos").update(values).eq("id", values.id);
    if (error) throw error;
  } else {
    const { error } = await sb.from("caderno_encargos").insert(values);
    if (error) throw error;
  }
}

export async function deleteCaderno(id: string) {
  const { error } = await sb.from("caderno_encargos").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------- Execução de Serviços ------------------- */

export async function fetchExecucoes(): Promise<ExecucaoServico[]> {
  const { data, error } = await sb
    .from("execucao_servicos")
    .select("*")
    .order("data_execucao", { ascending: false })
    .limit(2000);
  if (error) throw error;
  return (data ?? []) as ExecucaoServico[];
}

export async function fetchExecucoesByObra(obraId: string): Promise<ExecucaoServico[]> {
  const { data, error } = await sb
    .from("execucao_servicos")
    .select("*")
    .eq("obra_id", obraId)
    .order("data_execucao", { ascending: false });
  if (error) throw error;
  return (data ?? []) as ExecucaoServico[];
}

export async function insertExecucao(values: ExecucaoServicoInsert) {
  const { error } = await sb.from("execucao_servicos").insert(values);
  if (error) throw error;
}

export async function deleteExecucao(id: string) {
  const { error } = await sb.from("execucao_servicos").delete().eq("id", id);
  if (error) throw error;
}

/* ------------------- Medições Mensais ------------------- */

export async function fetchMedicoes(): Promise<MedicaoMensal[]> {
  const { data, error } = await sb
    .from("medicoes_mensais")
    .select("*")
    .order("mes_referencia", { ascending: false })
    .limit(1000);
  if (error) throw error;
  return (data ?? []) as MedicaoMensal[];
}

export async function updateMedicaoStatus(id: string, status: string) {
  const { error } = await sb.from("medicoes_mensais").update({ status }).eq("id", id);
  if (error) throw error;
}

/**
 * Gera/atualiza medições mensais somando quantidade * preco_unitario,
 * agrupado por (UR da obra, mes_referencia).
 */
export async function gerarMedicoesMensais(): Promise<number> {
  // Busca tudo necessário para o cálculo
  const [{ data: execs, error: e1 }, { data: itens, error: e2 }, { data: obras, error: e3 }] = await Promise.all([
    sb.from("execucao_servicos").select("*").limit(5000),
    sb.from("caderno_encargos").select("id, preco_unitario").limit(1000),
    sb.from("obras").select("id, ur").limit(2000),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;

  const precoMap = new Map<string, number>();
  (itens ?? []).forEach((i: any) => precoMap.set(i.id, Number(i.preco_unitario) || 0));
  const urMap = new Map<string, string>();
  (obras ?? []).forEach((o: any) => urMap.set(o.id, o.ur));

  // Agregação: chave = `${ur}::${mes}`
  const agg = new Map<string, { ur: string; mes_referencia: string; valor_total: number }>();
  (execs ?? []).forEach((ex: any) => {
    const ur = urMap.get(ex.obra_id);
    if (!ur) return;
    const preco = precoMap.get(ex.item_encargo_id) ?? 0;
    const valor = Number(ex.quantidade) * preco;
    const key = `${ur}::${ex.mes_referencia}`;
    const cur = agg.get(key);
    if (cur) cur.valor_total += valor;
    else agg.set(key, { ur, mes_referencia: ex.mes_referencia, valor_total: valor });
  });

  // Upsert por (ur, mes_referencia) — temos UNIQUE(ur, mes_referencia)
  const rows = Array.from(agg.values()).map(r => ({ ...r, status: "Pendente" }));
  if (rows.length === 0) return 0;

  const { error } = await sb
    .from("medicoes_mensais")
    .upsert(rows, { onConflict: "ur,mes_referencia" });
  if (error) throw error;
  return rows.length;
}

/** Helper: retorna 'YYYY-MM' atual */
export function currentMesReferencia(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

/* ------------------- Drill-down de Medição ------------------- */

export interface ObraDetalhe {
  obra_id: string;
  logradouro: string;
  bairro: string;
  ur: string;
  valor_total: number;
  itens: {
    descricao: string;
    codigo: string;
    quantidade: number;
    unidade: string;
    preco_unitario: number;
    valor_total: number;
  }[];
}

/**
 * Retorna detalhamento de uma medição (UR + mês): obras contribuintes
 * e os serviços lançados em cada obra naquele mês.
 */
export async function fetchMedicaoDetalhe(ur: string, mes: string): Promise<ObraDetalhe[]> {
  const [{ data: execs, error: e1 }, { data: itens, error: e2 }, { data: obras, error: e3 }] = await Promise.all([
    sb.from("execucao_servicos").select("*").eq("mes_referencia", mes).limit(5000),
    sb.from("caderno_encargos").select("*").limit(1000),
    sb.from("obras").select("id, logradouro, bairro, ur").eq("ur", ur).limit(2000),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  if (e3) throw e3;

  const itemMap = new Map<string, any>();
  (itens ?? []).forEach((i: any) => itemMap.set(i.id, i));
  const obraMap = new Map<string, any>();
  (obras ?? []).forEach((o: any) => obraMap.set(o.id, o));

  const result = new Map<string, ObraDetalhe>();
  (execs ?? []).forEach((ex: any) => {
    const obra = obraMap.get(ex.obra_id);
    if (!obra) return; // not in this UR
    const item = itemMap.get(ex.item_encargo_id);
    if (!item) return;
    const preco = Number(item.preco_unitario) || 0;
    const valor = Number(ex.quantidade) * preco;
    let entry = result.get(obra.id);
    if (!entry) {
      entry = { obra_id: obra.id, logradouro: obra.logradouro, bairro: obra.bairro, ur: obra.ur, valor_total: 0, itens: [] };
      result.set(obra.id, entry);
    }
    entry.valor_total += valor;
    entry.itens.push({
      descricao: item.descricao,
      codigo: item.codigo,
      quantidade: Number(ex.quantidade),
      unidade: item.unidade,
      preco_unitario: preco,
      valor_total: valor,
    });
  });

  return Array.from(result.values()).sort((a, b) => b.valor_total - a.valor_total);
}

/** Conta obras distintas com lançamentos no mês (e UR opcional) */
export async function fetchObrasAtivasNoMes(mes: string, ur?: string): Promise<number> {
  const [{ data: execs, error: e1 }, { data: obras, error: e2 }] = await Promise.all([
    sb.from("execucao_servicos").select("obra_id").eq("mes_referencia", mes).limit(5000),
    sb.from("obras").select("id, ur").limit(2000),
  ]);
  if (e1) throw e1;
  if (e2) throw e2;
  const urMap = new Map<string, string>();
  (obras ?? []).forEach((o: any) => urMap.set(o.id, o.ur));
  const set = new Set<string>();
  (execs ?? []).forEach((ex: any) => {
    if (ur && urMap.get(ex.obra_id) !== ur) return;
    set.add(ex.obra_id);
  });
  return set.size;
}
