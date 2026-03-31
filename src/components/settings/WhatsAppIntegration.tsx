import React from 'react';
import { MessageSquare, Smartphone, ShieldCheck, Battery, QrCode, Loader2, Lock, Zap, Save, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import { ShopSettings, Plan } from '../../types';

interface WhatsAppIntegrationProps {
  settings: ShopSettings | null;
  setSettings: React.Dispatch<React.SetStateAction<ShopSettings | null>>;
  plan: Plan | null;
  isWhatsAppConnected: boolean;
  setIsWhatsAppConnected: (val: boolean) => void;
  isGeneratingQR: boolean;
  qrCode: string | null;
  batteryLevel: number | null;
  onGenerateQR: () => void;
  onSimulateConnection: () => void;
  onSave: () => void;
  onNavigate?: (tab: string, data?: any) => void;
}

export default function WhatsAppIntegration({
  settings,
  setSettings,
  plan,
  isWhatsAppConnected,
  setIsWhatsAppConnected,
  isGeneratingQR,
  qrCode,
  batteryLevel,
  onGenerateQR,
  onSimulateConnection,
  onSave,
  onNavigate
}: WhatsAppIntegrationProps) {
  const hasWhatsApp = plan?.features?.whatsapp;

  return (
    <section className="bg-white rounded-[2rem] border border-surface-200 overflow-hidden shadow-premium relative min-h-[400px]">
      {!hasWhatsApp && (
        <div className="absolute inset-0 z-10 bg-white/80 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-20 h-20 bg-brand-50 rounded-3xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/10"
          >
            <Lock size={32} className="text-brand-500" />
          </motion.div>
          <h4 className="text-2xl font-display font-black text-surface-900 mb-3 uppercase tracking-tight">WhatsApp Inteligente</h4>
          <p className="text-zinc-500 text-sm max-w-xs mb-8 font-bold leading-relaxed">
            Automatize seus lembretes e reduza faltas em até 40% com nossa IA. Disponível no <span className="text-brand-500">Plano Gold</span>.
          </p>
          <button 
            onClick={() => onNavigate?.('subscription', { planId: 'gold' })}
            className="btn-primary"
          >
            <Zap size={20} className="text-brand-300" />
            Upgrade para Gold
          </button>
        </div>
      )}
      <div className="p-8 border-b border-surface-100 bg-surface-50/50">
        <h3 className="text-xl font-display font-black flex items-center gap-3 text-surface-900">
          <div className="p-2 bg-amber-50 text-amber-500 rounded-xl">
            <MessageSquare size={24} />
          </div>
          Integração WhatsApp
        </h3>
      </div>
      <div className="p-8 space-y-8">
        <div className={`p-8 rounded-[2rem] border transition-all relative overflow-hidden ${isWhatsAppConnected ? 'bg-emerald-50/50 border-emerald-100' : 'bg-surface-50 border-surface-100 shadow-inner'}`}>
          {isWhatsAppConnected && (
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[60px] rounded-full" />
          )}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 relative z-10">
            <div className="flex items-start gap-5">
              <div className={`p-4 rounded-2xl shadow-sm ${isWhatsAppConnected ? 'bg-white text-emerald-500' : 'bg-white text-zinc-300'}`}>
                <Smartphone size={28} />
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-3">
                  <p className={`text-lg font-display font-black uppercase tracking-tight ${isWhatsAppConnected ? 'text-emerald-900' : 'text-surface-900'}`}>
                    {isWhatsAppConnected ? 'WhatsApp Conectado' : 'Pronto para Conectar'}
                  </p>
                  {isWhatsAppConnected && (
                    <motion.span 
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg shadow-emerald-500/20"
                    >
                      <CheckCircle2 size={12} />
                      Ativo
                    </motion.span>
                  )}
                </div>
                <p className={`text-sm font-bold ${isWhatsAppConnected ? 'text-emerald-700/70' : 'text-zinc-400'}`}>
                  {isWhatsAppConnected 
                    ? 'Sua IA de atendimento está monitorando novos agendamentos.' 
                    : 'Escaneie o QR Code para ativar as notificações automáticas.'}
                </p>
                
                {isWhatsAppConnected && batteryLevel !== null && (
                  <div className="flex items-center gap-2 mt-3 text-xs font-black text-emerald-600 uppercase tracking-widest">
                    <Battery size={16} className={batteryLevel < 20 ? 'text-brand-500 animate-pulse' : ''} />
                    Bateria: {batteryLevel}%
                  </div>
                )}
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              {!isWhatsAppConnected ? (
                <button 
                  onClick={onGenerateQR}
                  disabled={isGeneratingQR}
                  className="bg-zinc-900 text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 disabled:opacity-50 flex items-center gap-3"
                >
                  {isGeneratingQR ? (
                    <>
                      <Loader2 size={18} className="animate-spin" />
                      Sincronizando...
                    </>
                  ) : (
                    <>
                      <QrCode size={18} />
                      vincular novo aparelho
                    </>
                  )}
                </button>
              ) : (
                <button 
                  onClick={() => setIsWhatsAppConnected(false)}
                  className="bg-white text-brand-500 border-2 border-brand-100 px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-brand-50 transition-all shadow-sm"
                >
                  encerrar sessão
                </button>
              )}
            </div>
          </div>

          {qrCode && !isWhatsAppConnected && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-10 flex flex-col items-center p-10 bg-white rounded-[2.5rem] border border-surface-100 shadow-premium group transition-all hover:border-brand-500/20"
            >
              <div className="bg-surface-50 p-6 rounded-[2rem] mb-6 shadow-inner relative overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-brand-500/5 to-transparent pointer-events-none" />
                <img 
                  src={`data:image/png;base64,${qrCode}`} 
                  alt="WhatsApp QR Code" 
                  className="w-56 h-56 relative z-10 mix-blend-multiply opacity-90 group-hover:opacity-100 transition-opacity"
                />
              </div>
              <p className="text-sm font-display font-black text-surface-900 uppercase tracking-widest mb-2">Escaneie com seu WhatsApp</p>
              <p className="text-xs font-bold text-zinc-400 text-center max-w-xs mb-8 leading-relaxed">
                Aparelhos Conectados &gt; Conectar um Aparelho. Mantenha seu celular conectado à internet.
              </p>
              <button 
                onClick={onSimulateConnection}
                className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] hover:text-amber-600 transition-colors bg-amber-50 px-6 py-2 rounded-full"
              >
                Conectar Instantaneamente (Modo Demo)
              </button>
            </motion.div>
          )}
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between p-6 bg-white border border-surface-100 rounded-3xl hover:border-brand-500/20 transition-all shadow-sm group">
            <div className="space-y-1">
              <p className="font-display font-black text-surface-900 uppercase tracking-tight group-hover:text-brand-500 transition-colors">Lembretes de Faltas</p>
              <p className="text-xs font-bold text-zinc-400">Enviar aviso 2h antes do início.</p>
            </div>
            <button
              onClick={() => {
                if (!settings) return;
                setSettings({
                  ...settings,
                  whatsappConfig: {
                    ...settings.whatsappConfig!,
                    reminders: !settings.whatsappConfig?.reminders
                  }
                });
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${settings?.whatsappConfig?.reminders ? 'bg-brand-500' : 'bg-zinc-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings?.whatsappConfig?.reminders ? 'right-7' : 'left-7'}`} />
            </button>
          </div>

          <div className="flex items-center justify-between p-6 bg-white border border-surface-100 rounded-3xl hover:border-brand-500/20 transition-all shadow-sm group">
            <div className="space-y-1">
              <p className="font-display font-black text-surface-900 uppercase tracking-tight group-hover:text-brand-500 transition-colors">Confirmação de Reserva</p>
              <p className="text-xs font-bold text-zinc-400">Notificar no ato do agendamento.</p>
            </div>
            <button
              onClick={() => {
                if (!settings) return;
                setSettings({
                  ...settings,
                  whatsappConfig: {
                    ...settings.whatsappConfig!,
                    confirmations: !settings.whatsappConfig?.confirmations
                  }
                });
              }}
              className={`w-12 h-6 rounded-full transition-all relative ${settings?.whatsappConfig?.confirmations ? 'bg-brand-500' : 'bg-zinc-200'}`}
            >
              <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all ${settings?.whatsappConfig?.confirmations ? 'right-7' : 'left-7'}`} />
            </button>
          </div>
        </div>

        <div className="pt-6 flex justify-end">
          <button
            onClick={onSave}
            className="btn-primary"
          >
            <Save size={20} />
            Efetivar Configurações
          </button>
        </div>
      </div>
    </section>
  );
}
