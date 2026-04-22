/**
 * Bundle isolado do jsPDF — carregado dinamicamente apenas quando
 * o usuário clica em "Exportar PDF".
 */
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import type { MedicaoMensal, ObraDetalhe } from "@/data/encargos";

const fmtBRL = (n: number) => n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

export function exportRelatorioPDF(opts: {
  urFilter: string;
  mesFilter: string;
  rows: MedicaoMensal[];
}) {
  const { urFilter, mesFilter, rows } = opts;
  const doc = new jsPDF();
  const dt = new Date().toLocaleString("pt-BR");
  doc.setFontSize(16);
  doc.text("Relatório de Medição Mensal", 14, 18);
  doc.setFontSize(10);
  doc.text(`UR: ${urFilter}   |   Mês: ${mesFilter || "—"}`, 14, 26);
  doc.text(`Gerado em ${dt}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["UR", "Mês Referência", "Valor Total", "Status"]],
    body: rows.map(m => [m.ur, m.mes_referencia, fmtBRL(Number(m.valor_total)), m.status]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    didDrawPage: (data: { pageNumber: number }) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`${dt}   —   Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    },
  });
  doc.save(`relatorio_medicoes_${new Date().toISOString().slice(0, 10)}.pdf`);
}

export function exportDetalhePDF(opts: {
  medicao: MedicaoMensal;
  obras: ObraDetalhe[];
}) {
  const { medicao, obras } = opts;
  const doc = new jsPDF();
  const dt = new Date().toLocaleString("pt-BR");
  doc.setFontSize(16);
  doc.text("Detalhe da Medição", 14, 18);
  doc.setFontSize(10);
  doc.text(`UR: ${medicao.ur}   |   Mês: ${medicao.mes_referencia}   |   Total: ${fmtBRL(Number(medicao.valor_total))}`, 14, 26);
  doc.text(`Status: ${medicao.status}   |   Gerado em ${dt}`, 14, 32);

  autoTable(doc, {
    startY: 38,
    head: [["Logradouro", "Bairro", "Valor da Obra"]],
    body: obras.map(o => [o.logradouro, o.bairro, fmtBRL(o.valor_total)]),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [37, 99, 235] },
    didDrawPage: (data: { pageNumber: number }) => {
      const pageCount = doc.getNumberOfPages();
      doc.setFontSize(8);
      doc.text(`${dt}   —   Página ${data.pageNumber} de ${pageCount}`,
        doc.internal.pageSize.getWidth() / 2, doc.internal.pageSize.getHeight() - 8, { align: "center" });
    },
  });
  doc.save(`detalhe_${medicao.ur}_${medicao.mes_referencia}.pdf`);
}
