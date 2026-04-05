import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Clock, 
  User, 
  CheckCircle2, 
  Play, 
  Check, 
  AlertCircle,
  MoreVertical,
  ChevronRight,
  TrendingUp,
  CreditCard,
  MessageSquare,
  StickyNote,
  Calculator,
  Coffee,
  CheckCircle,
  XCircle,
  Circle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { Appointment, Service, Staff } from '../types';
import { format, isToday } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function ProfessionalDashboard() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [earnings, setEarnings] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [chairStatus, setChairStatus] = useState<'Livre' | 'Ocupado' | 'Em Intervalo'>('Livre');
  const [selectedClientNotes, setSelectedClientNotes] = useState<{ id: string, name: string, notes: string } | null>(null);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const fetchData = async () => {
    try {
      const [appsData, earningsData] = await Promise.all([
        api.get('/appointments'),
        api.get('/professional/earnings')
      ]);
      
      const todayApps = appsData.filter((a: any) => isToday(new Date(a.date)));
      setAppointments(todayApps);
      setEarnings(earningsData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch professional data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (status: typeof chairStatus) => {
    try {
      await api.put('/professional/chair-status', { status });
      setChairStatus(status);
    } catch (err) {
      console.error('Failed to update chair status:', err);
    }
  };

  const handleSaveNotes = async () => {
    if (!selectedClientNotes) return;
    setIsSavingNotes(true);
    try {
      await api.put(`/professional/clients/${selectedClientNotes.id}/notes`, { notes: selectedClientNotes.notes });
      setSelectedClientNotes(null);
      fetchData();
    } catch (err) {
      console.error('Failed to save notes:', err);
    } finally {
      setIsSavingNotes(false);
    }
  };

  const handleNoShow = async (appId: string) => {
    if (!confirm('Deseja marcar este cliente como No-Show? Será gerada uma taxa de 50%.')) return;
    try {
      await api.post(`/appointments/${appId}/no-show`);
      fetchData();
    } catch (err) {
      console.error('Failed to mark no-show:', err);
    }
  };

  const currentApp = appointments.find(a => a.status === 'in_progress');
  const nextApp = appointments.find(a => a.status === 'scheduled');

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="relative">
          <div className="h-24 w-24 rounded-full border-t-4 border-rose-500 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-full border-b-4 border-rose-500/30 animate-spin-reverse"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-rose-500/30">
      {/* Dynamic Header */}
      <header className="p-6 pb-2 pt-8 sticky top-0 z-40 bg-black/80 backdrop-blur-xl border-b border-white/5">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-500 mb-1 block leading-none">
              Painel do Profissional
            </span>
            <h1 className="text-2xl font-black tracking-tight leading-none italic">
              SALLON<span className="text-rose-600">PRO</span>
            </h1>
          </div>
          <div className="flex bg-zinc-900 p-1.5 rounded-full border border-white/5">
            {(['Livre', 'Ocupado', 'Em Intervalo'] as const).map(status => (
              <button
                key={status}
                onClick={() => handleStatusChange(status)}
                className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                  chairStatus === status 
                    ? 'bg-rose-500 text-white shadow-[0_0_20px_rgba(244,63,94,0.4)] scale-110' 
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
                title={status}
              >
                {status === 'Livre' ? <CheckCircle size={16} /> : status === 'Ocupado' ? <XCircle size={16} /> : <Coffee size={16} />}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[10px] text-zinc-500 font-medium mb-4">
          Status Atual: <span className={`font-bold ${chairStatus === 'Livre' ? 'text-emerald-500' : 'text-rose-500'}`}>{chairStatus}</span>
        </p>
      </header>

      <main className="p-4 pt-6 space-y-8 max-w-md mx-auto relative">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-[500px] bg-rose-500/10 blur-[120px] rounded-full pointer-events-none -z-10" />

        {/* Commission Calculator - Transparency Total */}
        <section className="bg-zinc-900/50 border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden group">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-rose-500/5 rounded-full blur-2xl group-hover:bg-rose-500/10 transition-all duration-700" />
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Comissão Acumulada</h3>
            <Calculator size={14} className="text-rose-500/50" />
          </div>
          <div className="flex items-baseline gap-2 mb-2">
            <span className="text-3xl font-black tracking-tighter">R$ {earnings?.totalCommission?.toFixed(2) || '0,00'}</span>
            <span className="text-xs text-rose-500 font-bold">+{earnings?.commissionPercentage}%</span>
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">
            Referente a <span className="text-zinc-300">{earnings?.count || 0} serviços</span> este mês
          </p>
          
          <div className="mt-6 flex gap-4 pt-6 border-t border-white/5">
            <div className="flex-1">
              <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Ganhos Hoje</p>
              <p className="font-bold text-emerald-500 text-lg">R$ {earnings?.totalRevenueToday?.toFixed(2) || '0,00'}</p>
            </div>
            <div className="flex-1 text-right">
              <p className="text-[9px] text-zinc-500 uppercase font-black mb-1">Atendimentos</p>
              <p className="font-bold text-white text-lg">{earnings?.todayCount || 0}</p>
            </div>
          </div>
        </section>

        {/* Visão de Próximo - High Impact Card */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Em Destaque</h3>
            {currentApp && (
               <span className="flex items-center gap-1.5 text-[10px] font-bold text-emerald-500">
                 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
                 EM ATENDIMENTO
               </span>
            )}
          </div>

          <AnimatePresence mode="wait">
            {currentApp ? (
              <motion.div 
                key="active"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-emerald-500 p-8 rounded-[3rem] text-black shadow-2xl shadow-emerald-500/20 relative overflow-hidden"
              >
                <div className="absolute right-0 top-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
                <div className="relative z-10 flex flex-col h-full justify-between gap-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <h2 className="text-4xl font-black tracking-tighter leading-none">{currentApp.clientName}</h2>
                      <p className="text-sm font-black uppercase tracking-tight opacity-70">{currentApp.serviceName}</p>
                    </div>
                    <CheckCircle2 size={32} />
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={async () => {
                         await api.post(`/appointments/${currentApp.id}/finish`);
                         fetchData();
                      }}
                      className="flex-1 bg-black text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-xl"
                    >
                      Finalizar Agora
                    </button>
                    <button 
                      onClick={() => setSelectedClientNotes({ id: currentApp.clientId, name: currentApp.clientName, notes: (currentApp as any).client?.notes || '' })}
                      className="p-5 bg-white/20 rounded-3xl hover:bg-white/30 transition-all text-black"
                    >
                      <StickyNote size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : nextApp ? (
              <motion.div 
                key="next"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-zinc-900 border border-white/10 p-8 rounded-[3rem] shadow-2xl shadow-rose-500/5 relative group"
              >
                <div className="absolute -left-10 -top-10 w-40 h-40 bg-rose-500/5 blur-[50px] group-hover:bg-rose-500/10 transition-all" />
                <div className="relative z-10 space-y-8">
                  <div className="flex justify-between items-start">
                    <div className="space-y-2">
                       <span className="bg-rose-600/20 text-rose-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter">
                          Próximo às {format(new Date(nextApp.date), 'HH:mm')}
                       </span>
                       <h2 className="text-4xl font-black tracking-tighter leading-tight">{nextApp.clientName}</h2>
                       <p className="text-zinc-500 font-bold uppercase text-[10px] tracking-widest">{nextApp.serviceName}</p>
                    </div>
                  </div>
                  <div className="flex gap-4">
                    <button 
                      onClick={async () => {
                        await api.post(`/appointments/${nextApp.id}/check-in`);
                        fetchData();
                      }}
                      className="flex-1 bg-rose-600 text-white py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-rose-500 transition-all shadow-xl shadow-rose-600/20"
                    >
                      Fazer Check-in
                    </button>
                    <button 
                      onClick={() => handleNoShow(nextApp.id)}
                      className="p-5 bg-rose-500/10 rounded-3xl text-rose-500 hover:bg-rose-500 transition-all hover:text-white"
                      title="Marcar No-Show"
                    >
                      <XCircle size={24} />
                    </button>
                    <button 
                      onClick={() => setSelectedClientNotes({ id: nextApp.clientId, name: nextApp.clientName, notes: '' })} // In production we'd fetch actual notes
                      className="p-5 bg-zinc-800 rounded-3xl text-zinc-400 hover:text-white transition-all"
                    >
                      <StickyNote size={24} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ) : (
              <div className="py-20 text-center border-2 border-dashed border-zinc-800 rounded-[3rem] grayscale opacity-30">
                 <Calendar className="mx-auto text-zinc-500 mb-4" size={48} />
                 <p className="text-sm font-black uppercase tracking-widest text-zinc-500">Sem horários por enquanto</p>
              </div>
            )}
          </AnimatePresence>
        </section>

        {/* Agenda List */}
        <section className="space-y-6">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-[10px] font-black uppercase tracking-widest text-zinc-500 italic underline underline-offset-8 decoration-rose-500/40">Agenda Vertical</h3>
            <span className="text-[10px] font-bold text-zinc-600 px-3 py-1 bg-zinc-900 rounded-full border border-white/5">
              {appointments.length} SLOT(S)
            </span>
          </div>

          <div className="space-y-2 relative before:absolute before:left-[2.25rem] before:top-4 before:bottom-4 before:w-[1px] before:bg-gradient-to-b before:from-rose-500/20 before:via-zinc-800 before:to-transparent">
            {appointments.map((app, i) => (
              <motion.div 
                key={app.id} 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex gap-4 p-4 rounded-[2rem] transition-all relative ${
                  app.status === 'completed' ? 'opacity-30 blur-[0.5px]' : 
                  app.status === 'in_progress' ? 'bg-emerald-500/5 ring-1 ring-emerald-500/20' : 
                  'hover:bg-zinc-900/40'
                } group cursor-pointer`}
                onClick={() => setSelectedClientNotes({ id: app.clientId, name: app.clientName, notes: '' })}
              >
                <div className="flex flex-col items-center justify-center min-w-[3rem] relative z-10">
                   <div className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-[10px] transition-all ${
                      app.status === 'completed' ? 'bg-zinc-800 text-zinc-500' : 
                      app.status === 'in_progress' ? 'bg-emerald-500 text-black animate-pulse' : 
                      'bg-zinc-900 text-white border border-white/10 group-hover:border-rose-500/30'
                   }`}>
                      {format(new Date(app.date), 'HH:mm')}
                   </div>
                </div>
                <div className="flex-1 py-1">
                   <div className="flex items-center justify-between">
                      <h4 className={`font-black tracking-tighter ${app.status === 'completed' ? 'text-zinc-500' : 'text-zinc-100'}`}>
                        {app.clientName}
                      </h4>
                      <span className="text-[9px] font-black uppercase tracking-tighter text-zinc-600">
                        R$ {app.price?.toFixed(0)}
                      </span>
                   </div>
                   <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-tighter mt-1">{app.serviceName}</p>
                </div>
                {app.status === 'scheduled' && (
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        handleNoShow(app.id);
                      }}
                      className="p-2 hover:bg-rose-500/20 rounded-xl text-zinc-700 hover:text-rose-500 transition-all"
                      title="No-Show"
                    >
                      <XCircle size={14} />
                    </button>
                    <ChevronRight size={14} className="text-zinc-700 group-hover:text-rose-500/50 transition-all" />
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        </section>
      </main>

      {/* Client Notes Modal - Histórico de Notas */}
      <AnimatePresence>
        {selectedClientNotes && (
          <div className="fixed inset-0 z-[100] flex items-end justify-center px-4 pb-4">
            <motion.div 
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               className="fixed inset-0 bg-black/80 backdrop-blur-sm"
               onClick={() => setSelectedClientNotes(null)}
            />
            <motion.div 
               initial={{ y: "100%" }}
               animate={{ y: 0 }}
               exit={{ y: "100%" }}
               transition={{ type: "spring", damping: 25, stiffness: 200 }}
               className="bg-zinc-900 w-full max-w-sm rounded-[3rem] border border-white/5 relative z-10 overflow-hidden"
            >
               <div className="p-8 pb-10 space-y-6">
                  <div className="flex items-center justify-between">
                     <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">PREFERÊNCIAS DO CLIENTE</span>
                        <h3 className="text-2xl font-black tracking-tighter leading-none italic">{selectedClientNotes.name}</h3>
                     </div>
                     <button onClick={() => setSelectedClientNotes(null)} className="p-2 bg-zinc-800 rounded-full text-zinc-500">
                        <XCircle size={20} />
                     </button>
                  </div>

                  <div className="space-y-4">
                     <div className="flex items-center gap-2 px-4 py-3 bg-zinc-800/50 rounded-2xl border border-white/5">
                        <StickyNote size={14} className="text-rose-500/50" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-zinc-400">Personal Notes</span>
                     </div>
                     <textarea 
                        className="w-full bg-zinc-800/20 border border-white/5 rounded-3xl p-6 text-sm text-zinc-300 focus:outline-none focus:ring-1 focus:ring-rose-500/30 placeholder:text-zinc-700 min-h-[180px] resize-none"
                        placeholder="Ex: Gosta de café sem açúcar, prefere tom cinza na barba..."
                        value={selectedClientNotes.notes}
                        onChange={(e) => setSelectedClientNotes({...selectedClientNotes, notes: e.target.value})}
                     />
                  </div>

                  <button 
                     onClick={handleSaveNotes}
                     disabled={isSavingNotes}
                     className="w-full bg-white text-black py-5 rounded-3xl font-black text-sm uppercase tracking-widest hover:bg-zinc-200 transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                  >
                     {isSavingNotes ? (
                        <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                     ) : (
                        <>
                           <Check size={18} />
                           Salvar Histórico
                        </>
                     )}
                  </button>
               </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Premium Tab Bar for Mobile Flow */}
      <nav className="fixed bottom-6 left-1/2 -translate-x-1/2 w-[90%] max-w-xs bg-zinc-900/80 backdrop-blur-2xl border border-white/10 rounded-full p-2 flex items-center justify-between z-50 shadow-2xl shadow-black">
        <button className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-rose-500">
           <Calendar size={18} />
           <span className="text-[8px] font-black tracking-widest uppercase">Agenda</span>
        </button>
        <button className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-zinc-500">
           <User size={18} />
           <span className="text-[8px] font-black tracking-widest uppercase">Clientes</span>
        </button>
        <button className="flex-1 flex flex-col items-center justify-center gap-1 py-2 text-zinc-500">
           <TrendingUp size={18} />
           <span className="text-[8px] font-black tracking-widest uppercase">Metas</span>
        </button>
      </nav>
    </div>
  );
}
