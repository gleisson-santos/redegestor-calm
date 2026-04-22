/**
 * RedeGestor — Modelo de dados de engenharia
 * Baseado na planilha "Consolidação de Frentes de Serviço".
 *
 * Entidades principais:
 *  - UR (Unidade Regional): UMB, UML, UMF
 *  - Obra (Frente de Serviço): logradouro, finalidade, DN, extensão, material, prioridade, alvará
 *  - Material (catálogo técnico): tubos DEFOFO/PEAD/FOFO, conexões, registros
 *  - Estoque por código de material (saldo global)
 */

export type URCode = "UMB" | "UML" | "UMF";

export type Finalidade = "substituicao" | "extensao";
export type MaterialTipo = "DEFOFO" | "PEAD" | "FOFO";
export type StatusObra = "planejada" | "aguardando_alvara" | "liberada" | "em_execucao" | "concluida" | "suspensa";
export type AlvaraNecessidade = "sim" | "nao";
export type AlvaraStatus = "liberado" | "pendente" | "nao_aplicavel" | "vencido";

export interface UR {
  code: URCode;
  nome: string;
  cidade: string;
  gerente: string;
  cor: string;
}

export interface Obra {
  id: string;
  codigo: string;            // ex.: "OBR-2026-0142"
  ur: URCode;
  bairro: string;
  logradouro: string;
  finalidade: Finalidade;
  dn: number;                // diâmetro nominal (mm)
  extensaoM: number;         // metros
  material: MaterialTipo;
  prioridade: number;        // 1 (mais alta) — 10
  status: StatusObra;
  alvaraNecessidade: AlvaraNecessidade;
  alvaraStatus: AlvaraStatus;
  alvaraNumero?: string;
  alvaraValidade?: string;   // ISO
  responsavel: string;
  inicioPrevisto: string;    // ISO
  conclusaoPrevista: string; // ISO
  observacoes?: string;
}

export type CategoriaMaterial = "tubo" | "conexao" | "registro" | "acessorio";

export interface MaterialItem {
  codigo: string;
  descricao: string;
  categoria: CategoriaMaterial;
  tipo?: MaterialTipo;       // para tubos
  dn?: number;               // diâmetro nominal
  umb: "m" | "un" | "kg";
  estoqueAtual: number;
  estoqueMinimo: number;
  consumoPorMetro?: number;  // para conexões: estimativa por metro de obra do mesmo tipo/DN
}

/* ----------------------------- URs ----------------------------- */

export const urs: UR[] = [
  { code: "UMB", nome: "Unidade de Manutenção Brooklin",  cidade: "São Paulo — Zona Sul",   gerente: "Eng. Marina Cardoso", cor: "oklch(0.42 0.10 240)" },
  { code: "UML", nome: "Unidade de Manutenção Lapa",       cidade: "São Paulo — Zona Oeste", gerente: "Eng. Rafael Mendes",  cor: "oklch(0.55 0.12 220)" },
  { code: "UMF", nome: "Unidade de Manutenção Freguesia",  cidade: "São Paulo — Zona Norte", gerente: "Eng. Beatriz Lima",   cor: "oklch(0.50 0.08 260)" },
];

/* --------------------------- Catálogo --------------------------- */

