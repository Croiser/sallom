import React, { useState, useRef } from 'react';
import { X, ChevronRight, ChevronLeft, Save, Plus } from 'lucide-react';
import SignatureCanvas from 'react-signature-canvas';
import { api } from '../services/api';

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
  { id: 'hyperhidrosis', label: 'Hiperidrose (Suor exces.)' },
  { id: 'anhidrosis', label: 'Anidrose (Falta de suor)' },
  { id: 'dyshidrosis', label: 'Disidrose' },
  { id: 'psoriasis', label: 'Psoríase' },
  { id: 'calluses', label: 'Calos / Calosidades' },
  { id: 'hyperkeratosis', label: 'Hiperqueratose' },
  { id: 'bromidrosis', label: 'Bromidrose (Mau cheiro)' },
  { id: 'exostosis', label: 'Exostose' },
  { id: 'warts', label: 'Verruga Plantar' },
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
    allergies: '',
    recentSurgeries: '',
    medications: '',
    specialNotes: '',
    professionalObservations: '',
    nailType: '',
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
      alert("É necessário aceitar o termo de veracidade antes de salvar.");
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
      alert('Ficha salva com sucesso!');
      onSuccess();
    } catch (err: any) {
      alert(`Erro ao salvar ficha: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-[2rem] shadow-premium w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-zinc-100 bg-zinc-50/50">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-zinc-950">Ficha de Anamnese: Podologia</h2>
            <p className="text-sm text-zinc-500">Cliente: {clientName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-100 rounded-full transition-colors">
            <X size={20} className="text-zinc-500" />
          </button>
        </div>

        {/* Stepper Progress */}
        <div className="flex items-center gap-2 p-6 bg-white border-b border-zinc-100 overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <React.Fragment key={i}>
              <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm transition-colors ${
                step >= i ? 'bg-emerald-500 text-white shadow-md' : 'bg-zinc-100 text-zinc-400'
              }`}>
                {i}
              </div>
              {i < 4 && <div className={`h-1 w-12 rounded-full transition-colors ${step > i ? 'bg-emerald-500' : 'bg-zinc-100'}`} />}
            </React.Fragment>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-8 bg-zinc-50/30">
          
          {/* STEP 1: DADOS GERAIS */}
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-zinc-800">1. Dados Gerais e Hábito</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Profissão</label>
                  <input type="text" name="profession" value={formData.profession} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Indicação (Como conheceu)</label>
                  <input type="text" name="referral" value={formData.referral} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Tipo de calçado que mais usa</label>
                  <input type="text" name="shoeType" value={formData.shoeType} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: HISTÓRICO DE SAÚDE */}
          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-zinc-800">2. Histórico de Saúde</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                {HISTORY_CHECKBOXES.map(item => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData[item.id] || false}
                        onChange={(e) => handleCheckbox(item.id, e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded border border-zinc-300 bg-white group-hover:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                        <CheckIcon size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors select-none">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Alergias</label>
                  <textarea name="allergies" value={formData.allergies} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500" rows={2} />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Medicamentos em uso</label>
                  <textarea name="medications" value={formData.medications} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500" rows={2} />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Cirurgias Recentes</label>
                  <input type="text" name="recentSurgeries" value={formData.recentSurgeries} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: AVALIAÇÃO TÉCNICA */}
          {step === 3 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-zinc-800">3. Avaliação Técnica</h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                {EVAL_CHECKBOXES.map(item => (
                  <label key={item.id} className="flex items-center gap-2 cursor-pointer group">
                    <div className="relative flex items-center">
                      <input 
                        type="checkbox" 
                        checked={formData[item.id] || false}
                        onChange={(e) => handleCheckbox(item.id, e.target.checked)}
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded border border-zinc-300 bg-white group-hover:border-emerald-500 peer-checked:bg-emerald-500 peer-checked:border-emerald-500 transition-all flex items-center justify-center">
                        <CheckIcon size={12} className="text-white opacity-0 peer-checked:opacity-100" />
                      </div>
                    </div>
                    <span className="text-sm font-medium text-zinc-600 group-hover:text-zinc-900 transition-colors select-none">
                      {item.label}
                    </span>
                  </label>
                ))}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-6 rounded-2xl border border-zinc-100 shadow-sm">
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">Formato da Unha (Prevalente)</label>
                  <select name="nailType" value={formData.nailType} onChange={handleChange} className="w-full px-4 py-3 bg-white border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                    <option value="">Selecione...</option>
                    {NAIL_TYPES.map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-1">Observações do Profissional</label>
                  <textarea name="professionalObservations" value={formData.professionalObservations} onChange={handleChange} className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-emerald-500" rows={3} placeholder="Anotações técnicas exclusivas..." />
                </div>
              </div>
            </div>
          )}

          {/* STEP 4: ASSINATURAS */}
          {step === 4 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <h3 className="text-lg font-bold text-zinc-800">4. Finalização e Assinaturas</h3>
              
              <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="relative flex items-center mt-1">
                    <input 
                      type="checkbox" 
                      checked={formData.disclaimerAccepted}
                      onChange={(e) => handleCheckbox('disclaimerAccepted', e.target.checked)}
                      className="peer sr-only"
                    />
                    <div className="w-6 h-6 rounded border-2 border-amber-400 bg-white group-hover:border-amber-600 peer-checked:bg-amber-500 peer-checked:border-amber-500 transition-all flex items-center justify-center">
                      <CheckIcon size={14} className="text-white opacity-0 peer-checked:opacity-100 font-bold" />
                    </div>
                  </div>
                  <p className="text-sm font-medium text-amber-900 select-none">
                    Declaro que as informações acima são verdadeiras e estou ciente do tratamento a ser realizado. Autorizo o profissional a realizar os procedimentos podológicos pertinentes ao meu caso.
                  </p>
                </label>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border text-center border-zinc-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-zinc-600 mb-2">Assinatura do Cliente</p>
                  <div className="border border-dashed border-zinc-300 rounded-xl bg-zinc-50">
                    <SignatureCanvas ref={sigPadPatient} penColor="black" clearOnResize={false}
                      canvasProps={{ className: 'w-full h-32' }} />
                  </div>
                  <button onClick={() => sigPadPatient.current?.clear()} className="text-xs text-rose-500 mt-2 font-medium hover:underline">Limpar Assinatura</button>
                </div>
                
                <div className="bg-white border text-center border-zinc-200 rounded-2xl p-4">
                  <p className="text-sm font-semibold text-zinc-600 mb-2">Assinatura do Profissional</p>
                  <div className="border border-dashed border-zinc-300 rounded-xl bg-zinc-50">
                    <SignatureCanvas ref={sigPadProf} penColor="blue" clearOnResize={false}
                      canvasProps={{ className: 'w-full h-32' }} />
                  </div>
                  <button onClick={() => sigPadProf.current?.clear()} className="text-xs text-rose-500 mt-2 font-medium hover:underline">Limpar Assinatura</button>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-zinc-100 bg-white flex items-center justify-between">
          <button
            onClick={() => setStep(prev => prev - 1)}
            disabled={step === 1}
            className="px-6 py-3 font-semibold text-zinc-600 hover:bg-zinc-100 rounded-xl transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            <ChevronLeft size={20} /> Anterior
          </button>
          
          {step < 4 ? (
            <button
              onClick={() => setStep(prev => prev + 1)}
              className="px-6 py-3 font-bold text-white bg-emerald-500 hover:bg-emerald-600 shadow-lg hover:shadow-xl hover:shadow-emerald-500/20 rounded-xl transition-all flex items-center gap-2"
            >
              Próximo Passo <ChevronRight size={20} />
            </button>
          ) : (
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-8 py-3 font-bold text-white bg-emerald-600 hover:bg-emerald-700 shadow-xl shadow-emerald-500/20 rounded-xl transition-all flex items-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {loading ? 'Salvando...' : <><Save size={20} /> Salvar Ficha</>}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

const CheckIcon = ({ size, className }: any) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
