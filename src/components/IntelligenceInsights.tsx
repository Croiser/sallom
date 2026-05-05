import React, { useState, useEffect } from 'react';
import { 
  Sparkles, 
  TrendingUp, 
  AlertTriangle, 
  ChevronRight, 
  MessageSquare,
  DollarSign,
  PieChart,
  ArrowUpRight,
  UserX
} from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';

export default function IntelligenceInsights() {
  const [churnRisk, setChurnRisk] = useState<any[]>([]);
  const [cashFlow, setCashFlow] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [churnData, cashData] = await Promise.all([
        api.get('/intelligence/churn'),
        api.get('/intelligence/cash-flow')
      ]);
      setChurnRisk(churnData || []);
      setCashFlow(cashData);
    } catch (err) {
      console.error('Failed to fetch intelligence data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  if (loading) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
      {/* Cash Flow Prediction Card */}
      {cashFlow && (
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-8 rounded-[2.5rem] border border-surface-200 shadow-premium relative overflow-hidden"
        >
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl">
                <PieChart size={20} />
              </div>
              <h3 className="text-lg font-display font-black text-surface-900 tracking-tight">Saúde Financeira</h3>
            </div>
            <span className={`text-[10px] font-black px-3 py-1.5 rounded-full uppercase tracking-widest border ${
              cashFlow?.isHealthy ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'
            }`}>
              {cashFlow?.isHealthy ? 'Saudável' : 'Atenção'}
            </span>
          </div>

          <div className="space-y-6">
            <div>
              <div className="flex justify-between items-end mb-2">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Meta de Equilíbrio (Break-even)</p>
                <span className="text-sm font-black text-surface-900">{Math.round(cashFlow?.breakEvenProgress || 0)}%</span>
              </div>
              <div className="w-full bg-zinc-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${cashFlow?.breakEvenProgress || 0}%` }}
                  transition={{ duration: 1.5, ease: "easeOut" }}
                  className={`h-full ${cashFlow?.isHealthy ? 'bg-emerald-500' : 'bg-amber-500'}`}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Média Mensal</p>
                <p className="text-lg font-display font-black text-surface-900">R$ {(cashFlow?.avgMonthlyRevenue || 0).toLocaleString('pt-BR')}</p>
              </div>
              <div className="bg-surface-50 p-4 rounded-2xl border border-surface-100">
                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Gap para Custos</p>
                <p className={`text-lg font-display font-black ${(cashFlow?.gapToExpenses || 0) > 0 ? 'text-brand-500' : 'text-emerald-600'}`}>
                  R$ {(cashFlow?.gapToExpenses || 0).toLocaleString('pt-BR')}
                </p>
              </div>
            </div>

            {(cashFlow?.gapToExpenses || 0) > 0 && (
              <div className="flex items-center gap-3 p-4 bg-brand-50 rounded-2xl border border-brand-100">
                <AlertTriangle size={18} className="text-brand-500" />
                <p className="text-xs font-medium text-brand-700 leading-tight">
                  Ainda faltam <span className="font-black">R$ {(cashFlow?.gapToExpenses || 0).toFixed(2)}</span> em vendas confirmadas para cobrir as despesas agendadas do mês.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}

      {/* Churn Risk Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white p-8 rounded-[2.5rem] border border-surface-200 shadow-premium flex flex-col"
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-brand-50 text-brand-500 rounded-2xl">
              <UserX size={20} />
            </div>
            <h3 className="text-lg font-display font-black text-surface-900 tracking-tight">Clientes em Risco (Churn)</h3>
          </div>
          <span className="text-[10px] font-black text-brand-500 bg-brand-50 px-3 py-1.5 rounded-full uppercase tracking-widest border border-brand-100">
            {churnRisk.length} Clientes
          </span>
        </div>

        <div className="flex-1 space-y-4 max-h-[280px] overflow-y-auto pr-2 custom-scrollbar">
          {churnRisk.length > 0 ? (
            churnRisk.map((client) => (
              <div key={client.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-2xl border border-surface-100 hover:border-brand-200 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black ${
                    client.riskLevel === 'High' ? 'bg-brand-100 text-brand-600' : 'bg-amber-100 text-amber-600'
                  }`}>
                    {client.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-surface-900 group-hover:text-brand-500 transition-colors uppercase">{client.name}</p>
                    <p className="text-[10px] font-bold text-zinc-400">Sumido há {client.daysSinceLast} dias</p>
                  </div>
                </div>
                <button 
                  onClick={() => window.open(`https://wa.me/${client.phone.replace(/\D/g, '')}`, '_blank')}
                  className="p-2.5 bg-white text-emerald-600 rounded-xl border border-emerald-100 hover:bg-emerald-500 hover:text-white transition-all shadow-sm"
                  title="Recuperar via WhatsApp"
                >
                  <MessageSquare size={16} />
                </button>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center py-10">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mb-3">
                <Sparkles size={24} />
              </div>
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Base de Clientes Saudável!</p>
            </div>
          )}
        </div>

        <div className="mt-6 pt-6 border-t border-zinc-100">
          <button className="w-full py-4 text-[10px] font-black text-brand-500 uppercase tracking-[0.2em] hover:bg-brand-50 rounded-2xl transition-all border border-transparent hover:border-brand-100">
            Ver Todos os Relatórios
          </button>
        </div>
      </motion.div>
    </div>
  );
}
