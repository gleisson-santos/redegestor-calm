export type ContractStatus = "ativo" | "pausado" | "concluido" | "atencao";

export interface Material {
  codigo: string;
  descricao: string;
  umb: string;
  categoria: "tubo" | "conexao" | "registro" | "acessorio";
  cronograma: Record<string, number>; // ex: "2026-01": 120
  estoqueAtual: number;
  estoqueMinimo: number;
}

export interface Contract {
  id: string;
  numero: string;
  titulo: string;
  cliente: string;
  status: ContractStatus;
  inicio: string;
  fim: string;
  responsavel: string;
  regiao: string;
  progresso: number;
  materiais: Material[];
}

export interface ServiceLocation {
  id: string;
  nome: string;
  endereco: string;
  cidade: string;
  contratoId: string;
  contratoNumero: string;
  status: "planejado" | "em_andamento" | "concluido";
  data: string;
  responsavel: string;
  materiaisUsados: number;
  lat: number;
  lng: number;
}

const meses2026 = ["2026-01","2026-02","2026-03","2026-04","2026-05","2026-06","2026-07","2026-08","2026-09","2026-10","2026-11","2026-12"];
const meses2027 = meses2026.map(m => m.replace("2026", "2027"));
const meses2028 = meses2026.map(m => m.replace("2026", "2028"));
const todosMeses = [...meses2026, ...meses2027, ...meses2028];

function gerarCronograma(base: number, variacao = 0.4): Record<string, number> {
  const c: Record<string, number> = {};
  todosMeses.forEach((m, i) => {
    const decay = 1 - i * 0.012;
    const noise = 1 + (Math.sin(i * 1.7) * variacao);
    c[m] = Math.max(0, Math.round(base * decay * noise));
  });
  return c;
}

export const contracts: Contract[] = [
  {
    id: "c1",
    numero: "460024801",
    titulo: "Extensão de rede — Setor Norte",
    cliente: "Companhia de Saneamento Estadual",
    status: "ativo",
    inicio: "2026-01-15",
    fim: "2028-12-30",
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
    status: "ativo",
    inicio: "2026-03-01",
    fim: "2027-09-15",
    responsavel: "Eng. Rafael Mendes",
    regiao: "Distrito Industrial — Campinas",
    progresso: 18,
    materiais: [
      { codigo: "PEAD-110", descricao: "Tubo PEAD PE100 DN 110mm PN10", umb: "m", categoria: "tubo", cronograma: gerarCronograma(200), estoqueAtual: 340, estoqueMinimo: 250 },
      { codigo: "TFD-200", descricao: "Tubo Ferro Dúctil DN 200mm K9", umb: "m", categoria: "tubo", cronograma: gerarCronograma(110), estoqueAtual: 88, estoqueMinimo: 150 },
      { codigo: "REG-B100", descricao: "Registro Borboleta DN 100", umb: "un", categoria: "registro", cronograma: gerarCronograma(10), estoqueAtual: 22, estoqueMinimo: 10 },
    ],
  },
  {
    id: "c3",
    numero: "460024803",
    titulo: "Substituição de rede — Centro Histórico",
    cliente: "Companhia de Saneamento Estadual",
    status: "atencao",
    inicio: "2026-02-10",
    fim: "2026-12-20",
    responsavel: "Eng. Beatriz Lima",
    regiao: "Centro — Santos",
    progresso: 62,
    materiais: [
      { codigo: "PVC-100", descricao: "Tubo PVC PBA DN 100mm JE", umb: "m", categoria: "tubo", cronograma: gerarCronograma(140), estoqueAtual: 45, estoqueMinimo: 180 },
      { codigo: "CON-T75", descricao: "Tê 90° PVC DN 75", umb: "un", categoria: "conexao", cronograma: gerarCronograma(28), estoqueAtual: 12, estoqueMinimo: 30 },
    ],
  },
  {
    id: "c4",
    numero: "460024798",
    titulo: "Rede primária — Loteamento Aurora",
    cliente: "Construtora Aurora Ltda.",
    status: "pausado",
    inicio: "2025-11-20",
    fim: "2027-04-10",
    responsavel: "Eng. Tiago Ferraz",
    regiao: "Cotia — SP",
    progresso: 22,
    materiais: [
      { codigo: "PEAD-063", descricao: "Tubo PEAD PE100 DN 63mm PN10", umb: "m", categoria: "tubo", cronograma: gerarCronograma(90), estoqueAtual: 280, estoqueMinimo: 150 },
    ],
  },
  {
    id: "c5",
    numero: "460024795",
    titulo: "Recuperação de adutora — Bairro Jardim",
    cliente: "Sabesp",
    status: "concluido",
    inicio: "2025-04-05",
    fim: "2025-12-18",
    responsavel: "Eng. Marina Cardoso",
    regiao: "Guarulhos — SP",
    progresso: 100,
    materiais: [],
  },
];