export const materiais: MaterialItem[] = [
  // DEFOFO (Ferro Dúctil revestido)
  { codigo: "DEFOFO-K7-100",  descricao: "Tubo DEFOFO K7 DN 100mm", categoria: "tubo", tipo: "DEFOFO", dn: 100, umb: "m",  estoqueAtual: 1240, estoqueMinimo: 800 },
  { codigo: "DEFOFO-K7-150",  descricao: "Tubo DEFOFO K7 DN 150mm", categoria: "tubo", tipo: "DEFOFO", dn: 150, umb: "m",  estoqueAtual: 410,  estoqueMinimo: 600 },
  { codigo: "DEFOFO-K9-200",  descricao: "Tubo DEFOFO K9 DN 200mm", categoria: "tubo", tipo: "DEFOFO", dn: 200, umb: "m",  estoqueAtual: 180,  estoqueMinimo: 250 },

  // PEAD
  { codigo: "PEAD-PE100-063", descricao: "Tubo PEAD PE100 PN10 DN 63mm",  categoria: "tubo", tipo: "PEAD", dn: 63,  umb: "m", estoqueAtual: 920,  estoqueMinimo: 500 },
  { codigo: "PEAD-PE100-090", descricao: "Tubo PEAD PE100 PN10 DN 90mm",  categoria: "tubo", tipo: "PEAD", dn: 90,  umb: "m", estoqueAtual: 640,  estoqueMinimo: 600 },
  { codigo: "PEAD-PE100-110", descricao: "Tubo PEAD PE100 PN10 DN 110mm", categoria: "tubo", tipo: "PEAD", dn: 110, umb: "m", estoqueAtual: 320,  estoqueMinimo: 500 },

  // FOFO
  { codigo: "FOFO-100", descricao: "Tubo FOFO DN 100mm", categoria: "tubo", tipo: "FOFO", dn: 100, umb: "m", estoqueAtual: 480, estoqueMinimo: 300 },
  { codigo: "FOFO-150", descricao: "Tubo FOFO DN 150mm", categoria: "tubo", tipo: "FOFO", dn: 150, umb: "m", estoqueAtual: 95,  estoqueMinimo: 200 },

  // Conexões — consumo estimado por metro de obra
  { codigo: "CUR-90-100",   descricao: "Curva 90° DN 100",        categoria: "conexao", dn: 100, umb: "un", estoqueAtual: 124, estoqueMinimo: 60, consumoPorMetro: 0.020 },
  { codigo: "CUR-90-150",   descricao: "Curva 90° DN 150",        categoria: "conexao", dn: 150, umb: "un", estoqueAtual: 38,  estoqueMinimo: 40, consumoPorMetro: 0.018 },
  { codigo: "RED-150-100",  descricao: "Redução DN 150 → 100",    categoria: "conexao", dn: 150, umb: "un", estoqueAtual: 22,  estoqueMinimo: 20, consumoPorMetro: 0.008 },
  { codigo: "TE-100",       descricao: "Tê 90° DN 100",           categoria: "conexao", dn: 100, umb: "un", estoqueAtual: 70,  estoqueMinimo: 30, consumoPorMetro: 0.012 },

  // Registros
  { codigo: "REG-G-100", descricao: "Registro Gaveta DN 100 PN16", categoria: "registro", dn: 100, umb: "un", estoqueAtual: 18, estoqueMinimo: 20 },
  { codigo: "REG-G-150", descricao: "Registro Gaveta DN 150 PN16", categoria: "registro", dn: 150, umb: "un", estoqueAtual: 9,  estoqueMinimo: 12 },
];

/* ------------------------------ Obras ------------------------------ */

