export type ContractStatus = "ativo" | "pausado" | "concluido" | "atencao";
export type URCode = "UR1" | "UR2" | "UR3" | "UR4";

export interface Material {
  codigo: string;
  descricao: string;
  umb: string;
  categoria: "tubo" | "conexao" | "registro" | "acessorio";
  cronograma: Record<string, number>; // ex: "2026-05": 120
  estoqueAtual: number;
  estoqueMinimo: number;
}

export interface Contract {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  ur: URCode;
  status: ContractStatus;
  inicio: string;
  fim: string;
  responsavel: string;
  regiao: string;
  progresso: number;
  materiais: Material[];
}

export interface UR {
  code: URCode;
  nome: string;
  cidade: string;
  gerente: string;
  cor: string; // chart token
}

export interface ServiceLocation {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  ur: URCode;
  contratoId: string;
  contratoNumero: string;
  status: "planejado" | "em_andamento" | "concluido";
  data: string;
  responsavel: string;
  materiaisUsados: number;
  lat: number;
  lng: number;
}

/* Sheets-faithful schedule: May 2026 → April 2028 (24 months) */
function buildMeses(): string[] {
  const out: string[] = [];
  let y = 2026, m = 5; // May'26
  for (let i = 0; i < 24; i++) {
    out.push(`${y}-${String(m).padStart(2, "0")}`);
    m++;
    if (m > 12) { m = 1; y++; }
  }
  return out;
}
export const meses = buildMeses();
export const mesesPorAno: Record<string, string[]> = {
  "2026": meses.filter(m => m.startsWith("2026")),
  "2027": meses.filter(m => m.startsWith("2027")),
  "2028": meses.filter(m => m.startsWith("2028")),
};

function gerarCronograma(base: number, variacao = 0.4): Record<string, number> {
  const c: Record<string, number> = {};
  meses.forEach((m, i) => {
    const decay = 1 - i * 0.008;
    const noise = 1 + Math.sin(i * 1.7) * variacao;
    c[m] = Math.max(0, Math.round(base * decay * noise));
  });
  return c;
}

export const urs: UR[] = [
  { code: "UR1", nome: "Unidade Regional Norte",   cidade: "São Paulo / Guarulhos", gerente: "Marina Cardoso", cor: "var(--chart-1)" },
  { code: "UR2", nome: "Unidade Regional Leste",   cidade: "Campinas / Jundiaí",    gerente: "Rafael Mendes",  cor: "var(--chart-2)" },
  { code: "UR3", nome: "Unidade Regional Litoral", cidade: "Santos / São Vicente",  gerente: "Beatriz Lima",   cor: "var(--chart-4)" },
  { code: "UR4", nome: "Unidade Regional Oeste",   cidade: "Cotia / Osasco",        gerente: "Tiago Ferraz",   cor: "var(--chart-3)" },
];

