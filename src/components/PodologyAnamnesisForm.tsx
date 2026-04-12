import React, { useState, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Save, FileText, User, ClipboardList, PenTool, ShieldCheck } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { api } from '../services/api';
import FootCanvas from './FootCanvas';
import { exportPodologyToPDF } from '../utils/pdfExporter';

interface PodologyAnamnesisFormProps {
  clientId: string;
  clientName: string;
  onClose: () => void;
  onSuccess: () => void;
}

const HISTORY_CHECKBOXES = [
  { id: 'hypertension', label: 'Hipertensão' },
  { id: 'diabetes', label: 'Diabetes' },
  { id: 'leprosy', label: 'Hanseníase' },
  { id: 'pacemaker', label: 'Marca-passo' },
  { id: 'smokingAlcoholism', label: 'Tabagismo/Alcoolismo' },
  { id: 'vascularDisease', label: 'Doença Vascular' },
  { id: 'oncology', label: 'Oncologia' },
  { id: 'renalDisorder', label: 'Distúrbio Renal' },
  { id: 'hormonalDisorder', label: 'Distúrbio Hormonal' },
  { id: 'intestinalDisorder', label: 'Distúrbio Intestinal' },
  { id: 'cardiopathy', label: 'Cardiopatia' },
  { id: 'neuropathy', label: 'Neuropatia' },
  { id: 'hepatitis', label: 'Hepatite' },
  { id: 'hivStd', label: 'HIV / DST' },
  { id: 'epilepsy', label: 'Epilepsia' },
  { id: 'pregnantLactating', label: 'Gestante/Lactante' },
];

const EVAL_CHECKBOXES = [
  { id: 'dryness', label: 'Ressecamento' },
  { id: 'cracks', label: 'Fissuras / Rachaduras' },
  { id: 'nailOnychomycosis', label: 'Onicomicose (Unha)' },
  { id: 'plantarOnychomycosis', label: 'Onicomicose (Plantar)' },
  { id: 'tineaPedis', label: 'Tinea Pedis (Frieira)' },
  { id: 'onychophosis', label: 'Onicofose' },
  { id: 'onychocryptosis', label: 'Onicocriptose (Encravada)' },
  { id: 'granuloma', label: 'Granuloma' },
  { id: 'hyperhidrosis', label: 'Hiperidrose' },
  { id: 'anhidrosis', label: 'Anidrose' },
  { id: 'dyshidrosis', label: 'Disidrose' },
  { id: 'psoriasis', label: 'Psoríase' },
  { id: 'calluses', label: 'Calos / Calosidades' },
  { id: 'hyperkeratosis', label: 'Hiperqueratose' },
  { id: 'bromidrosis', label: 'Bromidrose' },
  { id: 'exostosis', label: 'Exostose' },
  { id: 'warts', label: 'Verruga' },
  { id: 'incorrectCut', label: 'Corte Incorreto' },
];

const NAIL_TYPES = [
  'Normal', 'Telha', 'Funil', 'Gancho', 'Caracol', 'Torquês', 'Involuta', 'Cunha', 'Distrófica'
];

