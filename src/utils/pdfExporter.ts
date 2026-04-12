import { jsPDF } from 'jspdf';

interface PDFExportData {
  clientName: string;
  rg?: string;
  cpf?: string;
  profession?: string;
  referral?: string;
  shoeType?: string;
  workPosture?: string;
  allergies?: string;
  medications?: string;
  recentSurgeries?: string;
  preProcedureNotes?: string;
  professionalObservations?: string;
  nailType?: string;
  footMarks?: string; // base64
  patientSignatureUrl?: string; // base64
  professionalSignatureUrl?: string; // base64
  history: Record<string, boolean>;
  evalConditions: Record<string, boolean>;
  date: string;
  logoUrl?: string;
}

const HISTORY_LABELS: Record<string, string> = {
  hypertension: 'Hipo/Hipertensão',
  diabetes: 'Diabetes',
  leprosy: 'Hanseníase',
  pacemaker: 'Marca-passo',
  smokingAlcoholism: 'Tabagismo/Etilismo',
  vascularDisease: 'Doença Vascular',
  oncology: 'Doença Oncológica',
  renalDisorder: 'Distúrbio Renal',
  hormonalDisorder: 'Distúrbio Hormonal',
  intestinalDisorder: 'Distúrbio Intestinal',
  cardiopathy: 'Cardiopatia',
  neuropathy: 'Neuropatia',
  hepatitis: 'Hepatite',
  hivStd: 'HIV / DST',
  epilepsy: 'Epilepsia',
  pregnantLactating: 'Gestante ou Lactante',
};

const EVAL_LABELS: Record<string, string> = {
  dryness: 'Ressecamento',
  cracks: 'Rachadura / Fissura',
  nailOnychomycosis: 'Onicomicose Ungueal',
  plantarOnychomycosis: 'Onicomicose Plantar',
  tineaPedis: 'Tinea Pedis',
  onychophosis: 'Onicofose',
  onychocryptosis: 'Onicocriptose',
  granuloma: 'Granuloma',
  hyperhidrosis: 'Hiperidrose',
  anhidrosis: 'Anidrose',
  dyshidrosis: 'Desidrose',
  psoriasis: 'Psoríase',
  calluses: 'Calos e Calosidades',
  hyperkeratosis: 'Hiperqueratose',
  bromidrosis: 'Bromidrose',
  exostosis: 'Exostose',
  warts: 'Verruga',
  incorrectCut: 'Corte Incorreto',
};

