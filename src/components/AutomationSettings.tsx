import React, { useState, useEffect } from 'react';
import { 
  Wallet, 
  RefreshCcw, 
  History, 
  Zap, 
  AlertCircle,
  QrCode,
  ArrowUpRight,
  ArrowDownLeft,
  Settings2,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { motion } from 'motion/react';
import axios from 'axios';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

const api = axios.create({
  baseURL: '/api'
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Transaction {
  id: string;
  type: 'credit' | 'debit';
  category: 'recharge' | 'automation_usage';
  amount: number;
  description: string;
  createdAt: string;
}

interface WalletData {
  id: string;
  balance: number;
  isActive: boolean;
  transactions: Transaction[];
}

export default function AutomationSettings() {
  const [wallet, setWallet] = useState<WalletData | null>(null);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  useEffect(() => {
    fetchWallet();
  }, []);

  const fetchWallet = async () => {
    try {
      const { data } = await api.get('/wallet/me');
      setWallet({
        ...data,
        balance: Number(data.balance)
      });
    } catch (error) {
      console.error('Error fetching wallet:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleAutomation = async () => {
    if (!wallet) return;
    setToggling(true);
    try {
      const { data } = await api.post('/wallet/toggle', { isActive: !wallet.isActive });
      setWallet({
        ...wallet,
        isActive: data.isActive
      });
    } catch (error: any) {
      alert(error.response?.data?.error || 'Erro ao alternar automação');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <RefreshCcw className="text-rose-500 animate-spin" size={32} />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header & Balance Card */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-zinc-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl shadow-zinc-200">
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center">
                <Wallet className="text-rose-500" size={24} />
              </div>
              <div>
                <h2 className="text-sm font-bold text-zinc-400 uppercase tracking-widest">Saldo Disponível</h2>
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-black">R$ {wallet?.balance.toFixed(2)}</span>
                  <span className="text-rose-500 font-bold uppercase text-xs">BRL</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4">
              <button 
                className="bg-rose-500 text-white px-8 py-4 rounded-2xl font-bold flex items-center gap-3 hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20"
                onClick={() => alert('Sistema de PIX em homologação. Os créditos serão ativados em breve.')}
              >
                <QrCode size={20} />
                Recarregar via PIX
              </button>
              <div className="flex items-center gap-2 px-6 py-4 bg-white/5 rounded-2xl text-zinc-300 text-sm font-medium border border-white/10">
                <Zap className="text-amber-500" size={18} />
                Custo por disparo: R$ 0,10
              </div>
            </div>
          </div>
          
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-rose-500/5 blur-[120px] rounded-full" />
        </div>

        <div className={`
          rounded-[2.5rem] p-8 flex flex-col justify-between border-2 transition-all
          ${wallet?.isActive ? 'bg-emerald-50 border-emerald-100 shadow-emerald-500/10 shadow-xl' : 'bg-zinc-50 border-zinc-100 shadow-zinc-200/10 shadow-xl'}
        `}>
          <div>
            <div className="flex items-center justify-between mb-6">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${wallet?.isActive ? 'bg-emerald-500 text-white' : 'bg-zinc-200 text-zinc-500'}`}>
                <Settings2 size={24} />
              </div>
              <button 
                onClick={handleToggleAutomation}
                disabled={toggling || (wallet?.balance === 0 && !wallet?.isActive)}
                className={`
                  relative inline-flex h-8 w-14 items-center rounded-full transition-colors outline-none
                  ${wallet?.isActive ? 'bg-emerald-500' : 'bg-zinc-300'}
                  ${toggling ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                `}
              >
                <span className={`
                  inline-block h-6 w-6 transform rounded-full bg-white transition-transform
                  ${wallet?.isActive ? 'translate-x-7' : 'translate-x-1'}
                `} />
              </button>
            </div>
            <h3 className="text-lg font-bold text-zinc-900 mb-2">Lembretes WhatsApp</h3>
            <p className="text-sm text-zinc-500 leading-relaxed mb-6">
              Envio automático de lembretes e confirmações via API Oficial da Meta.
            </p>
          </div>

          {wallet?.balance === 0 && !wallet?.isActive && (
            <div className="flex items-center gap-2 p-3 bg-amber-100 text-amber-700 rounded-xl text-xs font-bold border border-amber-200">
              <AlertCircle size={14} />
              Adicione créditos para ativar
            </div>
          )}

          {wallet?.isActive && (
            <div className="flex items-center gap-2 p-3 bg-emerald-100 text-emerald-700 rounded-xl text-xs font-bold border border-emerald-200">
              <CheckCircle2 size={14} />
              Automação Ativa
            </div>
          )}
        </div>
      </div>

      {/* Transactions History */}
      <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-xl shadow-zinc-100 overflow-hidden">
        <div className="p-8 border-b border-zinc-50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center">
              <History size={20} />
            </div>
            <h3 className="text-xl font-bold text-zinc-900">Extrato Recente</h3>
          </div>
          <span className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Últimas 10 Transações</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Data</th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Tipo</th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Descrição</th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest">Valor</th>
                <th className="px-8 py-4 text-xs font-bold text-zinc-400 uppercase tracking-widest text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-50">
              {wallet?.transactions && wallet.transactions.length > 0 ? (
                wallet.transactions.map((tx) => (
                  <tr key={tx.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm text-zinc-500">
                      {format(new Date(tx.createdAt), "dd MMM, HH:mm", { locale: ptBR })}
                    </td>
                    <td className="px-8 py-5">
                      <div className={`
                        inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase
                        ${tx.type === 'credit' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}
                      `}>
                        {tx.type === 'credit' ? <ArrowUpRight size={12} /> : <ArrowDownLeft size={12} />}
                        {tx.type === 'credit' ? 'Crédito' : 'Débito'}
                      </div>
                    </td>
                    <td className="px-8 py-5 text-sm font-medium text-zinc-900">
                      {tx.description}
                    </td>
                    <td className="px-8 py-5 font-bold text-zinc-900">
                      {tx.type === 'credit' ? '+' : '-'} R$ {Number(tx.amount).toFixed(2)}
                    </td>
                    <td className="px-8 py-5 text-right">
                      <div className="inline-flex items-center gap-1.5 text-emerald-500 font-bold text-xs uppercase">
                        <CheckCircle2 size={14} />
                        Concluído
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-8 py-12 text-center text-zinc-400 italic">
                    Nenhuma transação encontrada
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 border border-blue-100 p-6 rounded-3xl flex items-start gap-4">
        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 flex-shrink-0">
          <AlertCircle size={20} />
        </div>
        <div>
          <h4 className="font-bold text-blue-900 mb-1">Como funcionam os créditos?</h4>
          <p className="text-sm text-blue-700 leading-relaxed">
            Seu saldo é utilizado apenas para o envio automático de mensagens via WhatsApp. 
            Cada agendamento que dispara uma notificação desconta R$ 0,10. 
            Se o seu saldo chegar a zero, a automação é suspensa até que uma nova recarga seja realizada.
          </p>
        </div>
      </div>
    </div>
  );
}