export const contracts: Contract[] = [
  {
    id: "c1",
    numero: "460024801",
    titulo: "Extensão de rede — Setor Norte",
    cliente: "Companhia de Saneamento Estadual",
    ur: "UR1",
    status: "ativo",
    inicio: "2026-05-01",
    fim: "2028-04-30",
    responsavel: "Eng. Marina Cardoso",
    regiao: "Zona Norte — São Paulo",
    progresso: 34,
    materiais: [
      { codigo: "TFD-100", descricao: "Tubo Ferro Dúctil DN 100mm K9", umb: "m", categoria: "tubo", cronograma: gerarCronograma(180), estoqueAtual: 420, estoqueMinimo: 300 },
      { codigo: "TFD-150", descricao: "Tubo Ferro Dúctil DN 150mm K9", umb: "m", categoria: "tubo", cronograma: gerarCronograma(140), estoqueAtual: 210, estoqueMinimo: 250 },
      { codigo: "PVC-075", descricao: "Tubo PVC PBA DN 75mm JE", umb: "m", categoria: "tubo", cronograma: gerarCronograma(220, 0.3), estoqueAtual: 680, estoqueMinimo: 400 },
      { codigo: "PEAD-090", descricao: "Tubo PEAD PE100 DN 90mm PN10", umb: "m", categoria: "tubo", cronograma: gerarCronograma(160), estoqueAtual: 95, estoqueMinimo: 200 },
      { codigo: "CON-T100", descricao: "Tê 90° Ferro Dúctil DN 100", umb: "un", categoria: "conexao", cronograma: gerarCronograma(24, 0.5), estoqueAtual: 58, estoqueMinimo: 40 },
      { codigo: "CON-C90", descricao: "Curva 90° PVC DN 75", umb: "un", categoria: "conexao", cronograma: gerarCronograma(36), estoqueAtual: 120, estoqueMinimo: 60 },
      { codigo: "REG-G100", descricao: "Registro Gaveta DN 100 PN16", umb: "un", categoria: "registro", cronograma: gerarCronograma(12, 0.6), estoqueAtual: 18, estoqueMinimo: 15 },
      { codigo: "REG-G150", descricao: "Registro Gaveta DN 150 PN16", umb: "un", categoria: "registro", cronograma: gerarCronograma(8, 0.5), estoqueAtual: 9, estoqueMinimo: 12 },
    ],
  },
  {
    id: "c2",
    numero: "460024802",
    titulo: "Ampliação de rede — Distrito Industrial",
    cliente: "Sanasa Municipal",
    ur: "UR2",
    status: "ativo",
    inicio: "2026-06-01",
    fim: "2027-12-30",
    responsavel: "Eng. Rafael Mendes",
    regiao: "Distrito Industrial — Campinas",
    progresso: 18,
    materiais: [
      { codigo: "PEAD-110", descricao: "Tubo PEAD PE100 DN 110mm PN10", umb: "m", categoria: "tubo", cronograma: gerarCronograma(200), estoqueAtual: 340, estoqueMinimo: 250 },
      { codigo: "TFD-200", descricao: "Tubo Ferro Dúctil DN 200mm K9", umb: "m", categoria: "tubo", cronograma: gerarCronograma(110), estoqueAtual: 88, estoqueMinimo: 150 },
      { codigo: "REG-B100", descricao: "Registro Borboleta DN 100", umb: "un", categoria: "registro", cronograma: gerarCronograma(10), estoqueAtual: 22, estoqueMinimo: 10 },
      { codigo: "CON-T150", descricao: "Tê 90° Ferro Dúctil DN 150", umb: "un", categoria: "conexao", cronograma: gerarCronograma(18, 0.5), estoqueAtual: 30, estoqueMinimo: 20 },
    ],
  },
  {
    id: "c3",
    numero: "460024803",
    titulo: "Substituição de rede — Centro Histórico",
    cliente: "Companhia de Saneamento Estadual",
    ur: "UR3",
    status: "atencao",
    inicio: "2026-05-15",
    fim: "2027-08-30",
    responsavel: "Eng. Beatriz Lima",
    regiao: "Centro — Santos",
    progresso: 62,
    materiais: [
      { codigo: "PVC-100", descricao: "Tubo PVC PBA DN 100mm JE", umb: "m", categoria: "tubo", cronograma: gerarCronograma(140), estoqueAtual: 45, estoqueMinimo: 180 },
      { codigo: "CON-T75", descricao: "Tê 90° PVC DN 75", umb: "un", categoria: "conexao", cronograma: gerarCronograma(28), estoqueAtual: 12, estoqueMinimo: 30 },
      { codigo: "REG-G075", descricao: "Registro Gaveta DN 75 PN16", umb: "un", categoria: "registro", cronograma: gerarCronograma(14, 0.4), estoqueAtual: 25, estoqueMinimo: 18 },
    ],
  },
  {
    id: "c4",
    numero: "460024798",
    titulo: "Rede primária — Loteamento Aurora",
    cliente: "Construtora Aurora Ltda.",
    ur: "UR4",
    status: "pausado",
    inicio: "2026-07-01",
    fim: "2027-10-30",
    responsavel: "Eng. Tiago Ferraz",
    regiao: "Cotia — SP",
    progresso: 22,
    materiais: [
      { codigo: "PEAD-063", descricao: "Tubo PEAD PE100 DN 63mm PN10", umb: "m", categoria: "tubo", cronograma: gerarCronograma(90), estoqueAtual: 280, estoqueMinimo: 150 },
      { codigo: "CON-C63", descricao: "Curva 90° PEAD DN 63", umb: "un", categoria: "conexao", cronograma: gerarCronograma(20), estoqueAtual: 60, estoqueMinimo: 25 },
    ],
  },
  {
    id: "c5",
    numero: "460024795",
    titulo: "Recuperação de adutora — Bairro Jardim",
    cliente: "Sabesp",
    ur: "UR1",
    status: "concluido",
    inicio: "2025-04-05",
    fim: "2025-12-18",
    responsavel: "Eng. Marina Cardoso",
    regiao: "Guarulhos — SP",
    progresso: 100,
    materiais: [],
  },
  {
    id: "c6",
    numero: "460024810",
    titulo: "Rede secundária — Anel viário",
    cliente: "Sanasa Municipal",
    ur: "UR2",
    status: "ativo",
    inicio: "2026-08-01",
    fim: "2028-03-30",
    responsavel: "Eng. Rafael Mendes",
    regiao: "Jundiaí — SP",
    progresso: 12,
    materiais: [
      { codigo: "PVC-150", descricao: "Tubo PVC PBA DN 150mm JE", umb: "m", categoria: "tubo", cronograma: gerarCronograma(130), estoqueAtual: 200, estoqueMinimo: 160 },
    ],
  },
];

