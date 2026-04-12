import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

interface PDFExportData {
  clientName: string;
  rg?: string;
  cpf?: string;
  profession?: string;
  referral?: string;
  shoeType?: string;
  allergies?: string;
  medications?: string;
  recentSurgeries?: string;
  specialNotes?: string;
  professionalObservations?: string;
  nailType?: string;
  footMarks?: string; // base64
  patientSignatureUrl?: string; // base64
  professionalSignatureUrl?: string; // base64
  history: Record<string, boolean>;
  evalConditions: Record<string, boolean>;
  date: string;
}

const HISTORY_LABELS: Record<string, string> = {
  hypertension: 'Hipertensão',
  diabetes: 'Diabetes',
  leprosy: 'Hanseníase',
  pacemaker: 'Marca-passo',
  smokingAlcoholism: 'Tabagismo/Alcoolismo',
  vascularDisease: 'Doença Vascular',
  oncology: 'Oncologia',
  renalDisorder: 'Distúrbio Renal',
  hormonalDisorder: 'Distúrbio Hormonal',
  intestinalDisorder: 'Distúrbio Intestinal',
  cardiopathy: 'Cardiopatia',
  neuropathy: 'Neuropatia',
  hepatitis: 'Hepatite',
  hivStd: 'HIV / DST',
  epilepsy: 'Epilepsia',
  pregnantLactating: 'Gestante/Lactante',
};

const EVAL_LABELS: Record<string, string> = {
  dryness: 'Ressecamento',
  cracks: 'Fissuras / Rachaduras',
  nailOnychomycosis: 'Onicomicose (Unha)',
  plantarOnychomycosis: 'Onicomicose (Plantar)',
  tineaPedis: 'Tinea Pedis (Frieira)',
  onychophosis: 'Onicofose',
  onychocryptosis: 'Onicocriptose (Encravada)',
  granuloma: 'Granuloma',
  hyperhidrosis: 'Hiperidrose',
  anhidrosis: 'Anidrose',
  dyshidrosis: 'Disidrose',
  psoriasis: 'Psoríase',
  calluses: 'Calos / Calosidades',
  hyperkeratosis: 'Hiperqueratose',
  bromidrosis: 'Bromidrose',
  exostosis: 'Exostose',
  warts: 'Verruga',
  incorrectCut: 'Corte Incorreto',
};

export const exportPodologyToPDF = async (data: PDFExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 20;

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('FICHA DE ANAMNESE (PODOLOGIA)', pageWidth / 2, y, { align: 'center' });
  y += 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Data da Avaliação: ${data.date}`, pageWidth / 2, y, { align: 'center' });
  y += 15;

  // 1. DADOS PESSOAIS
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('1. DADOS PESSOAIS', 20, y + 5.5);
  y += 12;

  doc.setFontSize(9);
  doc.text(`Nome: ${data.clientName}`, 20, y);
  y += 6;
  doc.text(`RG: ${data.rg || 'N/A'}`, 20, y);
  doc.text(`CPF: ${data.cpf || 'N/A'}`, 100, y);
  y += 6;
  doc.text(`Profissão: ${data.profession || 'N/A'}`, 20, y);
  doc.text(`Indicação: ${data.referral || 'N/A'}`, 100, y);
  y += 10;

  // 2. HISTÓRICO DE SAÚDE
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('2. HISTÓRICO DE SAÚDE', 20, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'normal');
  const historyItems = Object.entries(HISTORY_LABELS);
  let col = 0;
  let startY = y;
  historyItems.forEach(([key, label], index) => {
    const isChecked = data.history[key];
    const x = col === 0 ? 25 : col === 1 ? 70 : col === 2 ? 115 : 160;
    
    doc.rect(x - 5, y - 3, 3, 3); // Checkbox box
    if (isChecked) {
      doc.text('X', x - 4.5, y - 0.5);
    }
    doc.text(label, x, y);

    if ((index + 1) % 4 === 0) {
      y += 6;
      col = 0;
    } else {
      col++;
    }
  });
  y += 10;

  // 3. INFORMAÇÕES ADICIONAIS
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('3. INFORMAÇÕES ADICIONAIS', 20, y + 5.5);
  y += 12;

  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo de calçado: ${data.shoeType || 'N/A'}`, 20, y); y += 6;
  doc.text(`Alergias: ${data.allergies || 'Nenhum'}`, 20, y); y += 6;
  doc.text(`Medicamentos: ${data.medications || 'Nenhum'}`, 20, y); y += 6;
  doc.text(`Cirurgias Recentes: ${data.recentSurgeries || 'N/A'}`, 20, y); y += 10;

  // 4. AVALIAÇÃO TÉCNICA
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFillColor(240, 240, 240);
  doc.rect(15, y, pageWidth - 30, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.text('4. AVALIAÇÃO TÉCNICA', 20, y + 5.5);
  y += 12;

  doc.text(`Tipo de Unha: ${data.nailType || 'N/A'}`, 20, y);
  y += 8;

  const evalItems = Object.entries(EVAL_LABELS);
  col = 0;
  evalItems.forEach(([key, label], index) => {
    const isChecked = data.evalConditions[key];
    const x = col === 0 ? 25 : col === 1 ? 85 : 145;
    
    doc.rect(x - 5, y - 3, 3, 3);
    if (isChecked) doc.text('X', x - 4.5, y - 0.5);
    doc.text(label, x, y);

    if ((index + 1) % 3 === 0) {
      y += 6;
      col = 0;
    } else {
      col++;
    }
  });
  y += 10;

  // FOOT MAP
  if (data.footMarks) {
    if (y > 200) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('MAPEAMENTO VISUAL (PD/PE):', 20, y);
    y += 5;
    try {
      doc.addImage(data.footMarks, 'PNG', 40, y, 120, 90);
      y += 95;
    } catch (e) {
      console.error('Error adding footmarks to PDF:', e);
    }
  }

  // OBSERVATIONS
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES DO PROFISSIONAL:', 20, y);
  y += 6;
  doc.setFont('helvetica', 'normal');
  const obsLines = doc.splitTextToSize(data.professionalObservations || 'Sem observações adicionais.', pageWidth - 40);
  doc.text(obsLines, 20, y);
  y += (obsLines.length * 5) + 15;

  // SIGNATURES
  if (y > 240) { doc.addPage(); y = 20; }
  
  // Patient Sig
  doc.line(20, y, 90, y);
  doc.text('Assinatura do Paciente', 55, y + 5, { align: 'center' });
  if (data.patientSignatureUrl) {
    doc.addImage(data.patientSignatureUrl, 'PNG', 25, y - 25, 60, 20);
  }

  // Professional Sig
  doc.line(120, y, 190, y);
  doc.text('Assinatura do Profissional', 155, y + 5, { align: 'center' });
  if (data.professionalSignatureUrl) {
    doc.addImage(data.professionalSignatureUrl, 'PNG', 125, y - 25, 60, 20);
  }

  const fileName = `Anamnese_${data.clientName.replace(/\s+/g, '_')}_${data.date.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
