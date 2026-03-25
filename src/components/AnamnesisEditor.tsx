import React, { useState } from 'react';
import { Save, X, ClipboardList, PenTool, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';

interface AnamnesisEditorProps {
  clientId: string;
  onClose: () => void;
  onSave: () => void;
}

export default function AnamnesisEditor({ clientId, onClose, onSave }: AnamnesisEditorProps) {
  const [procedure, setProcedure] = useState('');
  const [content, setContent] = useState({
    alergias: '',
    medicamentos: '',
    procedimentosAnteriores: '',
    observacoes: '',
    tipoPele: '',
    contraindicacoes: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.post(`/clients/${clientId}/anamnesis`, {
        procedure,
        content
      });
      onSave();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar ficha:', error);
      alert('Erro ao salvar ficha técnica.');
    } finally {
      setLoading(false);
    }
  };

  const handleFieldChange = (field: string, value: string) => {
    setContent(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
      >
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between bg-zinc-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-rose-500/10 rounded-lg">
              <ClipboardList className="text-rose-500" size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Nova Ficha de Anamnese</h3>
              <p className="text-xs text-zinc-500">Registre detalhes técnicos e observações de saúde</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-zinc-800 rounded-full transition-colors text-zinc-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[70vh] overflow-y-auto custom-scrollbar">
          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400">Procedimento/Serviço</label>
            <input 
              type="text"
              required
              placeholder="Ex: Coloração, Botox Capilar, Limpeza de Pele..."
              value={procedure}
              onChange={e => setProcedure(e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all placeholder:text-zinc-600"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField 
              label="Alergias Conhecidas" 
              value={content.alergias} 
              onChange={v => handleFieldChange('alergias', v)} 
              placeholder="Liste substâncias, cosméticos ou alimentos..."
            />
            <FormField 
              label="Medicamentos em Uso" 
              value={content.medicamentos} 
              onChange={v => handleFieldChange('medicamentos', v)} 
              placeholder="Ex: Anticoncepcional, Roacutan, Aspirina..."
            />
            <FormField 
              label="Tipo de Pele / Cabelo" 
              value={content.tipoPele} 
              onChange={v => handleFieldChange('tipoPele', v)} 
              placeholder="Características técnicas..."
            />
            <FormField 
              label="Procedimentos Anteriores" 
              value={content.procedimentosAnteriores} 
              onChange={v => handleFieldChange('procedimentosAnteriores', v)} 
              placeholder="O que o cliente já fez?"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-zinc-400">Observações Técnicas / Contraindicações</label>
            <textarea 
              rows={3}
              value={content.observacoes}
              onChange={e => handleFieldChange('observacoes', e.target.value)}
              className="w-full bg-zinc-800/50 border border-zinc-700 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all resize-none"
              placeholder="Anotações importantes para o profissional..."
            />
          </div>

          <div className="flex gap-4 pt-4">
            <button 
              type="button" 
              onClick={onClose}
              className="flex-1 py-3 rounded-xl font-bold text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all border border-transparent hover:border-zinc-700"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={loading}
              className="flex-1 bg-rose-500 hover:bg-rose-600 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              {loading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <><Save size={18} /> Salvar Ficha</>}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function FormField({ label, value, onChange, placeholder }: { label: string, value: string, onChange: (v: string) => void, placeholder: string }) {
  return (
    <div className="space-y-2">
      <label className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{label}</label>
      <input 
        type="text"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-zinc-800/30 border border-zinc-800 rounded-xl px-4 py-2.5 text-sm text-white focus:border-rose-500/50 outline-none transition-all placeholder:text-zinc-600 focus:bg-zinc-800/50"
        placeholder={placeholder}
      />
    </div>
  );
}