export const locations: ServiceLocation[] = [
  { id: "l1", nome: "Trecho Av. Paranaguá KM 3", endereco: "Av. Paranaguá, 1240", cidade: "São Paulo", contratoId: "c1", contratoNumero: "460024801", status: "em_andamento", data: "2026-04-22", responsavel: "Equipe Alfa", materiaisUsados: 6, lat: -23.48, lng: -46.45 },
  { id: "l2", nome: "Cruzamento R. das Acácias", endereco: "R. das Acácias, 88", cidade: "São Paulo", contratoId: "c1", contratoNumero: "460024801", status: "planejado", data: "2026-05-08", responsavel: "Equipe Beta", materiaisUsados: 3, lat: -23.49, lng: -46.46 },
  { id: "l3", nome: "Setor DI-12", endereco: "Rod. Dom Pedro I, KM 132", cidade: "Campinas", contratoId: "c2", contratoNumero: "460024802", status: "em_andamento", data: "2026-04-19", responsavel: "Equipe Gama", materiaisUsados: 4, lat: -22.85, lng: -47.05 },
  { id: "l4", nome: "Largo do Mercado", endereco: "Largo do Mercado, s/n", cidade: "Santos", contratoId: "c3", contratoNumero: "460024803", status: "em_andamento", data: "2026-04-15", responsavel: "Equipe Delta", materiaisUsados: 8, lat: -23.93, lng: -46.33 },
  { id: "l5", nome: "Quadra A — Aurora", endereco: "Loteamento Aurora, Q.A", cidade: "Cotia", contratoId: "c4", contratoNumero: "460024798", status: "planejado", data: "2026-06-02", responsavel: "Equipe Épsilon", materiaisUsados: 2, lat: -23.6, lng: -46.92 },
  { id: "l6", nome: "Adutora Jardim — Trecho Final", endereco: "R. Vinte e Oito, 410", cidade: "Guarulhos", contratoId: "c5", contratoNumero: "460024795", status: "concluido", data: "2025-12-12", responsavel: "Equipe Alfa", materiaisUsados: 12, lat: -23.46, lng: -46.53 },
];

export function getContract(id: string): Contract | undefined {
  return contracts.find(c => c.id === id);
}

export function getAllMaterials() {
  const map = new Map<string, Material & { contratos: string[] }>();
  contracts.forEach(c => {
    c.materiais.forEach(m => {
      const existing = map.get(m.codigo);
      if (existing) {
        existing.contratos.push(c.numero);
      } else {
        map.set(m.codigo, { ...m, contratos: [c.numero] });
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

export const meses = todosMeses;
export const mesesPorAno = { "2026": meses2026, "2027": meses2027, "2028": meses2028 };

export function formatMes(m: string): string {
  const [ano, mes] = m.split("-");
  const nomes = ["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
  return `${nomes[parseInt(mes) - 1]}/${ano.slice(2)}`;
}
