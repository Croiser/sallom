import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  XCircle, 
  AlertCircle,
  ChevronLeft,
  CalendarDays,
  History,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Appointment } from '../types';
import { format, isAfter, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface ClientPortalProps {
  slug: string;
}

export default function ClientPortal({ slug }: ClientPortalProps) {
  const [phone, setPhone] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [data, setData] = useState<{ client: any, appointments: Appointment[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'agenda' | 'history'>('agenda');
  const [error, setError] = useState<string | null>(null);
  const [cancellingApp, setCancellingApp] = useState<any | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [isProcessingCancel, setIsProcessingCancel] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const sanitizedPhone = phone.replace(/\D/g, '');
      const result = await api.get(`/public/client-portal/${slug}/${sanitizedPhone}`);
      setData(result);
      setIsLoggedIn(true);
    } catch (err: any) {
      setError('Cliente não encontrado ou erro ao buscar dados.');
    } finally {
      setLoading(false);
    }
  };

  const upcomingApps = data?.appointments.filter(a => 
    isAfter(new Date(a.date), subDays(new Date(), 1)) && !a.status.includes('cancelled') && a.status !== 'completed' && a.status !== 'no_show'
  ) || [];

  const historyApps = data?.appointments.filter(a => 
    !isAfter(new Date(a.date), subDays(new Date(), 1)) || a.status.includes('cancelled') || a.status === 'completed' || a.status === 'no_show'
  ) || [];

  const handleCancelClick = (app: any) => {
    setCancellingApp(app);
    setShowCancelModal(true);
  };

  const confirmCancellation = async (confirmLate: boolean = false) => {
    if (!cancellingApp) return;
    setIsProcessingCancel(true);
    try {
      await api.post(`/public/appointments/${cancellingApp.id}/cancel`, { 
        reason: 'Cancelado via Portal',
        confirmLateCancellation: confirmLate 
      });
      setShowCancelModal(false);
      setCancellingApp(null);
      // Reload data
      handleLogin({ preventDefault: () => {} } as any);
    } catch (err: any) {
      if (err.response?.data?.error === 'Late cancellation') {
        // This should be handled by the UI showing the late cancel warning
      } else {
        alert('Erro ao cancelar agendamento.');
      }
    } finally {
      setIsProcessingCancel(false);
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full space-y-8 text-center"
        >
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight text-white">Área da Cliente</h1>
            <p className="text-zinc-500">Informe seu WhatsApp para acessar sua agenda e histórico.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <input 
                type="tel"
                placeholder="(00) 00000-0000"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-5 text-white focus:border-rose-500 outline-none transition-all text-center text-xl font-bold placeholder:text-zinc-700"
                required
              />
            </div>
            {error && <p className="text-rose-500 text-sm font-medium">{error}</p>}
            <button 
              type="submit"
              disabled={loading}
              className="w-full bg-rose-500 text-white py-5 rounded-2xl font-bold hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50"
            >
              {loading ? 'Acessando...' : 'Entrar no Portal'}
            </button>
          </form>

          <button 
            onClick={() => window.location.href = `/agenda/${slug}`}
            className="text-zinc-500 hover:text-zinc-300 text-sm font-medium transition-colors"
          >
            Voltar para agendamento
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 pb-10">
      {/* Client Header */}
      <div className="p-6 bg-zinc-900/50 border-b border-zinc-800 sticky top-0 z-50 backdrop-blur-xl">
        <div className="flex items-center justify-between max-w-2xl mx-auto">
          <div className="flex items-center gap-4">
             <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center font-bold text-white shadow-lg shadow-rose-500/20">
               {data?.client.name.charAt(0)}
             </div>
             <div>
               <h2 className="text-lg font-bold">Olá, {data?.client.name}</h2>
               <p className="text-xs text-zinc-500">Bem-vinda ao seu portal</p>
             </div>
          </div>
          <button 
            onClick={() => setIsLoggedIn(false)}
            className="p-2 text-zinc-500 hover:text-white transition-colors"
          >
            <ChevronLeft size={24} />
          </button>
        </div>
      </div>

      <main className="p-6 space-y-8 max-w-2xl mx-auto">
        {/* Debt Alert */}
        <AnimatePresence>
          {data?.client.pendingDebt > 0 && (
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-3xl space-y-3"
            >
              <div className="flex items-center gap-3 text-rose-500">
                <AlertCircle size={20} />
                <h3 className="font-bold">Pendência Identificada</h3>
              </div>
              <p className="text-sm text-zinc-400">
                Existe um débito de <span className="text-rose-500 font-bold">R$ {data.client.pendingDebt.toFixed(2)}</span> referente a um agendamento anterior não comparecido.
              </p>
              <p className="text-xs text-zinc-500 italic">
                * Este valor será somado ao seu próximo atendimento no salão.
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tabs */}
        <div className="flex p-1 bg-zinc-900 rounded-2xl border border-zinc-800">
          <button 
            onClick={() => setActiveTab('agenda')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'agenda' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <CalendarDays size={16} />
            Próximos
          </button>
          <button 
            onClick={() => setActiveTab('history')}
            className={`flex-1 py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
              activeTab === 'history' ? 'bg-zinc-800 text-white shadow-lg' : 'text-zinc-500 hover:text-zinc-300'
            }`}
          >
            <History size={16} />
            Histórico
          </button>
        </div>

        {/* Content */}
        <div className="space-y-4">
          {activeTab === 'agenda' ? (
            upcomingApps.length > 0 ? (
              upcomingApps.map(app => (
                <div key={app.id} className="bg-zinc-900 border border-zinc-800 p-6 rounded-[2.5rem] space-y-4 relative overflow-hidden group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="bg-zinc-800 p-3 rounded-2xl text-rose-500">
                        <Clock size={20} />
                      </div>
                      <div>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                          {format(new Date(app.date), "dd 'de' MMMM", { locale: ptBR })}
                        </p>
                        <p className="text-xl font-bold text-white uppercase italic">{format(new Date(app.date), 'HH:mm')}h</p>
                      </div>
                    </div>
                    <button className="p-3 bg-zinc-800 rounded-2xl text-zinc-500 hover:text-rose-500 transition-colors">
                      <MessageSquare size={18} />
                    </button>
                  </div>
                  
                  <div className="space-y-1">
                    <h4 className="text-lg font-bold text-white leading-tight">{app.serviceName}</h4>
                    <p className="text-sm text-zinc-500 italic">Com {app.staffName || 'Equipe'}</p>
                  </div>

                  <div className="pt-4 flex gap-3">
                    <button 
                      onClick={() => handleCancelClick(app)}
                      className="flex-1 bg-zinc-800 text-zinc-400 py-4 rounded-2xl font-bold text-xs hover:bg-rose-500/10 hover:text-rose-500 transition-all border border-zinc-700/50"
                    >
                      Cancelar Horário
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-20 text-center space-y-4">
                <Calendar className="mx-auto text-zinc-800" size={48} />
                <div className="space-y-1">
                  <p className="text-zinc-500 font-medium">Você não tem próximos agendamentos.</p>
                  <button 
                    onClick={() => window.location.href = `/agenda/${slug}`}
                    className="text-rose-500 font-bold hover:underline"
                  >
                    Marcar agora →
                  </button>
                </div>
              </div>
            )
          ) : (
             <div className="space-y-3">
               {historyApps.map(app => (
                 <div key={app.id} className="bg-zinc-900/50 border border-zinc-800 p-4 rounded-3xl flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        app.status === 'completed' ? 'bg-emerald-500/10 text-emerald-500' : 
                        app.status.includes('cancelled') ? 'bg-rose-500/10 text-rose-500' : 
                        app.status === 'no_show' ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-800 text-zinc-500'
                      }`}>
                        {app.status === 'completed' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
                      </div>
                      <div>
                        <h5 className="text-sm font-bold">{app.serviceName}</h5>
                        <p className="text-[10px] text-zinc-500">
                          {format(new Date(app.date), "dd/MM/yyyy")} com {app.staffName || 'Equipe'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className={`text-[9px] font-black uppercase tracking-widest ${
                        app.status === 'completed' ? 'text-emerald-500' : 
                        app.status === 'no_show' ? 'text-zinc-500' : 'text-rose-500'
                      }`}>
                        {app.status === 'completed' ? 'Realizado' : 
                         app.status === 'no_show' ? 'No-Show' : 
                         app.status === 'cancelled_late' ? 'Cancelado (Tardio)' : 'Cancelado'}
                      </span>
                    </div>
                 </div>
               ))}
               
               {historyApps.length === 0 && (
                 <div className="py-20 text-center text-zinc-500">
                   <History className="mx-auto mb-4 opacity-10" size={48} />
                   <p className="text-sm">Seu histórico aparecerá aqui.</p>
                 </div>
               )}
             </div>
          )}
        </div>
      </main>

      {/* Cancellation Rule Modal */}
      <AnimatePresence>
        {showCancelModal && cancellingApp && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-md"
               onClick={() => !isProcessingCancel && setShowCancelModal(false)}
            />
            <motion.div 
               initial={{ scale: 0.9, opacity: 0, y: 20 }}
               animate={{ scale: 1, opacity: 1, y: 0 }}
               exit={{ scale: 0.9, opacity: 0, y: 20 }}
               className="bg-zinc-900 w-full max-w-md rounded-[2.5rem] border border-zinc-800 relative z-10 overflow-hidden shadow-2xl"
            >
               <div className="p-8 space-y-6">
                  <div className="w-16 h-16 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto text-rose-500 mb-2">
                     <AlertCircle size={32} />
                  </div>
                  
                  <div className="text-center space-y-2">
                     <h3 className="text-2xl font-bold text-white leading-tight">Políticas de Cancelamento</h3>
                     <p className="text-zinc-400 text-sm">
                        { ( (new Date(cancellingApp.date).getTime() - new Date().getTime()) / (1000*60*60) ) < 24 ? (
                           <>
                             Identificamos que seu agendamento é em menos de <span className="text-rose-500 font-bold">24 horas</span>.
                           </>
                        ) : (
                           "Você deseja cancelar seu agendamento?"
                        )}
                     </p>
                  </div>

                  <div className="bg-zinc-950 rounded-2xl p-6 border border-zinc-800 space-y-4">
                     { ( (new Date(cancellingApp.date).getTime() - new Date().getTime()) / (1000*60*60) ) < 24 ? (
                        <div className="space-y-4">
                           <div className="flex items-center gap-3 text-rose-500 font-bold text-xs uppercase tracking-widest">
                              <XCircle size={16} />
                              Taxa de 50% Aplicável
                           </div>
                           <p className="text-sm text-zinc-500 leading-relaxed italic">
                             "Conforme nossas regras, cancelamentos tardios geram uma taxa de <span className="text-white font-bold">R$ {(cancellingApp.price * 0.5).toFixed(2)}</span> que será vinculada ao seu cadastro."
                           </p>
                           <button 
                              onClick={() => {
                                 const msg = `Olá, gostaria de cancelar meu horário de ${cancellingApp.serviceName} no dia ${format(new Date(cancellingApp.date), "dd/MM")}. Estou ciente da taxa de 50% por cancelamento tardio.`;
                                 window.open(`https://wa.me/55?text=${encodeURIComponent(msg)}`, '_blank');
                                 confirmCancellation(true);
                              }}
                              className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold text-sm shadow-lg shadow-rose-500/20 hover:bg-rose-600 transition-all"
                           >
                              Confirmar e Avisar via WhatsApp
                           </button>
                        </div>
                     ) : (
                        <div className="space-y-4">
                           <p className="text-sm text-zinc-500 text-center">Ao cancelar com antecedência, você libera este horário para outra pessoa. Obrigado pela atenção!</p>
                           <button 
                              onClick={() => confirmCancellation(false)}
                              disabled={isProcessingCancel}
                              className="w-full bg-zinc-800 text-white py-4 rounded-xl font-bold text-sm hover:bg-zinc-700 transition-all border border-zinc-700 disabled:opacity-50"
                           >
                              {isProcessingCancel ? 'Cancelando...' : 'Confirmar Cancelamento'}
                           </button>
                        </div>
                     )}
                  </div>

                  <button 
                     onClick={() => setShowCancelModal(false)}
                     disabled={isProcessingCancel}
                     className="w-full text-zinc-500 text-sm font-medium hover:text-zinc-300 transition-colors"
                  >
                     Voltar
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