export const locations: ServiceLocation[] = [
  { id: "l1", nome: "Trecho Av. Paranaguá KM 3", endereco: "Av. Paranaguá, 1240", cidade: "São Paulo", ur: "UR1", contratoId: "c1", contratoNumero: "460024801", status: "em_andamento", data: "2026-05-22", responsavel: "Equipe Alfa", materiaisUsados: 6, lat: -23.48, lng: -46.45 },
  { id: "l2", nome: "Cruzamento R. das Acácias",  endereco: "R. das Acácias, 88",  cidade: "São Paulo", ur: "UR1", contratoId: "c1", contratoNumero: "460024801", status: "planejado",   data: "2026-06-08", responsavel: "Equipe Beta",  materiaisUsados: 3, lat: -23.49, lng: -46.46 },
  { id: "l3", nome: "Setor DI-12",                endereco: "Rod. Dom Pedro I, KM 132", cidade: "Campinas", ur: "UR2", contratoId: "c2", contratoNumero: "460024802", status: "em_andamento", data: "2026-05-19", responsavel: "Equipe Gama",  materiaisUsados: 4, lat: -22.85, lng: -47.05 },
  { id: "l4", nome: "Largo do Mercado",            endereco: "Largo do Mercado, s/n",     cidade: "Santos",   ur: "UR3", contratoId: "c3", contratoNumero: "460024803", status: "em_andamento", data: "2026-05-15", responsavel: "Equipe Delta", materiaisUsados: 8, lat: -23.93, lng: -46.33 },
  { id: "l5", nome: "Quadra A — Aurora",           endereco: "Loteamento Aurora, Q.A",    cidade: "Cotia",    ur: "UR4", contratoId: "c4", contratoNumero: "460024798", status: "planejado",   data: "2026-07-02", responsavel: "Equipe Épsilon", materiaisUsados: 2, lat: -23.6, lng: -46.92 },
  { id: "l6", nome: "Adutora Jardim — Trecho Final", endereco: "R. Vinte e Oito, 410",   cidade: "Guarulhos", ur: "UR1", contratoId: "c5", contratoNumero: "460024795", status: "concluido",   data: "2025-12-12", responsavel: "Equipe Alfa",  materiaisUsados: 12, lat: -23.46, lng: -46.53 },
  { id: "l7", nome: "Anel Viário — Lote 4",        endereco: "Anel Viário Norte",         cidade: "Jundiaí",   ur: "UR2", contratoId: "c6", contratoNumero: "460024810", status: "planejado",   data: "2026-08-12", responsavel: "Equipe Gama",  materiaisUsados: 0, lat: -23.18, lng: -46.88 },
];

export function getContract(id: string): Contract | undefined {
  return contracts.find(c => c.id === id);
}

export function getUR(code: URCode): UR | undefined {
  return urs.find(u => u.code === code);
}

export function contractsByUR(code: URCode) {
  return contracts.filter(c => c.ur === code);
}

export function urStats(code: URCode) {
  const cs = contractsByUR(code);
  const ativos = cs.filter(c => c.status === "ativo").length;
  const atencao = cs.filter(c => c.status === "atencao").length;
  const totalMateriais = cs.reduce((s, c) => s + c.materiais.length, 0);
  const totalQty = cs.reduce((s, c) => s + c.materiais.reduce((ss, m) => ss + Object.values(m.cronograma).reduce((a, b) => a + b, 0), 0), 0);
  const locais = locations.filter(l => l.ur === code).length;
  const baixo = cs.reduce((s, c) => s + c.materiais.filter(m => m.estoqueAtual < m.estoqueMinimo).length, 0);
  return { contratos: cs.length, ativos, atencao, totalMateriais, totalQty, locais, baixo };
}

export function getAllMaterials() {
  const map = new Map<string, Material & { contratos: string[]; urs: URCode[] }>();
  contracts.forEach(c => {
    c.materiais.forEach(m => {
      const existing = map.get(m.codigo);
      if (existing) {
        existing.contratos.push(c.numero);
        if (!existing.urs.includes(c.ur)) existing.urs.push(c.ur);
      } else {
        map.set(m.codigo, { ...m, contratos: [c.numero], urs: [c.ur] });
      }
    });
  });
  return Array.from(map.values());
}

export const statusLabels: Record<ContractStatus, string> = {
  ativo: "Ativo",
  pausado: "Pausado",
  concluido: "Concluído",
  atencao: "Atenção",
};

export function formatMes(m: string): string {
  const [ano, mes] = m.split("-");
  const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${nomes[parseInt(mes) - 1]}/${ano.slice(2)}`;
}
