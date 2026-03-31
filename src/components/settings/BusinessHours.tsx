import React from 'react';
import { Clock, Save, AlertCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { ShopSettings } from '../../types';

interface BusinessHoursProps {
  settings: ShopSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings | null>>;
  onSave: (e: React.FormEvent) => void;
  timeError: string | null;
}

export default function BusinessHours({ settings, setSettings, onSave, timeError }: BusinessHoursProps) {
  const handleTimeChange = (index: number, field: 'open' | 'close', value: string) => {
    if (!settings?.businessHours) return;
    const newHours = [...settings.businessHours];
    newHours[index][field] = value;
    setSettings({ ...settings, businessHours: newHours });
  };

  const toggleClosed = (index: number) => {
    if (!settings?.businessHours) return;
    const newHours = [...settings.businessHours];
    newHours[index].closed = !newHours[index].closed;
    setSettings({ ...settings, businessHours: newHours });
  };

  return (
    <section className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-premium">
      <div className="p-8 border-b border-surface-100 bg-surface-50/50">
        <h3 className="text-xl font-display font-black flex items-center gap-3 text-surface-900">
          <div className="p-2 bg-brand-50 text-brand-500 rounded-xl">
            <Clock size={24} />
          </div>
          Horário de Funcionamento
        </h3>
      </div>
      <div className="p-8 space-y-5">
        <div className="grid gap-3">
          {settings?.businessHours?.map((hour, index) => (
            <div key={hour.day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 border border-surface-100 rounded-2xl bg-white hover:border-brand-500/20 transition-all group shadow-sm hover:shadow-md">
              <div className="flex items-center gap-4 min-w-[150px]">
                <div className={`w-3 h-3 rounded-full shadow-[0_0_8px] ${hour.closed ? 'bg-brand-500 shadow-brand-500/50' : 'bg-emerald-500 shadow-emerald-500/50'}`} />
                <span className="font-display font-black text-surface-900 uppercase tracking-tight">{hour.day}</span>
              </div>
              
              <div className="flex items-center gap-6">
                {!hour.closed ? (
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 ml-1">Abertura</span>
                      <input
                        type="time"
                        value={hour.open}
                        onChange={(e) => handleTimeChange(index, 'open', e.target.value)}
                        className="px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm font-bold text-surface-900 transition-all"
                      />
                    </div>
                    <div className="w-4 h-px bg-zinc-200 mt-5" />
                    <div className="flex flex-col">
                      <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1 ml-1">Fechamento</span>
                      <input
                        type="time"
                        value={hour.close}
                        onChange={(e) => handleTimeChange(index, 'close', e.target.value)}
                        className="px-4 py-2 bg-surface-50 border border-surface-200 rounded-xl focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 outline-none text-sm font-bold text-surface-900 transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="bg-brand-50 px-6 py-2 rounded-xl border border-brand-100">
                    <span className="text-xs font-black text-brand-500 uppercase tracking-[0.2em]">Fechado</span>
                  </div>
                )}
                
                <button
                  onClick={() => toggleClosed(index)}
                  className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    hour.closed 
                      ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-500 hover:text-white border border-emerald-100' 
                      : 'bg-brand-50 text-brand-500 hover:bg-brand-500 hover:text-white border border-brand-100'
                  }`}
                >
                  {hour.closed ? 'Abrir Loja' : 'Fechar Dia'}
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-end pt-6">
          <button
            onClick={onSave}
            className="btn-primary group"
          >
            <Save size={20} className="group-hover:rotate-12 transition-transform" />
            Salvar Cronograma
          </button>
        </div>
        
        {timeError && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-5 bg-brand-50 border border-brand-100 rounded-[1.5rem] flex items-center gap-4 text-brand-600"
          >
            <div className="w-10 h-10 bg-brand-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-brand-500/20">
              <AlertCircle size={20} />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest">Erro de Validação</p>
              <p className="text-sm font-bold">{timeError}</p>
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