export const exportPodologyToPDF = async (data: PDFExportData) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  let y = 15;

  // Clinic Logo Helper
  const addImageFromUrl = async (url: string, x: number, y: number, w: number, h: number) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = "Anonymous";
      img.onload = () => {
        try {
          doc.addImage(img, 'PNG', x, y, w, h);
          resolve(true);
        } catch (e) {
          console.error('Image add error:', e);
          resolve(false);
        }
      };
      img.onerror = () => resolve(false);
      img.src = url;
    });
  };

  // 0. Logo and Header
  if (data.logoUrl) {
    await addImageFromUrl(data.logoUrl, 15, y, 30, 30);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FICHA ANAMNESE', 55, y + 15);
    doc.setFontSize(14);
    doc.text('(PODOLOGIA)', 55, y + 22);
    y += 35;
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FICHA ANAMNESE (PODOLOGIA)', pageWidth / 2, y + 10, { align: 'center' });
    y += 25;
  }

  // 1. DADOS PESSOAIS
  doc.setFillColor(30, 30, 30);
  doc.rect(15, y, pageWidth - 30, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text('1. DADOS PESSOAIS', 20, y + 5);
  y += 12;

  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);
  doc.text(`Nome: ${data.clientName}`, 20, y);
  doc.text(`DN: ${data.date}`, 150, y); // Using current date as DN placeholder if not available
  y += 7;
  doc.text(`RG: ${data.rg || '_________________'}`, 20, y);
  doc.text(`CPF: ${data.cpf || '_________________'}`, pageWidth / 2, y);
  y += 7;
  doc.text(`Profissão: ${data.profession || '_________________'}`, 20, y);
  doc.text(`Indicação: ${data.referral || '_________________'}`, pageWidth / 2, y);
  y += 10;

  // 2. HISTÓRICO DE SAÚDE (2 columns to match paper)
  doc.setFillColor(30, 30, 30);
  doc.rect(15, y, pageWidth - 30, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('2. HISTÓRICO DE SAÚDE', 20, y + 5);
  y += 12;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  const historyItems = Object.entries(HISTORY_LABELS);
  const midPoint = Math.ceil(historyItems.length / 2);
  const col1 = historyItems.slice(0, midPoint);
  const col2 = historyItems.slice(midPoint);

  let tempY = y;
  col1.forEach(([key, label]) => {
    const isChecked = data.history[key];
    doc.rect(20, tempY - 3, 3, 3);
    if (isChecked) doc.text('X', 20.5, tempY - 0.5);
    doc.text(label, 26, tempY);
    tempY += 6;
  });

  tempY = y;
  col2.forEach(([key, label]) => {
    const isChecked = data.history[key];
    doc.rect(pageWidth / 2, tempY - 3, 3, 3);
    if (isChecked) doc.text('X', pageWidth / 2 + 0.5, tempY - 0.5);
    doc.text(label, pageWidth / 2 + 6, tempY);
    tempY += 6;
  });
  y = tempY + 5;

  // 3. INFORMAÇÕES ADICIONAIS
  doc.setFillColor(30, 30, 30);
  doc.rect(15, y, pageWidth - 30, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('3. INFORMAÇÕES ADICIONAIS', 20, y + 5);
  y += 12;

  doc.setTextColor(0, 0, 0);
  doc.setFont('helvetica', 'normal');
  doc.text(`Tipo de calçado que mais usa: ${data.shoeType || '_________________'}`, 20, y); y += 7;
  doc.text(`Postura preponderante: ${data.workPosture === 'sitting' ? '[X] Sentado [ ] Em pé' : data.workPosture === 'standing' ? '[ ] Sentado [X] Em pé' : '[ ] Sentado [ ] Em pé'}`, 20, y); y += 7;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Algum problema que seja necessário informar antes do procedimento? Especifique:', 20, y); y += 6;
  doc.setFont('helvetica', 'normal');
  const preProcLines = doc.splitTextToSize(data.preProcedureNotes || 'Nenhuma observação informada.', pageWidth - 40);
  doc.text(preProcLines, 20, y);
  y += (preProcLines.length * 5) + 10;

  // 4. AVALIAÇÃO TÉCNICA (Back of the paper)
  if (y > 200) { doc.addPage(); y = 20; }
  doc.setFillColor(30, 30, 30);
  doc.rect(15, y, pageWidth - 30, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('4. AVALIAÇÃO TÉCNICA', 20, y + 5);
  y += 12;

  doc.setTextColor(0, 0, 0);
  doc.text(`TIPO DA UNHA: ${data.nailType || 'Normal'}`, 20, y);
  y += 10;

  const evalItems = Object.entries(EVAL_LABELS);
  const evalMid = Math.ceil(evalItems.length / 2);
  const evalCol1 = evalItems.slice(0, evalMid);
  const evalCol2 = evalItems.slice(evalMid);

  startY = y;
  evalCol1.forEach(([key, label]) => {
    const isChecked = data.evalConditions[key];
    doc.rect(20, y - 3, 3, 3);
    if (isChecked) doc.text('X', 20.5, y - 0.5);
    doc.text(label, 26, y);
    y += 6;
  });

  tempY = startY;
  evalCol2.forEach(([key, label]) => {
    const isChecked = data.evalConditions[key];
    doc.rect(pageWidth / 2, tempY - 3, 3, 3);
    if (isChecked) doc.text('X', pageWidth / 2 + 0.5, tempY - 0.5);
    doc.text(label, pageWidth / 2 + 6, tempY);
    tempY += 6;
  });
  y = Math.max(y, tempY) + 10;

  // FOOT MAP
  if (data.footMarks) {
    if (y > 180) { doc.addPage(); y = 20; }
    doc.setFont('helvetica', 'bold');
    doc.text('MAPEAMENTO VISUAL (PD/PE):', 20, y);
    y += 8;
    try {
      doc.addImage(data.footMarks, 'PNG', 45, y, pageWidth - 90, 80);
      y += 90;
    } catch (e) {
      console.error('Error adding footmarks:', e);
    }
  }

  // PROFESSIONAL OBS
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVAÇÕES DO PROFISSIONAL:', 20, y);
  y += 7;
  doc.setFont('helvetica', 'normal');
  const obsLines = doc.splitTextToSize(data.professionalObservations || 'Sem observações adicionais.', pageWidth - 40);
  doc.text(obsLines, 20, y);
  y += (obsLines.length * 5) + 25;

  // SIGNATURES
  if (y > 250) { doc.addPage(); y = 20; }
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.line(20, y, 90, y);
  doc.text('Assinatura do Paciente', 55, y + 5, { align: 'center' });
  if (data.patientSignatureUrl) doc.addImage(data.patientSignatureUrl, 'PNG', 25, y - 20, 60, 18);

  doc.line( pageWidth - 90, y, pageWidth - 20, y);
  doc.text('Assinatura do Profissional', pageWidth - 55, y + 5, { align: 'center' });
  if (data.professionalSignatureUrl) doc.addImage(data.professionalSignatureUrl, 'PNG', pageWidth - 85, y - 20, 60, 18);

  const fileName = `Anamnese_${data.clientName.replace(/\s+/g, '_')}_${data.date.replace(/\//g, '-')}.pdf`;
  doc.save(fileName);
};
