import React, { useState, useEffect } from 'react';
import { 
  Users, 
  CreditCard, 
  TrendingUp, 
  Activity, 
  ShieldCheck, 
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Settings,
  Plus,
  Search,
  Filter,
  MoreVertical,
  Ban,
  CheckCircle2,
  Globe,
  Database,
  Zap,
  Save,
  Trash2
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plan, Subscription, UserProfile } from '../types';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { apiFetch } from '../lib/api';

export default function SuperAdmin() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    monthlyRevenue: 0,
    churnRate: 2.4
  });
  const [plans, setPlans] = useState<Plan[]>([]);
  const [tenants, setTenants] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [apiStatus, setApiStatus] = useState({
    firebase: 'online',
    asaas: 'online',
    evolution: 'online',
    webhooks: 'online'
  });
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        // First check if user is super admin by trying to fetch stats
        const statsData = await apiFetch('/admin/stats');
        setIsSuperAdmin(true);
        setStats(statsData);

        const [plansData, usersData] = await Promise.all([
          apiFetch('/admin/plans'),
          apiFetch('/admin/users')
        ]);

        setPlans(plansData);
        setTenants(usersData);
      } catch (error: any) {
        if (error.message === 'Forbidden') {
          setIsSuperAdmin(false);
        }
        console.error("Error fetching superadmin data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, []);

  const handleSuspendAccount = async (userId: string, currentStatus: string) => {
    const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended';
    try {
      await apiFetch(`/admin/users/${userId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus })
      });
      setTenants(tenants.map(t => t.id === userId ? { ...t, status: newStatus } : t));
    } catch (error) {
      console.error("Error updating user status:", error);
    }
  };

  const handleUpdateUserPlan = async (userId: string, planId: string) => {
    try {
      await apiFetch(`/admin/users/${userId}/plan`, {
        method: 'PUT',
        body: JSON.stringify({ planId })
      });
      setTenants(tenants.map(t => t.id === userId ? { ...t, planId } : t));
      alert('Plano atualizado com sucesso!');
    } catch (error: any) {
      console.error("Error updating user plan:", error);
      alert(`Erro ao atualizar plano: ${error.message}`);
    }
  };

  const handleUpdatePlanPrice = async (planId: string, type: 'monthly' | 'yearly', value: number) => {
    try {
      const plan = plans.find(p => p.id === planId);
      if (!plan) return;
      const updatedPlan = { ...plan, [type === 'monthly' ? 'priceMonthly' : 'priceYearly']: value };
      
      await apiFetch(`/admin/plans/${planId}`, {
        method: 'PUT',
        body: JSON.stringify(updatedPlan)
      });
      setPlans(plans.map(p => p.id === planId ? updatedPlan : p));
    } catch (error) {
      console.error("Error updating plan price:", error);
    }
  };

  const handleSavePlan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingPlan) return;
    try {
      await apiFetch(`/admin/plans/${editingPlan.id}`, {
        method: 'PUT',
        body: JSON.stringify(editingPlan)
      });
      setPlans(plans.map(p => p.id === editingPlan.id ? editingPlan : p));
      setEditingPlan(null);
    } catch (error) {
      console.error("Error saving plan:", error);
    }
  };

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div></div>;

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <ShieldCheck size={64} className="text-rose-500 mb-4" />
        <h2 className="text-2xl font-bold text-zinc-900">Acesso Negado</h2>
        <p className="text-zinc-500">Você não tem permissão para acessar esta área.</p>
      </div>
    );
  }

  const revenueData = [
    { name: 'Jan', value: 4200 },
    { name: 'Fev', value: 3800 },
    { name: 'Mar', value: 5100 },
    { name: 'Abr', value: 4800 },
    { name: 'Mai', value: 6200 },
    { name: 'Jun', value: 7500 },
  ];

  const planDistribution = [
    { name: 'Bronze', value: 45, color: '#a1a1aa' },
    { name: 'Silver', value: 30, color: '#f43f5e' },
    { name: 'Gold', value: 25, color: '#e11d48' },
  ];

  return (
    <div className="space-y-8 pb-20 bg-zinc-950 -m-10 p-10 min-h-screen text-white">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Super Admin Dashboard</h1>
          <p className="text-zinc-400">Gestão centralizada do SaaS <span className="text-rose-500 font-bold italic tracking-tight">Salão Pro Manager</span></p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-4 py-2 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center gap-2">
            <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-sm font-medium">Sistemas Operacionais</span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Total de Salões" 
          value={stats.totalUsers.toString()} 
          icon={<Users className="text-blue-400" />} 
          trend="+12%" 
          trendUp={true} 
        />
        <StatCard 
          title="Assinaturas Ativas" 
          value={stats.activeSubscriptions.toString()} 
          icon={<CreditCard className="text-emerald-400" />} 
          trend="+5%" 
          trendUp={true} 
        />
        <StatCard 
          title="MRR Estimado" 
          value={`R$ 12.450,00`} 
          icon={<TrendingUp className="text-rose-400" />} 
          trend="+18%" 
          trendUp={true} 
        />
        <StatCard 
          title="Saúde da API" 
          value="99.9%" 
          icon={<Zap className="text-purple-400" />} 
          trend="Estável" 
          trendUp={true} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Revenue Chart */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h3 className="text-lg font-bold">Crescimento de Receita</h3>
              <p className="text-sm text-zinc-500">Evolução mensal do faturamento</p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-rose-500">
                <div className="w-2 h-2 bg-rose-500 rounded-full" /> Receita
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#27272a" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#71717a', fontSize: 12}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)' }}
                />
                <Area type="monotone" dataKey="value" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Plan Distribution */}
        <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl">
          <h3 className="text-lg font-bold mb-8">Distribuição de Planos</h3>
          <div className="h-[200px] mb-8">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={planDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {planDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '12px', border: '1px solid #27272a' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="space-y-4">
            {planDistribution.map(item => (
              <div key={item.name} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-sm text-zinc-400">{item.name}</span>
                </div>
                <span className="text-sm font-bold">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* API Monitoring & Plan Config */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* API Status */}
        <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Activity size={20} className="text-rose-500" />
            Monitoramento de API
          </h3>
          <div className="space-y-6">
            <StatusItem label="Firebase Firestore" status={apiStatus.firebase} icon={<Database size={18} />} />
            <StatusItem label="Asaas Payment API" status={apiStatus.asaas} icon={<CreditCard size={18} />} />
            <StatusItem label="Evolution WhatsApp API" status={apiStatus.evolution} icon={<Globe size={18} />} />
            <StatusItem label="Webhooks System" status={apiStatus.webhooks} icon={<Zap size={18} />} />
          </div>
        </div>

        {/* Plan Pricing Config */}
        <div className="lg:col-span-2 bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800 shadow-2xl">
          <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
            <Settings size={20} className="text-rose-500" />
            Configurações de SaaS
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map(plan => (
              <div key={plan.id} className="p-6 bg-zinc-800/50 rounded-2xl border border-zinc-700 group relative">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-bold text-rose-500">{plan.name}</h4>
                  <button 
                    onClick={() => setEditingPlan(plan)}
                    className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-700 rounded-lg transition-all"
                  >
                    <Settings size={16} />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Preços</p>
                    <p className="text-sm font-medium">Mensal: R$ {plan.priceMonthly.toFixed(2)}</p>
                    <p className="text-sm font-medium">Anual: R$ {plan.priceYearly.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-zinc-500 uppercase font-bold mb-1">Recursos</p>
                    <ul className="text-[10px] space-y-1 text-zinc-400">
                      <li>• {plan.features.staffLimit === null ? 'Ilimitados' : plan.features.staffLimit} Profissionais</li>
                      <li>• Estoque: {plan.features.inventory ? 'Sim' : 'Não'}</li>
                      <li>• Relatórios: {plan.features.reports ? 'Sim' : 'Não'}</li>
                      <li>• WhatsApp: {plan.features.whatsapp ? 'Sim' : 'Não'}</li>
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Plan Editor Modal */}
      <AnimatePresence>
        {editingPlan && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setEditingPlan(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-800 bg-zinc-900/50">
                <h3 className="text-xl font-bold">Editar Plano: {editingPlan.name}</h3>
                <p className="text-sm text-zinc-500">Ajuste preços e recursos do plano global</p>
              </div>
              <form onSubmit={handleSavePlan} className="p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Preço Mensal (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={editingPlan.priceMonthly}
                      onChange={e => setEditingPlan({...editingPlan, priceMonthly: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Preço Anual (R$)</label>
                    <input 
                      type="number"
                      step="0.01"
                      value={editingPlan.priceYearly}
                      onChange={e => setEditingPlan({...editingPlan, priceYearly: parseFloat(e.target.value)})}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-400">Limite de Profissionais (0 = Ilimitado)</label>
                    <input 
                      type="number"
                      value={editingPlan.features.staffLimit === null ? 0 : editingPlan.features.staffLimit}
                      onChange={e => {
                        const val = parseInt(e.target.value);
                        setEditingPlan({
                          ...editingPlan,
                          features: { ...editingPlan.features, staffLimit: val === 0 ? null : val }
                        });
                      }}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer hover:border-rose-500/50 transition-all">
                    <input 
                      type="checkbox"
                      checked={editingPlan.features.inventory}
                      onChange={e => setEditingPlan({
                        ...editingPlan,
                        features: { ...editingPlan.features, inventory: e.target.checked }
                      })}
                      className="w-5 h-5 accent-rose-500 rounded"
                    />
                    <span className="text-sm font-medium text-zinc-300">Estoque</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer hover:border-rose-500/50 transition-all">
                    <input 
                      type="checkbox"
                      checked={editingPlan.features.reports}
                      onChange={e => setEditingPlan({
                        ...editingPlan,
                        features: { ...editingPlan.features, reports: e.target.checked }
                      })}
                      className="w-5 h-5 accent-rose-500 rounded"
                    />
                    <span className="text-sm font-medium text-zinc-300">Relatórios</span>
                  </label>
                  <label className="flex items-center gap-3 p-4 bg-zinc-950 rounded-2xl border border-zinc-800 cursor-pointer hover:border-rose-500/50 transition-all">
                    <input 
                      type="checkbox"
                      checked={editingPlan.features.whatsapp}
                      onChange={e => setEditingPlan({
                        ...editingPlan,
                        features: { ...editingPlan.features, whatsapp: e.target.checked }
                      })}
                      className="w-5 h-5 accent-rose-500 rounded"
                    />
                    <span className="text-sm font-medium text-zinc-300">WhatsApp</span>
                  </label>
                </div>

                <div className="flex justify-end gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingPlan(null)}
                    className="px-8 py-3 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition-all font-bold"
                  >
                    Cancelar
                  </button>
                  <button 
                    type="submit"
                    className="bg-rose-500 text-zinc-900 px-10 py-3 rounded-xl font-bold hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
                  >
                    Salvar Alterações
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Tenants Table */}
      <div className="bg-zinc-900/50 backdrop-blur-xl rounded-3xl border border-zinc-800 shadow-2xl overflow-hidden">
        <div className="p-8 border-b border-zinc-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h3 className="text-xl font-bold">Gestão de Salões</h3>
            <p className="text-sm text-zinc-500">Lista completa de todos os tenants do sistema</p>
          </div>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500" size={18} />
            <input 
              type="text" 
              placeholder="Buscar salão..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-zinc-900 border border-zinc-800 rounded-xl pl-12 pr-4 py-2.5 text-sm w-full md:w-64 focus:border-rose-500 outline-none transition-all"
            />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-zinc-900/80 text-zinc-500 text-xs uppercase tracking-wider">
              <tr>
                <th className="px-8 py-5 font-bold">Salão / Dono</th>
                <th className="px-8 py-5 font-bold">Plano</th>
                <th className="px-8 py-5 font-bold">Status</th>
                <th className="px-8 py-5 font-bold">Cadastro</th>
                <th className="px-8 py-5 font-bold text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {tenants
                .filter(t => t.shopName.toLowerCase().includes(searchTerm.toLowerCase()) || t.email.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(tenant => (
                <tr key={tenant.id} className="hover:bg-zinc-800/30 transition-colors">
                  <td className="px-8 py-6">
                    <div>
                      <p className="font-bold text-white">{tenant.shopName}</p>
                      <p className="text-sm text-zinc-500">{tenant.email}</p>
                    </div>
                  </td>
                  <td className="px-8 py-6">
                    <select
                      value={tenant.planId || 'plan_bronze'}
                      onChange={(e) => handleUpdateUserPlan(tenant.id!, e.target.value)}
                      className="bg-zinc-800 text-zinc-300 text-xs font-bold rounded-lg border border-zinc-700 px-3 py-1.5 outline-none focus:ring-1 focus:ring-rose-500 cursor-pointer appearance-none hover:bg-zinc-700 transition-colors"
                    >
                      {plans.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-8 py-6">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${tenant.status === 'suspended' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                      <span className={`text-sm font-medium ${tenant.status === 'suspended' ? 'text-rose-400' : 'text-emerald-400'}`}>
                        {tenant.status === 'suspended' ? 'Suspenso' : 'Ativo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-8 py-6 text-sm text-zinc-500">
                    {new Date(tenant.createdAt).toLocaleDateString('pt-BR')}
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button 
                      onClick={() => handleSuspendAccount(tenant.id!, tenant.status || 'active')}
                      className={`p-2 rounded-lg transition-colors ${tenant.status === 'suspended' ? 'text-emerald-400 hover:bg-emerald-400/10' : 'text-rose-400 hover:bg-rose-400/10'}`}
                      title={tenant.status === 'suspended' ? 'Ativar Conta' : 'Suspender Conta'}
                    >
                      {tenant.status === 'suspended' ? <CheckCircle2 size={20} /> : <Ban size={20} />}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: { title: string, value: string, icon: React.ReactNode, trend: string, trendUp: boolean }) {
  return (
    <div className="bg-zinc-900/50 backdrop-blur-xl p-6 rounded-3xl border border-zinc-800 shadow-xl group hover:border-zinc-700 transition-all">
      <div className="flex items-center justify-between mb-4">
        <div className="w-12 h-12 bg-zinc-800 rounded-2xl flex items-center justify-center group-hover:bg-zinc-700 transition-all">
          {icon}
        </div>
        <div className={`flex items-center gap-1 text-xs font-bold ${trendUp ? 'text-emerald-400' : 'text-rose-400'}`}>
          {trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
          {trend}
        </div>
      </div>
      <p className="text-sm font-medium text-zinc-500 mb-1">{title}</p>
      <p className="text-2xl font-bold text-white">{value}</p>
    </div>
  );
}

function StatusItem({ label, status, icon }: { label: string, status: string, icon: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between p-4 bg-zinc-800/30 rounded-2xl border border-zinc-800">
      <div className="flex items-center gap-3">
        <div className="text-zinc-500">{icon}</div>
        <span className="text-sm font-medium text-zinc-300">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status === 'online' ? 'bg-emerald-500' : 'bg-rose-500'}`} />
        <span className={`text-xs font-bold uppercase tracking-wider ${status === 'online' ? 'text-emerald-500' : 'text-rose-500'}`}>
          {status === 'online' ? 'Online' : 'Offline'}
        </span>
      </div>
    </div>
  );
}