export const obras: Obra[] = [
  { id: "o1",  codigo: "OBR-2026-0101", ur: "UMB", bairro: "Brooklin",       logradouro: "Av. Berrini, 1500",            finalidade: "substituicao", dn: 150, extensaoM: 320, material: "DEFOFO", prioridade: 1, status: "aguardando_alvara", alvaraNecessidade: "sim", alvaraStatus: "pendente",  responsavel: "Equipe Alfa",    inicioPrevisto: "2026-05-12", conclusaoPrevista: "2026-06-04" },
  { id: "o2",  codigo: "OBR-2026-0102", ur: "UMB", bairro: "Itaim Bibi",     logradouro: "R. Joaquim Floriano, 820",     finalidade: "extensao",     dn: 100, extensaoM: 180, material: "PEAD",   prioridade: 2, status: "liberada",          alvaraNecessidade: "sim", alvaraStatus: "liberado",  alvaraNumero: "ALV-22841/26", alvaraValidade: "2026-09-30", responsavel: "Equipe Alfa", inicioPrevisto: "2026-05-18", conclusaoPrevista: "2026-06-02" },
  { id: "o3",  codigo: "OBR-2026-0103", ur: "UMB", bairro: "Vila Olímpia",   logradouro: "R. Funchal, 220",              finalidade: "substituicao", dn: 100, extensaoM: 240, material: "FOFO",   prioridade: 3, status: "em_execucao",       alvaraNecessidade: "sim", alvaraStatus: "liberado",  alvaraNumero: "ALV-22790/26", alvaraValidade: "2026-08-15", responsavel: "Equipe Beta", inicioPrevisto: "2026-04-29", conclusaoPrevista: "2026-05-25" },

  { id: "o4",  codigo: "OBR-2026-0201", ur: "UML", bairro: "Lapa",           logradouro: "R. Guaicurus, 1100",           finalidade: "substituicao", dn: 200, extensaoM: 410, material: "DEFOFO", prioridade: 1, status: "planejada",         alvaraNecessidade: "sim", alvaraStatus: "pendente",  responsavel: "Equipe Gama",    inicioPrevisto: "2026-06-02", conclusaoPrevista: "2026-07-10" },
  { id: "o5",  codigo: "OBR-2026-0202", ur: "UML", bairro: "Pinheiros",      logradouro: "R. dos Pinheiros, 540",        finalidade: "extensao",     dn: 90,  extensaoM: 215, material: "PEAD",   prioridade: 2, status: "em_execucao",       alvaraNecessidade: "nao", alvaraStatus: "nao_aplicavel", responsavel: "Equipe Gama",  inicioPrevisto: "2026-05-04", conclusaoPrevista: "2026-05-30" },
  { id: "o6",  codigo: "OBR-2026-0203", ur: "UML", bairro: "Perdizes",       logradouro: "R. Apiacás, 318",              finalidade: "substituicao", dn: 150, extensaoM: 145, material: "FOFO",   prioridade: 4, status: "planejada",         alvaraNecessidade: "sim", alvaraStatus: "pendente",  responsavel: "Equipe Delta",   inicioPrevisto: "2026-06-15", conclusaoPrevista: "2026-07-05" },
  { id: "o7",  codigo: "OBR-2026-0204", ur: "UML", bairro: "Vila Madalena",  logradouro: "R. Aspicuelta, 70",            finalidade: "extensao",     dn: 63,  extensaoM: 95,  material: "PEAD",   prioridade: 6, status: "concluida",         alvaraNecessidade: "nao", alvaraStatus: "nao_aplicavel", responsavel: "Equipe Gama",  inicioPrevisto: "2026-04-05", conclusaoPrevista: "2026-04-18" },

  { id: "o8",  codigo: "OBR-2026-0301", ur: "UMF", bairro: "Freguesia do Ó", logradouro: "Av. Itaberaba, 2400",          finalidade: "substituicao", dn: 150, extensaoM: 510, material: "DEFOFO", prioridade: 1, status: "aguardando_alvara", alvaraNecessidade: "sim", alvaraStatus: "vencido",   alvaraNumero: "ALV-21500/25", alvaraValidade: "2026-03-30", responsavel: "Equipe Épsilon", inicioPrevisto: "2026-05-20", conclusaoPrevista: "2026-07-02" },
  { id: "o9",  codigo: "OBR-2026-0302", ur: "UMF", bairro: "Brasilândia",    logradouro: "R. Dr. Alves Lima, 90",        finalidade: "extensao",     dn: 110, extensaoM: 285, material: "PEAD",   prioridade: 2, status: "liberada",          alvaraNecessidade: "sim", alvaraStatus: "liberado",  alvaraNumero: "ALV-22912/26", alvaraValidade: "2026-10-12", responsavel: "Equipe Épsilon", inicioPrevisto: "2026-05-22", conclusaoPrevista: "2026-06-15" },
  { id: "o10", codigo: "OBR-2026-0303", ur: "UMF", bairro: "Cachoeirinha",   logradouro: "R. Parapuã, 1.800",            finalidade: "substituicao", dn: 100, extensaoM: 198, material: "FOFO",   prioridade: 3, status: "planejada",         alvaraNecessidade: "sim", alvaraStatus: "pendente",  responsavel: "Equipe Zeta",    inicioPrevisto: "2026-06-08", conclusaoPrevista: "2026-06-28" },
  { id: "o11", codigo: "OBR-2026-0304", ur: "UMF", bairro: "Pirituba",       logradouro: "Av. Mutinga, 4.020",           finalidade: "extensao",     dn: 90,  extensaoM: 130, material: "PEAD",   prioridade: 5, status: "suspensa",          alvaraNecessidade: "sim", alvaraStatus: "pendente",  responsavel: "Equipe Zeta",    inicioPrevisto: "2026-06-12", conclusaoPrevista: "2026-07-01", observacoes: "Aguardando interface com obra viária." },
  { id: "o12", codigo: "OBR-2026-0305", ur: "UMF", bairro: "Casa Verde",     logradouro: "R. Paulo Gonçalo dos Santos",  finalidade: "extensao",     dn: 63,  extensaoM: 88,  material: "PEAD",   prioridade: 7, status: "concluida",         alvaraNecessidade: "nao", alvaraStatus: "nao_aplicavel", responsavel: "Equipe Épsilon", inicioPrevisto: "2026-04-10", conclusaoPrevista: "2026-04-22" },
];

