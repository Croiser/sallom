import { Gift, Save, Sparkles, Percent, Target, Coins } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ShopSettings } from '../../types';

interface FidelityProgramProps {
  settings: ShopSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings | null>>;
  onSave: () => void;
}

export default function FidelityProgram({ settings, setSettings, onSave }: FidelityProgramProps) {
  const toggleFidelity = () => {
    if (!settings) return;
    const config = settings.fidelityConfig || {
      enabled: false,
      pointsPerVisit: 10,
      pointsPerCurrency: 0,
      minPointsToRedeem: 100,
      redeemValue: 10
    };
    setSettings({
      ...settings,
      fidelityConfig: { ...config, enabled: !config.enabled }
    });
  };

  const updateConfig = (updates: any) => {
    if (!settings?.fidelityConfig) return;
    setSettings({
      ...settings,
      fidelityConfig: { ...settings.fidelityConfig, ...updates }
    });
  };

  return (
    <section className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-premium">
      <div className="p-8 border-b border-surface-100 bg-surface-50/50">
        <h3 className="text-xl font-display font-black flex items-center gap-3 text-surface-900">
          <div className="p-2 bg-brand-50 text-brand-500 rounded-xl">
            <Gift size={24} />
          </div>
          Programa de Fidelidade
        </h3>
      </div>
      <div className="p-8 space-y-8">
        <div className="flex items-center justify-between p-6 bg-surface-50 rounded-[1.5rem] border border-surface-100 shadow-inner">
          <div className="space-y-1">
            <p className="font-display font-black text-surface-900 uppercase tracking-tight">Status do Programa</p>
            <p className="text-xs font-bold text-zinc-400">Recompense seus clientes por visitas e gastos recorrentes.</p>
          </div>
          <button
            onClick={toggleFidelity}
            className={`w-14 h-8 rounded-full transition-all relative p-1 shadow-inner ${
              settings?.fidelityConfig?.enabled ? 'bg-brand-500 shadow-brand-500/20' : 'bg-zinc-200'
            }`}
          >
            <div className={`w-6 h-6 bg-white rounded-full transition-all shadow-md transform ${
              settings?.fidelityConfig?.enabled ? 'translate-x-6' : 'translate-x-0'
            }`} />
          </button>
        </div>

        <AnimatePresence>
          {settings?.fidelityConfig?.enabled && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-8"
            >
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Pontos por Visita</label>
                <div className="relative group">
                  <Sparkles size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="number"
                    value={settings.fidelityConfig.pointsPerVisit}
                    onChange={e => updateConfig({ pointsPerVisit: Number(e.target.value) })}
                    className="input-premium pl-12 font-bold"
                    placeholder="10"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 px-1 font-bold leading-tight">Quantos pontos o cliente ganha ao finalizar qualquer serviço agendado.</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Pontos por Valor Gasto (R$)</label>
                <div className="relative group">
                  <Percent size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="number"
                    value={settings.fidelityConfig.pointsPerCurrency}
                    onChange={e => updateConfig({ pointsPerCurrency: Number(e.target.value) })}
                    className="input-premium pl-12 font-bold text-brand-500"
                    placeholder="0"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 px-1 font-bold leading-tight">Configurável: ganhe pontos proporcionais ao valor total do ticket (ex: 1 ponto por real).</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Alvo para Resgate</label>
                <div className="relative group">
                  <Target size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="number"
                    value={settings.fidelityConfig.minPointsToRedeem}
                    onChange={e => updateConfig({ minPointsToRedeem: Number(e.target.value) })}
                    className="input-premium pl-12 font-bold"
                    placeholder="100"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 px-1 font-bold leading-tight">Pontuação necessária acumulada para que o botão de resgate seja liberado no app.</p>
              </div>
              <div className="space-y-3">
                <label className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] ml-1">Valor do Voucher (R$)</label>
                <div className="relative group">
                  <Coins size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" />
                  <input
                    type="number"
                    value={settings.fidelityConfig.redeemValue}
                    onChange={e => updateConfig({ redeemValue: Number(e.target.value) })}
                    className="input-premium pl-12 font-bold text-emerald-600"
                    placeholder="10"
                  />
                </div>
                <p className="text-[10px] text-zinc-400 px-1 font-bold leading-tight">Valor em créditos que será descontado do total a pagar quando o cliente usar o voucher.</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="flex justify-end pt-4">
          <button
            onClick={onSave}
            className="btn-primary group"
          >
            <Save size={20} className="group-hover:rotate-12 transition-transform" />
            Salvar Programação de Fidelidade
          </button>
        </div>
      </div>
    </section>
  );
}
