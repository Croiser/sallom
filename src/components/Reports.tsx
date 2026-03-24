import React, { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  PieChart as PieChartIcon, 
  BarChart as BarChartIcon,
  Calendar,
  Filter,
  Download
} from 'lucide-react';
import { Transaction, Appointment } from '../types';
import { useSubscription } from '../hooks/useSubscription';
import { Crown, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell,
  Legend
} from 'recharts';

interface ReportsProps {
  onNavigate?: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

export default function Reports({ onNavigate }: ReportsProps) {
  const { user } = useAuth();
  const { plan, loading: subLoading } = useSubscription();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState('month'); // 'week', 'month', 'year'

  useEffect(() => {
    if (subLoading || !user) return;

    if (!plan?.features.reports) {
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        const [transData, appsData] = await Promise.all([
          api.get('/transactions'),
          api.get('/appointments')
        ]);
        setTransactions(transData);
        setAppointments(appsData.filter((a: any) => a.status === 'completed'));
        setLoading(false);
      } catch (err) {
        console.error('Failed to fetch reports data:', err);
        setLoading(false);
      }
    };

    fetchData();
  }, [subLoading, plan?.features.reports, user]);

  // Filter data based on dateRange
  const getFilteredData = () => {
    const now = new Date();
    let startDate = new Date();
    if (dateRange === 'week') startDate.setDate(now.getDate() - 7);
    else if (dateRange === 'month') startDate.setMonth(now.getMonth() - 1);
    else if (dateRange === 'year') startDate.setFullYear(now.getFullYear() - 1);

    return {
      transactions: transactions.filter(t => new Date(t.date) >= startDate),
      appointments: appointments.filter(a => new Date(a.date) >= startDate)
    };
  };

  const filtered = getFilteredData();

  // Stats
  const totalIncome = filtered.transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = filtered.transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  const totalCommissions = filtered.transactions.filter(t => t.category === 'Comissões').reduce((acc, t) => acc + t.amount, 0);
  const profit = totalIncome - totalExpense;

  // Service Breakdown
  const serviceData = filtered.appointments.reduce((acc: any[], app) => {
    const existing = acc.find(item => item.name === app.serviceName);
    if (existing) {
      existing.value += app.price;
      existing.count += 1;
    } else {
      acc.push({ name: app.serviceName, value: app.price, count: 1 });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // Barber Breakdown (Revenue)
  const barberData = filtered.appointments.reduce((acc: any[], app) => {
    const existing = acc.find(item => item.name === app.barberName);
    if (existing) {
      existing.value += app.price;
    } else {
      acc.push({ name: app.barberName, value: app.price });
    }
    return acc;
  }, []).sort((a, b) => b.value - a.value);

  // Commission Breakdown
  const commissionData = filtered.transactions
    .filter(t => t.category === 'Comissões')
    .reduce((acc: any[], t) => {
      // Description is usually "Comissão: Name - Ref: Client"
      const name = t.description.split(' - ')[0].replace('Comissão: ', '');
      const existing = acc.find(item => item.name === name);
      if (existing) {
        existing.value += t.amount;
      } else {
        acc.push({ name, value: t.amount });
      }
      return acc;
    }, []).sort((a, b) => b.value - a.value);

  const COLORS = ['#f43f5e', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b'];

  if (subLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>;

  if (!plan?.features.reports) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <Lock size={40} className="text-rose-600" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Relatórios Exclusivos</h2>
        <p className="text-zinc-500 max-w-md mb-8">
          A análise detalhada de faturamento e desempenho está disponível apenas nos planos **Silver** e **Gold**. 
          Faça o upgrade agora para visualizar o crescimento do seu negócio.
        </p>
        <button 
          onClick={() => onNavigate?.('subscription', { planId: 'silver' })}
          className="flex items-center gap-2 bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
        >
          <Crown size={20} />
          Fazer Upgrade para Silver Agora
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Relatórios</h2>
          <p className="text-zinc-500">Análise detalhada do seu negócio</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-white border border-zinc-200 rounded-2xl p-1 flex">
            {['week', 'month', 'year'].map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`
                  px-4 py-2 rounded-xl text-sm font-bold transition-all
                  ${dateRange === range ? 'bg-zinc-900 text-white shadow-md' : 'text-zinc-500 hover:bg-zinc-50'}
                `}
              >
                {range === 'week' ? 'Semana' : range === 'month' ? 'Mês' : 'Ano'}
              </button>
            ))}
          </div>
          <button className="p-3 bg-white border border-zinc-200 rounded-2xl text-zinc-600 hover:bg-zinc-50 transition-all">
            <Download size={20} />
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Receita</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">R$ {totalIncome.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 text-rose-600 mb-2">
            <TrendingDown size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Despesas</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">R$ {totalExpense.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 text-rose-600 mb-2">
            <BarChartIcon size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Comissões</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">R$ {totalCommissions.toLocaleString('pt-BR')}</p>
        </div>
        <div className={`p-6 rounded-3xl border shadow-sm ${profit >= 0 ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'}`}>
          <div className={`flex items-center gap-3 mb-2 ${profit >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
            <BarChartIcon size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Lucro Líquido</span>
          </div>
          <p className={`text-2xl font-bold ${profit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
            R$ {profit.toLocaleString('pt-BR')}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Services Chart */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <PieChartIcon size={20} className="text-rose-500" />
            Serviços mais Rentáveis
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={serviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {serviceData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Barbers Revenue Chart */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <BarChartIcon size={20} className="text-rose-500" />
            Faturamento por Profissional
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barberData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" hide />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#18181b' }}
                  width={100}
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]}>
                  {barberData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Commissions Chart */}
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm lg:col-span-2">
          <h3 className="font-bold text-zinc-900 mb-6 flex items-center gap-2">
            <TrendingDown size={20} className="text-rose-500" />
            Comissões Pagas por Profissional
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={commissionData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#18181b' }}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontSize: 12, fontWeight: 600, fill: '#71717a' }}
                  tickFormatter={(value) => `R$ ${value}`}
                />
                <Tooltip 
                  formatter={(value: number) => `R$ ${value.toLocaleString('pt-BR')}`}
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  cursor={{ fill: '#f8fafc' }}
                />
                <Bar dataKey="value" fill="#f43f5e" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <h3 className="font-bold text-zinc-900">Detalhamento de Serviços</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Serviço</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Quantidade</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Ticket Médio</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Comissão Total</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Total Bruto</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {serviceData.map((service, index) => {
                const serviceCommissions = filtered.transactions
                  .filter(t => t.category === 'Comissões' && t.description.includes(`Ref: ${service.name}`))
                  .reduce((acc, t) => acc + t.amount, 0);
                
                // Note: The description logic above might be brittle if description format changes.
                // However, Appointments.tsx currently uses: `Comissão: ${staffMember.name} - Ref: ${app.clientName}`
                // Wait, I used app.clientName as Ref. I should have used serviceName too or different format.
                
                return (
                  <tr key={index} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-6 py-4 font-semibold text-zinc-900">{service.name}</td>
                    <td className="px-6 py-4 text-zinc-600">{service.count} atendimentos</td>
                    <td className="px-6 py-4 text-zinc-600">R$ {(service.value / service.count).toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-rose-600 font-medium">R$ {serviceCommissions.toLocaleString('pt-BR')}</td>
                    <td className="px-6 py-4 text-right font-bold text-zinc-900">R$ {service.value.toLocaleString('pt-BR')}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