/* ----------------------------- Helpers ----------------------------- */

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
};

export function getUR(code: URCode): UR | undefined {
  return urs.find(u => u.code === code);
}

export function obrasByUR(code: URCode): Obra[] {
  return obras.filter(o => o.ur === code);
}

export function obraById(id: string): Obra | undefined {
  return obras.find(o => o.id === id);
}

/** Soma extensão (m) por filtro arbitrário */
export function totalExtensao(list: Obra[] = obras): number {
  return list.reduce((s, o) => s + o.extensaoM, 0);
}

/** Soma extensão por tipo de material */
export function extensaoPorMaterial(list: Obra[] = obras): Record<MaterialTipo, number> {
  const out: Record<MaterialTipo, number> = { DEFOFO: 0, PEAD: 0, FOFO: 0 };
  list.forEach(o => { out[o.material] += o.extensaoM; });
  return out;
}

/** Estatísticas por UR para o dashboard */
export function urStats(code: URCode) {
  const list = obrasByUR(code);
  return {
    obras: list.length,
    extensaoM: totalExtensao(list),
    emExecucao: list.filter(o => o.status === "em_execucao").length,
    aguardandoAlvara: list.filter(o => o.status === "aguardando_alvara").length,
    concluidas: list.filter(o => o.status === "concluida").length,
    criticas: list.filter(o => o.prioridade <= 2 && (o.alvaraStatus === "pendente" || o.alvaraStatus === "vencido")).length,
  };
}

/** Top N obras prioritárias ainda não iniciadas */
export function topPrioridades(n = 5, urFilter?: URCode): Obra[] {
  const base = urFilter ? obrasByUR(urFilter) : obras;
  return [...base]
    .filter(o => o.status !== "em_execucao" && o.status !== "concluida")
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, n);
}

/** Necessidade total de tubo por código (com base nas obras ativas) */
export function necessidadeTubos(list: Obra[] = obras): { codigo: string; descricao: string; tipo: MaterialTipo; dn: number; necessario: number; estoque: number; saldo: number }[] {
  // Mapeia (tipo, dn) -> material
  const tubos = materiais.filter(m => m.categoria === "tubo");
  return tubos.map(m => {
    const necessario = list
      .filter(o => o.material === m.tipo && o.dn === m.dn && o.status !== "concluida")
      .reduce((s, o) => s + o.extensaoM, 0);
    return {
      codigo: m.codigo,
      descricao: m.descricao,
      tipo: m.tipo!,
      dn: m.dn!,
      necessario,
      estoque: m.estoqueAtual,
      saldo: m.estoqueAtual - necessario,
    };
  });
}

/** Necessidade total de conexões estimada (por DN) */
export function necessidadeConexoes(list: Obra[] = obras): { codigo: string; descricao: string; dn: number; necessario: number; estoque: number; saldo: number }[] {
  const conexoes = materiais.filter(m => m.categoria === "conexao");
  return conexoes.map(c => {
    const obrasDN = list.filter(o => o.dn === c.dn && o.status !== "concluida");
    const necessario = Math.ceil(obrasDN.reduce((s, o) => s + o.extensaoM, 0) * (c.consumoPorMetro ?? 0));
    return {
      codigo: c.codigo,
      descricao: c.descricao,
      dn: c.dn!,
      necessario,
      estoque: c.estoqueAtual,
      saldo: c.estoqueAtual - necessario,
    };
  });
}

/** Cores semânticas por status — para uso direto em badges (classes) */
export const statusObraTone: Record<StatusObra, string> = {
  planejada:         "bg-muted text-muted-foreground border-border",
  aguardando_alvara: "bg-warning-soft text-warning-foreground border-warning/30",
  liberada:          "bg-info-soft text-info border-info/20",
  em_execucao:       "bg-accent-soft text-accent border-accent/20",
  concluida:         "bg-primary-soft text-primary border-primary/20",
  suspensa:          "bg-destructive-soft text-destructive border-destructive/20",
};

export const alvaraTone: Record<AlvaraStatus, string> = {
  liberado:       "bg-accent-soft text-accent border-accent/20",
  pendente:       "bg-warning-soft text-warning-foreground border-warning/30",
  vencido:        "bg-destructive-soft text-destructive border-destructive/20",
  nao_aplicavel:  "bg-muted text-muted-foreground border-border",
};
