/**
 * Histórico de alterações em obras (populado por trigger Postgres).
 */
import { supabase } from "@/integrations/supabase/client";

export interface HistoricoEvento {
  id: string;
  obra_id: string;
  campo_alterado: string;
  valor_anterior: string | null;
  valor_novo: string | null;
  tipo_evento: string;
  autor: string;
  created_at: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb = supabase as any;

export async function fetchHistoricoByObra(obraId: string): Promise<HistoricoEvento[]> {
  const { data, error } = await sb
    .from("obra_historico")
    .select("*")
    .eq("obra_id", obraId)
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw error;
  return (data ?? []) as HistoricoEvento[];
}

const labelCampo: Record<string, string> = {
  status: "Status",
  data_inicio: "Data de início",
  data_termino: "Data de término",
  alvara_liberado: "Alvará",
  prioridade: "Prioridade",
  observacoes: "Observações",
};

export function descreverEvento(ev: HistoricoEvento): string {
  const campo = labelCampo[ev.campo_alterado] ?? ev.campo_alterado;
  const de = ev.valor_anterior ?? "—";
  const para = ev.valor_novo ?? "—";
  if (ev.campo_alterado === "alvara_liberado") {
    const fmt = (v: string | null) => v === "true" ? "Liberado" : v === "false" ? "Negado" : "Pendente";
    return `${campo}: ${fmt(ev.valor_anterior)} → ${fmt(ev.valor_novo)}`;
  }
  return `${campo}: ${de} → ${para}`;
}

export function tempoRelativo(iso: string): string {
  const d = new Date(iso).getTime();
  const diff = Math.max(0, Date.now() - d);
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `há ${min} min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `há ${h} h`;
  const dias = Math.floor(h / 24);
  if (dias < 30) return `há ${dias} d`;
  const meses = Math.floor(dias / 30);
  if (meses < 12) return `há ${meses} mês(es)`;
  return `há ${Math.floor(meses / 12)} ano(s)`;
}
