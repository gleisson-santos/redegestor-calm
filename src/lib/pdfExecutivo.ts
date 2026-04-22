import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { Obra } from "@/data/api";
import { urs } from "@/data/mockData";
import { urStats } from "@/data/api";

interface ComparativoMes {
  obrasConcluidas: { atual: number; anterior: number };
  extensaoExecutada: { atual: number; anterior: number };
  alvarasLiberados: { atual: number; anterior: number };
}

function variacao(a: number, b: number) {
  if (b === 0) return a > 0 ? "+100%" : "0%";
  const d = ((a - b) / b) * 100;
  return `${d >= 0 ? "+" : ""}${d.toFixed(1)}%`;
}

export function gerarRelatorioExecutivo(obras: Obra[], comp: ComparativoMes) {
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const W = 210;
  let y = 14;

  // Cabeçalho
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, W, 22, "F");
  doc.setTextColor(255);
  doc.setFontSize(14); doc.setFont("helvetica", "bold");
  doc.text("RedeGestor — Relatório Executivo", 12, 11);
  doc.setFontSize(9); doc.setFont("helvetica", "normal");
  const hoje = new Date();
  doc.text(hoje.toLocaleString("pt-BR"), W - 12, 11, { align: "right" });
  doc.setFontSize(8);
  doc.text("Painel gerencial de frentes de serviço — visão consolidada do mês", 12, 17);

  y = 28;
  doc.setTextColor(20);

  // KPIs principais
  const totalObras = obras.length;
  const concluidas = obras.filter(o => o.status === "concluida").length;
  const emExec = obras.filter(o => o.status === "em_execucao").length;
  const aguardando = obras.filter(o => o.alvaraNecessario && !o.alvaraLiberado).length;
  const extensaoTotal = obras.reduce((s, o) => s + o.extensaoM, 0);

  const kpis = [
    { label: "Total de obras", value: totalObras.toString() },
    { label: "Em execução", value: emExec.toString() },
    { label: "Concluídas", value: concluidas.toString() },
    { label: "Alvarás pendentes", value: aguardando.toString() },
    { label: "Extensão total (m)", value: Math.round(extensaoTotal).toLocaleString("pt-BR") },
  ];

  const cardW = (W - 24 - 4 * 4) / 5;
  kpis.forEach((k, i) => {
    const x = 12 + i * (cardW + 4);
    doc.setDrawColor(220); doc.setFillColor(248, 250, 252);
    doc.roundedRect(x, y, cardW, 18, 1.5, 1.5, "FD");
    doc.setFontSize(7); doc.setTextColor(100);
    doc.text(k.label.toUpperCase(), x + 2, y + 4);
    doc.setFontSize(13); doc.setFont("helvetica", "bold"); doc.setTextColor(20);
    doc.text(k.value, x + 2, y + 13);
    doc.setFont("helvetica", "normal");
  });
  y += 24;

  // Comparativo mensal
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Comparativo mensal — este mês vs. anterior", 12, y);
  y += 2;
  autoTable(doc, {
    startY: y + 2,
    margin: { left: 12, right: 12 },
    head: [["Indicador", "Mês atual", "Mês anterior", "Variação"]],
    body: [
      ["Obras concluídas", String(comp.obrasConcluidas.atual), String(comp.obrasConcluidas.anterior), variacao(comp.obrasConcluidas.atual, comp.obrasConcluidas.anterior)],
      ["Extensão executada (m)", Math.round(comp.extensaoExecutada.atual).toLocaleString("pt-BR"), Math.round(comp.extensaoExecutada.anterior).toLocaleString("pt-BR"), variacao(comp.extensaoExecutada.atual, comp.extensaoExecutada.anterior)],
      ["Alvarás liberados", String(comp.alvarasLiberados.atual), String(comp.alvarasLiberados.anterior), variacao(comp.alvarasLiberados.atual, comp.alvarasLiberados.anterior)],
    ],
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
    theme: "grid",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;

  // Top 5 obras críticas
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Top 5 obras críticas (prioridade alta, não iniciadas)", 12, y);
  const criticas = [...obras]
    .filter(o => o.status !== "em_execucao" && o.status !== "concluida")
    .sort((a, b) => a.prioridade - b.prioridade)
    .slice(0, 5);
  autoTable(doc, {
    startY: y + 2,
    margin: { left: 12, right: 12 },
    head: [["Pri", "UR", "Logradouro", "Bairro", "Material", "Extensão (m)", "Alvará"]],
    body: criticas.map(o => [
      `P${o.prioridade}`, o.ur, o.logradouro.slice(0, 38), o.bairro.slice(0, 22), o.material,
      Math.round(o.extensaoM).toLocaleString("pt-BR"),
      o.alvaraStatus === "liberado" ? "OK" : o.alvaraStatus === "pendente" ? "Pendente" : "N/A",
    ]),
    styles: { fontSize: 8, cellPadding: 1.6 },
    headStyles: { fillColor: [37, 99, 235], textColor: 255, fontSize: 8 },
    theme: "striped",
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  y = (doc as any).lastAutoTable.finalY + 6;

  // Distribuição por UR
  doc.setFontSize(10); doc.setFont("helvetica", "bold");
  doc.text("Distribuição por Unidade Regional", 12, y);
  autoTable(doc, {
    startY: y + 2,
    margin: { left: 12, right: 12 },
    head: [["UR", "Obras", "Extensão (m)", "Em exec.", "Aguard. alvará", "Concluídas", "% concluído"]],
    body: urs.map(u => {
      const s = urStats(obras, u.code);
      const pct = s.obras > 0 ? Math.round((s.concluidas / s.obras) * 100) : 0;
      return [u.code, String(s.obras), Math.round(s.extensaoM).toLocaleString("pt-BR"), String(s.emExecucao), String(s.aguardandoAlvara), String(s.concluidas), `${pct}%`];
    }),
    styles: { fontSize: 8.5, cellPadding: 1.8 },
    headStyles: { fillColor: [15, 23, 42], textColor: 255, fontSize: 8 },
    theme: "grid",
  });

  // Rodapé
  doc.setFontSize(7); doc.setTextColor(120);
  doc.text("Documento gerado automaticamente pelo RedeGestor", 12, 290);
  doc.text(`Página 1 de 1`, W - 12, 290, { align: "right" });

  doc.save(`relatorio-executivo-${hoje.toISOString().slice(0, 10)}.pdf`);
}
