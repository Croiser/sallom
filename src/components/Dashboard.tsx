import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Calendar, 
  Clock,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  AlertCircle,
  Sparkles,
  Zap,
  DollarSign,
  Crown,
  MessageSquare
} from 'lucide-react';
import { Appointment, Transaction } from '../types';
import { Check, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from 'recharts';
import OnboardingChecklist from './OnboardingChecklist';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface DashboardProps {
  onNavigate: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchData = async () => {
    if (!user) return;
    try {
      const [appsData, transData] = await Promise.all([
        api.get('/appointments'),
        api.get('/transactions')
      ]);
      setAppointments(appsData);
      setTransactions(transData);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [user]);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      
      if (status === 'completed') {
        setToast({ message: 'Agendamento concluído e financeiro atualizado!', type: 'success' });
      } else if (status === 'cancelled') {
        setToast({ message: 'Agendamento cancelado.', type: 'success' });
      }
      
      fetchData();
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ message: 'Erro ao atualizar status.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const stats = {
    revenue: transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0),
    expenses: transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0),
    appointmentsToday: appointments.filter(a => {
      const today = new Date().toISOString().split('T')[0];
      return a.date.startsWith(today);
    }).length,
    activeClients: new Set(appointments.map(a => a.clientName)).size,
  };

  // Prepare chart data
  const chartData = transactions.reduce((acc: any[], t) => {
    const date = new Date(t.date).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' });
    const existing = acc.find(item => item.date === date);
    if (existing) {
      if (t.type === 'income') existing.receita += t.amount;
      else existing.despesa += t.amount;
    } else {
      acc.push({
        date,
        receita: t.type === 'income' ? t.amount : 0,
        despesa: t.type === 'expense' ? t.amount : 0
      });
    }
    return acc;
  }, []).slice(-7);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-10 pb-12">
      {/* Onboarding Checklist */}
      <OnboardingChecklist onNavigate={(tab) => onNavigate(tab)} />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2rem] border border-surface-200 shadow-premium group transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
              <DollarSign size={28} />
            </div>
            <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full uppercase tracking-widest">Mensal</span>
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Faturamento Total</p>
          <h3 className="text-3xl font-display font-black text-surface-900 leading-none">
            <span className="text-sm font-medium text-zinc-400 mr-1">R$</span>
            {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2rem] border border-surface-200 shadow-premium group transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-brand-50 text-brand-500 rounded-2xl group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
              <TrendingDown size={28} />
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Despesas Totais</p>
          <h3 className="text-3xl font-display font-black text-surface-900 leading-none">
            <span className="text-sm font-medium text-zinc-400 mr-1">R$</span>
            {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2rem] border border-surface-200 shadow-premium group transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-brand-50 text-brand-500 rounded-2xl group-hover:bg-brand-500 group-hover:text-white transition-all duration-300">
              <Calendar size={28} />
            </div>
            <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-3 py-1.5 rounded-full uppercase tracking-widest">Hoje</span>
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Agendamentos</p>
          <h3 className="text-3xl font-display font-black text-surface-900 leading-none">{stats.appointmentsToday}</h3>
        </motion.div>

        <motion.div 
          whileHover={{ y: -5 }}
          className="bg-white p-8 rounded-[2rem] border border-surface-200 shadow-premium group transition-all"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="p-4 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all duration-300">
              <Users size={28} />
            </div>
          </div>
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest mb-2">Clientes Ativos</p>
          <h3 className="text-3xl font-display font-black text-surface-900 leading-none">{stats.activeClients}</h3>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-surface-200 shadow-premium">
          <div className="flex items-center justify-between mb-10">
            <div>
              <h3 className="text-xl font-display font-black text-surface-900 tracking-tight">Análise Financeira</h3>
              <p className="text-xs text-zinc-400 font-medium mt-1">Comparativo de receita e despesas (7 dias)</p>
            </div>
            <div className="flex items-center gap-6 text-[10px] font-black uppercase tracking-[0.2em]">
              <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
                <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-[0_0_8px_#10b981]" /> Receita
              </div>
              <div className="flex items-center gap-2 text-brand-500 bg-brand-50 px-3 py-1.5 rounded-full border border-brand-100">
                <div className="w-2 h-2 bg-brand-500 rounded-full shadow-[0_0_8px_#f43f5e]" /> Despesa
              </div>
            </div>
          </div>
          <div className="h-96 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                  dy={20}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 10, fill: '#94a3b8', fontWeight: 'bold' }}
                  tickFormatter={(val) => `R$ ${val}`}
                />
                <Tooltip 
                  cursor={{ stroke: '#f1f5f9', strokeWidth: 2 }}
                  contentStyle={{ 
                    borderRadius: '24px', 
                    border: '1px solid #f1f5f9', 
                    boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.05)',
                    padding: '16px',
                    fontFamily: 'Inter'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#10b981" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorReceita)" 
                  animationDuration={2000}
                />
                <Area 
                  type="monotone" 
                  dataKey="despesa" 
                  stroke="#f43f5e" 
                  strokeWidth={4}
                  fillOpacity={1} 
                  fill="url(#colorDespesa)" 
                  animationDuration={2500}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="space-y-8">
          <motion.div 
            whileHover={{ scale: 1.02 }}
            className="bg-surface-900 text-white p-10 rounded-[2.5rem] shadow-2xl relative overflow-hidden group"
          >
            <div className="relative z-10">
              <div className="w-12 h-12 bg-brand-500 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-brand-500/20">
                <Crown size={24} className="text-white" />
              </div>
              <h3 className="text-2xl font-display font-black mb-2 flex items-center gap-2">
                Plano Premium
                <span className="text-[10px] bg-brand-500 px-2 py-0.5 rounded-full uppercase">Ativo</span>
              </h3>
              <p className="text-zinc-400 text-sm mb-10 leading-relaxed font-medium">Sua assinatura vence em <span className="text-white font-bold">15 dias</span>. Garanta a continuidade dos seus serviços.</p>
              <button 
                onClick={() => onNavigate?.('subscription', { planId: 'gold' })}
                className="w-full bg-white text-surface-900 font-black py-4 rounded-2xl hover:bg-zinc-100 transition-all flex items-center justify-center gap-2 group-hover:shadow-[0_0_20px_rgba(255,255,255,0.3)] shadow-lg"
              >
                <Zap size={16} className="fill-brand-500 text-brand-500" />
                Renovar Mensalidade
              </button>
            </div>
            <Sparkles className="absolute -bottom-10 -right-10 text-white/5 group-hover:text-brand-500/10 transition-colors duration-700" size={180} />
          </motion.div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-surface-200 shadow-premium">
            <h3 className="text-lg font-display font-black text-surface-900 mb-6">Infraestrutura</h3>
            <div className="space-y-5">
              <div className="flex items-center justify-between p-4 bg-surface-50 rounded-2xl border border-surface-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <CheckCircle2 size={18} />
                  </div>
                  <span className="text-sm font-bold text-surface-900">Servidores</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">Estável</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-surface-50 rounded-2xl border border-surface-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                    <MessageSquare size={18} />
                  </div>
                  <span className="text-sm font-bold text-surface-900">WhatsApp API</span>
                </div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">Conectado</span>
              </div>
              <div className="flex items-center justify-between p-4 bg-brand-50 rounded-2xl border border-brand-100">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-brand-100 text-brand-500 rounded-lg">
                    <AlertCircle size={18} />
                  </div>
                  <span className="text-sm font-bold text-brand-700 font-display">Backup</span>
                </div>
                <span className="text-[10px] font-black text-brand-500 uppercase">Atenção</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-[2.5rem] border border-surface-200 shadow-premium overflow-hidden">
        <div className="p-8 border-b border-surface-100 flex items-center justify-between bg-surface-50/50">
          <div>
            <h3 className="text-xl font-display font-black text-surface-900 tracking-tight">Agenda Recente</h3>
            <p className="text-xs text-zinc-400 font-medium mt-1">Status em tempo real dos seus atendimentos</p>
          </div>
          <button className="text-xs font-black text-brand-500 uppercase tracking-widest hover:text-brand-600 transition-colors bg-brand-50 px-4 py-2 rounded-full border border-brand-100">Ver Agenda Completa</button>
        </div>
        <div className="divide-y divide-surface-100">
          {appointments.length > 0 ? (
            <AnimatePresence>
              {appointments.map((app, index) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  key={app.id} 
                  className="p-8 flex items-center justify-between hover:bg-surface-50 transition-all duration-300 group"
                >
                  <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-gradient-to-br from-surface-100 to-surface-200 rounded-2xl flex items-center justify-center text-surface-900 text-lg font-black shadow-inner">
                      {app.clientName.charAt(0)}
                    </div>
                    <div>
                      <p className="text-lg font-bold text-surface-900 group-hover:text-brand-500 transition-colors uppercase tracking-tight">{app.clientName}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] font-black bg-surface-100 text-surface-900 px-2 py-0.5 rounded uppercase tracking-wider">{app.serviceName}</span>
                        <span className="text-zinc-300">•</span>
                        <span className="text-xs font-bold text-zinc-500">{app.staffName || app.barberName}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-8">
                    <div className="flex flex-col items-end">
                      <div className="flex items-center gap-2 text-surface-900 font-display font-black text-lg mb-1">
                        <Clock size={16} className="text-brand-500" />
                        {new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </div>
                      <span className={`
                        text-[10px] uppercase tracking-[0.1em] font-black px-3 py-1 rounded-full border
                        ${app.status === 'scheduled' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          app.status === 'completed' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 
                          'bg-rose-50 text-rose-700 border-rose-100'}
                      `}>
                        {app.status === 'scheduled' ? 'Agendado' : app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                      </span>
                    </div>
                    {app.status === 'scheduled' && (
                      <div className="flex items-center gap-3">
                        <button 
                          onClick={() => updateStatus(app.id, 'completed')}
                          className="w-12 h-12 flex items-center justify-center bg-emerald-500 text-white rounded-2xl hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20 active:scale-95"
                          title="Concluir Atendimento"
                        >
                          <Check size={20} strokeWidth={3} />
                        </button>
                        <button 
                          onClick={() => updateStatus(app.id, 'cancelled')}
                          className="w-12 h-12 flex items-center justify-center bg-white text-surface-400 border border-surface-200 rounded-2xl hover:text-rose-500 hover:border-rose-200 transition-all active:scale-95"
                          title="Cancelar"
                        >
                          <X size={20} strokeWidth={3} />
                        </button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          ) : (
            <div className="p-20 text-center">
              <div className="w-16 h-16 bg-surface-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="text-zinc-300" size={32} />
              </div>
              <p className="text-zinc-400 font-bold uppercase tracking-widest text-sm">Nenhum agendamento recente</p>
            </div>
          )}
        </div>
      </div>

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-[100] px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${
              toast.type === 'success' 
                ? 'bg-emerald-900/90 border-emerald-500/50 text-emerald-50' 
                : 'bg-rose-900/90 border-rose-500/50 text-rose-50'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
            }`}>
              {toast.type === 'success' ? (
                <Check size={18} className="text-emerald-900" strokeWidth={3} />
              ) : (
                <X size={18} className="text-rose-900" strokeWidth={3} />
              )}
            </div>
            <span className="font-display font-black text-sm tracking-tight uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
