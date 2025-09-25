import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { supabase } from "@/integrations/supabase/client";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
  }
}

interface WorkOrderPDF {
  id: string;
  code: string;
  type: string;
  status: string;
  priority: string;
  scheduled_date: string;
  started_at?: string;
  completed_at?: string;
  description?: string;
  machine_down: boolean;
  equipments?: { name: string; code: string };
  maintainers?: Array<{ name: string; role?: string }>;
  parts?: Array<{ name: string; code: string; quantity_used: number }>;
  responsible?: string;
}

export const generateWorkOrderPDF = async (workOrder: WorkOrderPDF) => {
  const doc = new jsPDF();

  // ---------------- CABEÇALHO ----------------
  doc.setFillColor(20, 60, 100); // azul industrial discreto
  doc.rect(0, 0, 210, 20, "F");
  doc.setFontSize(16);
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.text("Ordem de Serviço", 105, 14, { align: "center" });

  let yPosition = 25;

  // ---------------- DETALHES PRINCIPAIS ----------------
  doc.setFontSize(11);
  doc.setTextColor(0);

  autoTable(doc, {
    startY: yPosition,
    head: [["Código", "Tipo", "Status", "Prioridade", "Equipamento"]],
    body: [
      [
        workOrder.code,
        workOrder.type,
        getStatusLabel(workOrder.status),
        capitalizeFirstLetter(workOrder.priority),
        workOrder.equipments?.name || "N/A",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 10, cellPadding: 3 },
    didParseCell: (data) => {
      // Destaque de status
      if (data.section === "body" && data.column.index === 2) {
        const status = workOrder.status;
        if (status === "finalizada") data.cell.styles.textColor = [39, 174, 96]; // verde
        else if (status === "em_andamento") data.cell.styles.textColor = [41, 128, 185]; // azul
        else if (status === "cancelada") data.cell.styles.textColor = [192, 57, 43]; // vermelho
      }
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 5;

  // ---------------- DATAS ----------------
  autoTable(doc, {
    startY: yPosition,
    head: [["Data Programada", "Início", "Conclusão", "Máquina Parada"]],
    body: [
      [
        new Date(workOrder.scheduled_date).toLocaleDateString("pt-BR"),
        workOrder.started_at ? new Date(workOrder.started_at).toLocaleDateString("pt-BR") : "Não iniciada",
        workOrder.completed_at ? new Date(workOrder.completed_at).toLocaleDateString("pt-BR") : "Não concluída",
        workOrder.machine_down ? "Sim" : "Não",
      ],
    ],
    theme: "grid",
    headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: "bold" },
    alternateRowStyles: { fillColor: [245, 245, 245] },
    styles: { fontSize: 10, cellPadding: 3 },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 5;

  // ---------------- DESCRIÇÃO ----------------
  if (workOrder.description) {
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text("Descrição:", 14, yPosition);
    yPosition += 3;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    const descriptionHeight = 20;
    doc.rect(12, yPosition, 186, descriptionHeight); // caixa descrição
    doc.text(doc.splitTextToSize(workOrder.description, 180), 14, yPosition + 6);

    yPosition += descriptionHeight + 5;
  }

  // ---------------- MANUTENTORES ----------------
  if (workOrder.maintainers && workOrder.maintainers.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [["Nome", "Função"]],
      body: workOrder.maintainers.map((m) => [m.name, m.role || "N/A"]),
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 3 },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 5;
  }

  // ---------------- PEÇAS ----------------
  if (workOrder.parts && workOrder.parts.length > 0) {
    autoTable(doc, {
      startY: yPosition,
      head: [["Código", "Nome", "Quantidade"]],
      body: workOrder.parts.map((p) => [p.code, p.name, p.quantity_used.toString()]),
      theme: "grid",
      headStyles: { fillColor: [50, 50, 50], textColor: 255, fontStyle: "bold" },
      alternateRowStyles: { fillColor: [245, 245, 245] },
      styles: { fontSize: 10, cellPadding: 3 },
    });
    yPosition = (doc as any).lastAutoTable.finalY + 5;
  }

  // ---------------- ASSINATURA ----------------
  yPosition += 15;
  doc.setLineWidth(0.3);
  doc.setDrawColor(120, 120, 120);
  doc.line(40, yPosition, 160, yPosition); // linha de assinatura
  doc.setFontSize(10);
  doc.setTextColor(80);
  doc.text("Assinatura do Responsável", 100, yPosition + 6, { align: "center" });

  // ---------------- RODAPÉ ----------------
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(`Sistema de Manutenção Industrial`, 105, 285, { align: "center" });

  // ---------------- SALVAR NO SUPABASE ----------------
  const pdfBlob = doc.output("blob");
  const pdfFile = new File([pdfBlob], `OS_${workOrder.code}.pdf`, { type: "application/pdf" });

  const { data, error } = await supabase.storage
    .from("ordens_servico")
    .upload(`pdfs/OS_${workOrder.code}.pdf`, pdfFile, { cacheControl: "3600", upsert: true, contentType: "application/pdf" });

  if (error) {
    console.error("❌ Erro ao salvar PDF no Supabase:", error.message);
  } else {
    console.log("✅ PDF salvo no Supabase:", data);
  }

  // ---------------- DOWNLOAD LOCAL ----------------
  doc.save(`OS_${workOrder.code}.pdf`);
};

// ---------------- FUNÇÕES AUXILIARES ----------------
const getStatusLabel = (status: string) => {
  switch (status) {
    case "programada": return "Programada";
    case "em_andamento": return "Em Andamento";
    case "finalizada": return "Finalizada";
    case "cancelada": return "Cancelada";
    default: return status;
  }
};

const capitalizeFirstLetter = (text?: string) => text ? text.charAt(0).toUpperCase() + text.slice(1) : "";
