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
  Zap,
  DollarSign
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
import { apiFetch } from '../lib/api';

interface DashboardProps {
  onNavigate?: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [appsData, transData] = await Promise.all([
          apiFetch('/appointments'),
          apiFetch('/transactions')
        ]);
        setAppointments(appsData);
        setTransactions(transData);
      } catch (err) {
        console.error('Failed to fetch dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await apiFetch(`/appointments/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      });

      if (status === 'completed') {
        const app = appointments.find(a => a.id === id);
        if (app) {
          await apiFetch('/transactions', {
            method: 'POST',
            body: JSON.stringify({
              type: 'income',
              amount: app.price,
              description: `Serviço: ${app.serviceName} - ${app.clientName}`,
              date: new Date().toISOString(),
              category: 'Serviços'
            })
          });
          // Refresh transactions
          const transData = await apiFetch('/transactions');
          setTransactions(transData);
        }
        setToast({ message: 'Agendamento concluído e financeiro atualizado!', type: 'success' });
      } else if (status === 'cancelled') {
        setToast({ message: 'Agendamento cancelado.', type: 'success' });
      }
      
      // Refresh appointments
      const appsData = await apiFetch('/appointments');
      setAppointments(appsData);

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
    <div className="space-y-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm group hover:border-emerald-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl group-hover:bg-emerald-500 group-hover:text-white transition-all">
              <DollarSign size={24} />
            </div>
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">Total</span>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Faturamento Total</p>
          <h3 className="text-2xl font-bold text-zinc-900">R$ {stats.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-all">
              <TrendingDown size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Despesas Totais</p>
          <h3 className="text-2xl font-bold text-zinc-900">R$ {stats.expenses.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm group hover:border-rose-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl group-hover:bg-rose-500 group-hover:text-white transition-all">
              <Calendar size={24} />
            </div>
            <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-full">Hoje</span>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Agendamentos do Dia</p>
          <h3 className="text-2xl font-bold text-zinc-900">{stats.appointmentsToday}</h3>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm group hover:border-blue-200 transition-all">
          <div className="flex items-center justify-between mb-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl group-hover:bg-blue-500 group-hover:text-white transition-all">
              <Users size={24} />
            </div>
          </div>
          <p className="text-sm font-medium text-zinc-500 mb-1">Clientes Ativos</p>
          <h3 className="text-2xl font-bold text-zinc-900">{stats.activeClients}</h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-bold text-zinc-900">Desempenho Financeiro</h3>
            <div className="flex items-center gap-4 text-xs font-bold uppercase tracking-wider">
              <div className="flex items-center gap-1 text-emerald-600">
                <div className="w-2 h-2 bg-emerald-500 rounded-full" /> Receita
              </div>
              <div className="flex items-center gap-1 text-rose-600">
                <div className="w-2 h-2 bg-rose-500 rounded-full" /> Despesa
              </div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorReceita" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorDespesa" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fill: '#64748b' }}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '16px', 
                    border: 'none', 
                    boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                    padding: '12px'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="receita" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorReceita)" 
                />
                <Area 
                  type="monotone" 
                  dataKey="despesa" 
                  stroke="#f43f5e" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorDespesa)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Actions / Status */}
        <div className="space-y-6">
          <div className="bg-zinc-900 text-white p-8 rounded-3xl shadow-xl relative overflow-hidden">
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Plano Premium</h3>
              <p className="text-zinc-400 text-sm mb-6">Sua assinatura expira em 15 dias.</p>
              <button 
                onClick={() => onNavigate?.('subscription', { planId: 'gold' })}
                className="w-full bg-rose-500 text-white font-bold py-3 rounded-xl hover:bg-rose-400 transition-colors flex items-center justify-center gap-1"
              >
                <Zap size={14} />
                Renovar Agora
              </button>
            </div>
            <Sparkles className="absolute -bottom-6 -right-6 text-zinc-800" size={120} />
          </div>

          <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
            <h3 className="font-bold text-zinc-900 mb-4">Status do Sistema</h3>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <span className="text-sm text-zinc-600">Servidor Online</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckCircle2 className="text-emerald-500" size={20} />
                <span className="text-sm text-zinc-600">WhatsApp Conectado</span>
              </div>
              <div className="flex items-center gap-3">
                <AlertCircle className="text-rose-500" size={20} />
                <span className="text-sm text-zinc-600">Backup Pendente</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Appointments */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
          <h3 className="font-bold text-zinc-900">Próximos Agendamentos</h3>
          <button className="text-sm text-rose-600 font-medium hover:underline">Ver todos</button>
        </div>
        <div className="divide-y divide-zinc-100">
          {appointments.length > 0 ? appointments.map((app) => (
            <div key={app.id} className="p-6 flex items-center justify-between hover:bg-zinc-50 transition-colors">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center text-zinc-600 font-bold">
                  {app.clientName.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-zinc-900">{app.clientName}</p>
                  <p className="text-sm text-zinc-500">{app.serviceName} • {app.staffName || app.barberName}</p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex flex-col items-end mr-4">
                  <div className="flex items-center gap-1 text-zinc-900 font-medium mb-1">
                    <Clock size={14} className="text-zinc-400" />
                    {new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <span className={`
                    text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full
                    ${app.status === 'scheduled' ? 'bg-rose-100 text-rose-700' : 
                      app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                      'bg-rose-100 text-rose-700'}
                  `}>
                    {app.status === 'scheduled' ? 'Agendado' : app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                  </span>
                </div>
                {app.status === 'scheduled' && (
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => updateStatus(app.id, 'completed')}
                      className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"
                      title="Concluir"
                    >
                      <Check size={18} />
                    </button>
                    <button 
                      onClick={() => updateStatus(app.id, 'cancelled')}
                      className="p-2 text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                      title="Cancelar"
                    >
                      <X size={18} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          )) : (
            <div className="p-10 text-center text-zinc-500">
              Nenhum agendamento recente.
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
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-900 border-emerald-500/50 text-emerald-50' 
                : 'bg-rose-900 border-rose-500/50 text-rose-50'
            }`}
          >
            {toast.type === 'success' ? (
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <Check size={14} className="text-emerald-900" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <X size={14} className="text-rose-900" />
              </div>
            )}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