export default function PodologyAnamnesisForm({ clientId, clientName, onClose, onSuccess }: PodologyAnamnesisFormProps) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const sigPadPatient = useRef<any>(null);
  const sigPadProf = useRef<any>(null);

  const [formData, setFormData] = useState<any>({
    profession: '',
    referral: '',
    shoeType: '',
    rg: '',
    cpf: '',
    allergies: '',
    recentSurgeries: '',
    medications: '',
    specialNotes: '',
    professionalObservations: '',
    nailType: '',
    footMarks: '',
    disclaimerAccepted: false
  });

  // Handle Text Changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev: any) => ({ ...prev, [name]: value }));
  };

  // Handle Checkboxes
  const handleCheckbox = (id: string, value: boolean) => {
    setFormData((prev: any) => ({ ...prev, [id]: value }));
  };

  const handleSave = async () => {
    if (!formData.disclaimerAccepted) {
      alert("É necessário aceitar a declaração de veracidade antes de salvar.");
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...formData,
        clientId,
        patientSignatureUrl: sigPadPatient.current?.isEmpty() ? null : sigPadPatient.current?.getTrimmedCanvas().toDataURL('image/png'),
        professionalSignatureUrl: sigPadProf.current?.isEmpty() ? null : sigPadProf.current?.getTrimmedCanvas().toDataURL('image/png'),
      };
      await api.post('/podology-anamnesis', payload);
      alert('Ficha de Anamnese salva com sucesso!');
      onSuccess();
    } catch (err: any) {
      alert(`Erro ao salvar ficha: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    const history: any = {};
    HISTORY_CHECKBOXES.forEach(cb => {
      history[cb.id] = formData[cb.id] || false;
    });

    const evalConditions: any = {};
    EVAL_CHECKBOXES.forEach(cb => {
      evalConditions[cb.id] = formData[cb.id] || false;
    });

    exportPodologyToPDF({
      ...formData,
      clientName,
      history,
      evalConditions,
      date: new Date().toLocaleDateString('pt-BR'),
      patientSignatureUrl: sigPadPatient.current?.isEmpty() ? null : sigPadPatient.current?.getTrimmedCanvas().toDataURL('image/png'),
      professionalSignatureUrl: sigPadProf.current?.isEmpty() ? null : sigPadProf.current?.getTrimmedCanvas().toDataURL('image/png'),
    });
  };

  const steps = [
    { id: 1, label: 'Dados Pessoais', icon: <User size={18} /> },
    { id: 2, label: 'Histórico', icon: <ClipboardList size={18} /> },
    { id: 3, label: 'Informações Adicionais', icon: <FileText size={18} /> },
    { id: 4, label: 'Avaliação Técnica', icon: <PenTool size={18} /> },
    { id: 5, label: 'Finalização', icon: <ShieldCheck size={18} /> },
  ];

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2.5rem] shadow-premium w-full max-w-5xl max-h-[95vh] flex flex-col overflow-hidden border border-zinc-200">
        
        {/* Header */}
        <div className="flex items-center justify-between p-7 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h2 className="text-2xl font-black tracking-tight text-zinc-950 uppercase italic">Ficha de Anamnese (Podologia)</h2>
            <p className="text-sm font-medium text-zinc-500 flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Paciente: <span className="text-zinc-900 font-bold">{clientName}</span>
            </p>
          </div>
          <button onClick={onClose} className="p-3 hover:bg-zinc-200 rounded-full transition-all active:scale-95 bg-white border border-zinc-100 shadow-sm">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Improved Stepper */}
        <div className="flex items-center gap-4 p-6 bg-white border-b border-zinc-100 overflow-x-auto no-scrollbar">
          {steps.map((s) => (
            <React.Fragment key={s.id}>
              <button 
                onClick={() => setStep(s.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-2xl transition-all whitespace-nowrap ${
                  step === s.id 
                  ? 'bg-emerald-50 text-emerald-600 ring-1 ring-emerald-200 shadow-sm' 
                  : 'text-zinc-400 hover:text-zinc-600'
                }`}
              >
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors ${
                  step >= s.id ? 'bg-emerald-500 text-white shadow-md' : 'bg-zinc-100'
                }`}>
                  {s.icon}
                </div>
                <span className="text-sm font-bold tracking-tight">{s.label}</span>
              </button>
              {s.id < 5 && <div className="min-w-[20px] h-px bg-zinc-100" />}
            </React.Fragment>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/30">
          
          {/* STEP 1: DADOS PESSOAIS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-xl font-black text-zinc-900 uppercase italic">1. Dados Pessoais</h3>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Paciente</label>
                  <input type="text" disabled value={clientName} className="w-full px-5 py-4 bg-zinc-100 border-none rounded-2xl font-bold text-zinc-600 cursor-not-allowed uppercase" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">RG</label>
                  <input type="text" name="rg" value={formData.rg} onChange={handleChange} placeholder="00.000.000-0" className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">CPF</label>
                  <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} placeholder="000.000.000-00" className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Profissão</label>
                  <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" />
                </div>
                <div className="md:col-span-2 lg:col-span-3">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-2 ml-1">Indicação</label>
                  <input type="text" name="referral" value={formData.referral} onChange={handleChange} className="w-full px-5 py-4 bg-white border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: HISTÓRICO DE SAÚDE */}
          {step === 2 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-xl font-black text-zinc-900 uppercase italic">2. Histórico de Saúde</h3>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-7 rounded-[2rem] border border-zinc-100 shadow-premium">
                {HISTORY_CHECKBOXES.map(item => (
                  <label key={item.id} className="flex items-center gap-3 cursor-pointer group p-3 rounded-xl hover:bg-zinc-50 transition-colors">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData[item.id] || false}
                        onChange={(e) => handleCheckbox(item.id, e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-6 h-6 rounded-lg border-2 border-zinc-200 bg-white group-hover:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                        <CheckIcon size={14} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <span className="text-xs font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors select-none">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3: INFORMAÇÕES ADICIONAIS */}
          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-xl font-black text-zinc-900 uppercase italic">3. Informações Adicionais</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-8 rounded-[2rem] border border-zinc-100 shadow-premium">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Tipo de calçado que mais usa</label>
                  <input type="text" name="shoeType" value={formData.shoeType} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Alergias</label>
                  <textarea name="allergies" value={formData.allergies} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" rows={3} />
                </div>
                <div>
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Medicamentos em uso</label>
                  <textarea name="medications" value={formData.medications} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" rows={3} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Cirurgias Recentes</label>
                  <input type="text" name="recentSurgeries" value={formData.recentSurgeries} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Necessidade de informar antes do procedimento</label>
                  <textarea name="specialNotes" value={formData.specialNotes} onChange={handleChange} placeholder="Especifique qualquer condição relevante..." className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900" rows={3} />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: AVALIAÇÃO TÉCNICA E MAPA */}
          {step === 4 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-xl font-black text-zinc-900 uppercase italic">4. Avaliação Técnica & Mapeamento</h3>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                {/* Checkboxes List */}
                <div className="lg:col-span-2 space-y-6">
                  <div className="grid grid-cols-1 gap-3 bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-premium">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-2 border-b border-zinc-50 pb-2">Condições Observadas</p>
                    {EVAL_CHECKBOXES.map(item => (
                      <label key={item.id} className="flex items-center gap-3 cursor-pointer group p-1.5 rounded-lg hover:bg-zinc-50 transition-colors">
                        <div className="relative flex items-center">
                          <input 
                            type="checkbox" 
                            checked={formData[item.id] || false}
                            onChange={(e) => handleCheckbox(item.id, e.target.checked)}
                            className="peer sr-only"
                          />
                          <div className="w-5 h-5 rounded border-2 border-zinc-200 bg-white group-hover:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                            <CheckIcon size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                          </div>
                        </div>
                        <span className="text-[11px] font-bold text-zinc-600 uppercase tracking-tight group-hover:text-zinc-900 transition-colors select-none">
                          {item.label}
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-premium">
                    <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Tipo da Unha</label>
                    <select name="nailType" value={formData.nailType} onChange={handleChange} className="w-full px-5 py-4 bg-zinc-50 border border-zinc-200 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-bold text-zinc-900 uppercase text-xs">
                      <option value="">Selecione...</option>
                      {NAIL_TYPES.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Foot Map Canvas */}
                <div className="lg:col-span-3">
                  <div className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-premium h-full">
                    <p className="text-xs font-black text-zinc-400 uppercase tracking-widest mb-4 border-b border-zinc-50 pb-2">Mapeamento dos Pés (PD / PE)</p>
                    <FootCanvas 
                      initialData={formData.footMarks}
                      onChange={(data) => handleCheckbox('footMarks', data)}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* STEP 5: FINALIZAÇÃO E ASSINATURAS */}
          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-1.5 h-6 bg-emerald-500 rounded-full" />
                <h3 className="text-xl font-black text-zinc-900 uppercase italic">5. Finalização e Assinaturas</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-xs font-black text-zinc-500 uppercase tracking-widest mb-3 ml-1">Observações do Profissional</label>
                  <textarea name="professionalObservations" value={formData.professionalObservations} onChange={handleChange} className="w-full px-6 py-5 bg-white border border-zinc-200 rounded-[2rem] focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 transition-all font-medium text-zinc-900 shadow-sm" rows={4} placeholder="Anotações técnicas complementares..." />
                </div>

                <div className="md:col-span-2 bg-amber-50 border-2 border-amber-200 rounded-[2.5rem] p-8 shadow-sm">
                  <label className="flex items-start gap-4 cursor-pointer group">
                    <div className="relative flex items-center mt-1">
                      <input 
                        type="checkbox" 
                        checked={formData.disclaimerAccepted}
                        onChange={(e) => handleCheckbox('disclaimerAccepted', e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-8 h-8 rounded-xl border-3 border-amber-400 bg-white group-hover:border-amber-600 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center shadow-sm">
                        <CheckIcon size={18} className="text-white opacity-0 peer-checked:opacity-100 font-black" />
                      </div>
                    </div>
                    <p className="text-xs font-bold text-amber-900 leading-relaxed uppercase tracking-normal">
                      Declaro que as informações acima são verdadeiras, não cabendo ao profissional a responsabilidade por informações omitidas nesta avaliação. Estou ciente e de acordo com os procedimentos envolvidos.
                    </p>
                  </label>
                </div>

                <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-6 shadow-premium">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center mb-6">Assinatura do Paciente</p>
                  <div className="border-3 border-dashed border-zinc-100 rounded-[2rem] bg-zinc-50 overflow-hidden">
                    <SignatureCanvas ref={sigPadPatient} penColor="black" clearOnResize={false}
                      canvasProps={{ className: 'w-full h-48' }} />
                  </div>
                  <button onClick={() => sigPadPatient.current?.clear()} className="w-full py-3 text-[10px] font-black text-rose-500 uppercase tracking-widest mt-4 hover:bg-rose-50 rounded-xl transition-colors">Limpar Assinatura</button>
                </div>
                
                <div className="bg-white border-2 border-zinc-100 rounded-[2.5rem] p-6 shadow-premium">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] text-center mb-6">Assinatura do Profissional</p>
                  <div className="border-3 border-dashed border-zinc-100 rounded-[2rem] bg-zinc-50 overflow-hidden">
                    <SignatureCanvas ref={sigPadProf} penColor="#065f46" clearOnResize={false}
                      canvasProps={{ className: 'w-full h-48' }} />
                  </div>
                  <button onClick={() => sigPadProf.current?.clear()} className="w-full py-3 text-[10px] font-black text-rose-500 uppercase tracking-widest mt-4 hover:bg-rose-50 rounded-xl transition-colors">Limpar Assinatura</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Navigation */}
        <div className="p-7 border-t border-zinc-100 bg-white flex items-center justify-between">
          <button
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1}
            className="px-8 py-4 font-black text-xs uppercase tracking-widest text-zinc-500 hover:bg-zinc-100 rounded-2xl transition-all disabled:opacity-0 flex items-center gap-2"
          >
            <ChevronLeft size={20} strokeWidth={3} /> Anterior
          </button>
          
          {step < 5 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              className="px-10 py-5 font-black text-xs uppercase tracking-widest text-white bg-zinc-950 hover:bg-zinc-800 shadow-xl shadow-zinc-200 rounded-2xl transition-all active:scale-95 flex items-center gap-3 translate-x-[-50%] absolute left-[50%]"
            >
              Próximo Passo <ChevronRight size={20} strokeWidth={3} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-10 py-5 font-black text-xs uppercase tracking-widest text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/30 rounded-2xl transition-all active:scale-95 flex items-center gap-3 disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? 'Processando...' : <><Save size={20} strokeWidth={3} /> Salvar Ficha Final</>}
            </button>
          )}

          {/* PDF Button - Shown only when on step 5 or after save */}
          <button 
            onClick={handlePrint}
            className="px-6 py-4 font-black text-[10px] uppercase tracking-widest text-zinc-400 hover:text-emerald-600 transition-colors flex items-center gap-2 group"
          >
            <FileText size={18} className="group-hover:scale-110 transition-transform" /> Versão para Impressão
          </button>
        </div>

      </div>
    </div>
  );
}

const CheckIcon = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
