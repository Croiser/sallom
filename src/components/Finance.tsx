import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  TrendingUp, 
  TrendingDown, 
  Trash2, 
  X, 
  Filter, 
  ShoppingBag,
  Clock,
  CheckCircle2,
  Wallet,
  CalendarClock,
  HandCoins,
  History,
  Smartphone
} from 'lucide-react';
import { motion } from 'motion/react';
import { Transaction, Appointment, Product } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

export default function Finance() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaleModalOpen, setIsSaleModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [activeTab, setActiveTab] = useState<'flow' | 'receivable' | 'payable' | 'reports'>('flow');
  const [reportPeriod, setReportPeriod] = useState<'month' | 'year' | 'all'>('month');
  const [isMachineModalOpen, setIsMachineModalOpen] = useState(false);
  const [machines, setMachines] = useState<any[]>([]);
  const [newMachineName, setNewMachineName] = useState('');
  const [newMachineFee, setNewMachineFee] = useState('');
  
  // Form State
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [status, setStatus] = useState<'completed' | 'pending'>('completed');
  const [dueDate, setDueDate] = useState(new Date().toISOString().split('T')[0]);

  // Edit/Renegotiate State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [editAmount, setEditAmount] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  const fetchData = async () => {
    try {
      const [transData, appsData, productsData, machinesData] = await Promise.all([
        api.get('/transactions'),
        api.get('/appointments'),
        api.get('/products'),
        api.get('/payment-machines')
      ]);
      setTransactions(transData);
      setProducts(productsData);
      setMachines(machinesData || []);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      const todayApps = appsData.filter((app: any) => {
        const appDate = new Date(app.date);
        return appDate >= today && appDate < tomorrow && app.status === 'scheduled';
      });
      setTodayAppointments(todayApps);
    } catch (err) {
      console.error('Failed to fetch finance data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/transactions', {
        type,
        amount: parseFloat(amount),
        description,
        category,
        date: new Date(date).toISOString(),
        status,
        dueDate: status === 'pending' ? new Date(dueDate).toISOString() : null
      });

      setIsModalOpen(false);
      setAmount('');
      setDescription('');
      setCategory('');
      fetchData();
    } catch (err) {
      console.error('Failed to create transaction:', err);
    }
  };

  const handleQuickSale = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await api.post('/transactions', {
        type: 'income',
        amount: parseFloat(amount),
        description: `Venda Avulsa: ${description}`,
        category: 'Vendas',
        date: new Date().toISOString()
      });

      setIsSaleModalOpen(false);
      setAmount('');
      setDescription('');
      fetchData();
    } catch (err) {
      console.error('Failed to create quick sale:', err);
    }
  };

  const completeAppointment = async (app: Appointment) => {
    try {
      await api.put(`/appointments/${app.id}/status`, { status: 'completed' });
      fetchData();
    } catch (err) {
      console.error('Failed to complete appointment:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este registro?')) {
      try {
        await api.delete(`/transactions/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete transaction:', err);
      }
    }
  };

  const handleCreateMachine = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/payment-machines', { name: newMachineName, fee: newMachineFee });
      setNewMachineName('');
      setNewMachineFee('');
      fetchData();
    } catch (err) {
      console.error('Failed to create machine:', err);
    }
  };

  const handleDeleteMachine = async (id: string) => {
    if (confirm('Deseja realmente excluir esta maquininha?')) {
      try {
        await api.delete(`/payment-machines/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete machine:', err);
      }
    }
  };

  const handleMarkAsPaid = async (id: string) => {
    try {
      await api.put(`/transactions/${id}/status`, { status: 'completed' });
      fetchData();
    } catch (err) {
      console.error('Failed to mark as paid:', err);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTransaction) return;

    try {
      await api.put(`/transactions/${editingTransaction.id}`, {
        amount: parseFloat(editAmount),
        dueDate: new Date(editDueDate).toISOString(),
        description: editingTransaction.description // Keep original or allow edit too
      });

      setIsEditModalOpen(false);
      setEditingTransaction(null);
      fetchData();
    } catch (err) {
      console.error('Failed to update transaction:', err);
      alert('Erro ao atualizar transação.');
    }
  };

  const totals = {
    income: transactions.filter(t => t.type === 'income' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
    expense: transactions.filter(t => t.type === 'expense' && t.status === 'completed').reduce((acc, t) => acc + t.amount, 0),
    pendingIncome: transactions.filter(t => t.type === 'income' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0),
    pendingExpense: transactions.filter(t => t.type === 'expense' && t.status === 'pending').reduce((acc, t) => acc + t.amount, 0),
  };

  const filteredTransactions = transactions.filter(t => {
    if (activeTab === 'flow') {
      return t.status === 'completed' && (filterType === 'all' ? true : t.type === filterType);
    }
    if (activeTab === 'receivable') {
      return t.type === 'income' && t.status === 'pending';
    }
    if (activeTab === 'payable') {
      return t.type === 'expense' && t.status === 'pending';
    }
    return true;
  });

  return (
    <div className="space-y-8 pb-20">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-1">Saldo em Caixa</p>
          <h3 className={`text-xl font-black ${totals.income - totals.expense >= 0 ? 'text-zinc-950' : 'text-rose-600'}`}>
            R$ {(totals.income - totals.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <TrendingUp size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Entradas (Pagas)</p>
          </div>
          <h3 className="text-xl font-black text-zinc-950">
            R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <TrendingDown size={14} />
            <p className="text-[10px] font-black uppercase tracking-widest">Saídas (Pagas)</p>
          </div>
          <h3 className="text-xl font-black text-zinc-950">
            R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-zinc-950 p-5 rounded-3xl shadow-xl shadow-zinc-200">
          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Saldo Previsto</p>
          <h3 className="text-xl font-black text-white">
            R$ {(totals.income - totals.expense + totals.pendingIncome - totals.pendingExpense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-emerald-50 border border-emerald-100 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total a Receber</p>
            <h3 className="text-2xl font-black text-emerald-900">
              R$ {totals.pendingIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-emerald-500 text-white rounded-2xl">
            <HandCoins size={24} />
          </div>
        </div>
        <div className="bg-rose-50 border border-rose-100 p-5 rounded-3xl flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-1">Total a Pagar</p>
            <h3 className="text-2xl font-black text-rose-900">
              R$ {totals.pendingExpense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </h3>
          </div>
          <div className="p-3 bg-rose-500 text-white rounded-2xl">
            <CalendarClock size={24} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Finance Area */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Module Tabs */}
          <div className="flex items-center gap-2 p-1 bg-zinc-100 rounded-2xl border border-zinc-200">
            <button
              onClick={() => setActiveTab('flow')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'flow' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <Wallet size={18} />
              Fluxo de Caixa
            </button>
            <button
              onClick={() => setActiveTab('receivable')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'receivable' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <HandCoins size={18} />
              Contas a Receber
              {totals.pendingIncome > 0 && <span className="bg-emerald-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{transactions.filter(t => t.type === 'income' && t.status === 'pending').length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('payable')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'payable' ? 'bg-white text-rose-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <CalendarClock size={18} />
              Contas a Pagar
              {totals.pendingExpense > 0 && <span className="bg-rose-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{transactions.filter(t => t.type === 'expense' && t.status === 'pending').length}</span>}
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all ${activeTab === 'reports' ? 'bg-white text-brand-600 shadow-sm' : 'text-zinc-500 hover:text-zinc-700'}`}
            >
              <History size={18} />
              Relatórios
            </button>
            <button
              onClick={() => setIsMachineModalOpen(true)}
              className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl text-sm font-bold text-zinc-500 hover:text-zinc-700 hover:bg-zinc-200 transition-all"
            >
              <Smartphone size={18} />
              Maquininhas
            </button>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            {activeTab === 'flow' ? (
              <div className="flex items-center gap-2 bg-white p-1 rounded-xl border border-zinc-200">
                <button
                  onClick={() => setFilterType('all')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'all' ? 'bg-zinc-900 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Todos
                </button>
                <button
                  onClick={() => setFilterType('income')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'income' ? 'bg-emerald-500 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Entradas
                </button>
                <button
                  onClick={() => setFilterType('expense')}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterType === 'expense' ? 'bg-rose-500 text-white' : 'text-zinc-500 hover:bg-zinc-50'}`}
                >
                  Saídas
                </button>
              </div>
            ) : (
              <div />
            )}
            <div className="flex gap-2">
              {activeTab === 'flow' && (
                <button
                  onClick={() => setIsSaleModalOpen(true)}
                  className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <ShoppingBag size={20} />
                  Venda Avulsa
                </button>
              )}
              <button
                onClick={() => {
                  setType(activeTab === 'payable' ? 'expense' : 'income');
                  setIsModalOpen(true);
                }}
                className={`${activeTab === 'payable' ? 'bg-rose-500 hover:bg-rose-400' : 'bg-emerald-500 hover:bg-emerald-400'} text-white font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg`}
              >
                <Plus size={20} />
                {activeTab === 'payable' ? 'Nova Conta a Pagar' : activeTab === 'receivable' ? 'Nova Conta a Receber' : 'Novo Registro'}
              </button>
            </div>
          </div>

          {activeTab === 'reports' ? (
            <div className="space-y-6">
              <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-zinc-900">O que você está gastando?</h3>
                  <select 
                    value={reportPeriod}
                    onChange={(e) => setReportPeriod(e.target.value as any)}
                    className="bg-zinc-100 border-none rounded-xl px-4 py-2 text-sm font-bold text-zinc-600 outline-none"
                  >
                    <option value="month">Este Mês</option>
                    <option value="year">Este Ano</option>
                    <option value="all">Tudo</option>
                  </select>
                </div>

                <div className="space-y-6">
                  {Object.entries(
                    transactions
                      .filter(t => t.type === 'expense' && t.status === 'completed')
                      .reduce((acc, t) => {
                        acc[t.category] = (acc[t.category] || 0) + t.amount;
                        return acc;
                      }, {} as Record<string, number>)
                  )
                  .sort((a, b) => b[1] - a[1])
                  .map(([cat, val]) => (
                    <div key={cat} className="space-y-2">
                      <div className="flex justify-between items-end">
                        <div>
                          <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">{cat}</p>
                          <p className="text-lg font-black text-zinc-900">R$ {val.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                        </div>
                        <p className="text-xs font-bold text-rose-500">
                          {((val / totals.expense) * 100).toFixed(1)}% do total
                        </p>
                      </div>
                      <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${(val / totals.expense) * 100}%` }}
                          className="h-full bg-rose-500"
                        />
                      </div>
                    </div>
                  ))}

                  {totals.expense === 0 && (
                    <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-dashed border-zinc-200">
                      <TrendingDown size={40} className="mx-auto text-zinc-300 mb-2" />
                      <p className="text-zinc-500 font-medium">Nenhum gasto registrado no período.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-zinc-900 p-6 rounded-3xl text-white shadow-xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-rose-500 rounded-xl">
                    <TrendingDown size={24} />
                  </div>
                  <div>
                    <h4 className="font-black uppercase text-xs text-zinc-400 tracking-widest">Total Gasto</h4>
                    <p className="text-2xl font-black">R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</p>
                  </div>
                </div>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Este valor representa todas as saídas confirmadas (completadas) no período selecionado. 
                  Lembre-se de conferir suas <strong>Contas a Pagar</strong> para ver compromissos futuros.
                </p>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-zinc-50 border-b border-zinc-100">
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">
                        {activeTab === 'flow' ? 'Data Pagto' : 'Data Venc.'}
                      </th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Descrição</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Valor</th>
                      <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    {filteredTransactions.length > 0 ? filteredTransactions.map((t) => (
                      <tr key={t.id} className="hover:bg-zinc-50 transition-colors">
                        <td className="px-6 py-4 text-zinc-600">
                          {activeTab === 'flow' 
                            ? new Date(t.paymentDate || t.date).toLocaleDateString('pt-BR')
                            : new Date(t.dueDate || t.date).toLocaleDateString('pt-BR')
                          }
                        </td>
                        <td className="px-6 py-4">
                          <p className="font-medium text-zinc-900">{t.description}</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {t.totalInstallments && (
                              <span className="text-[10px] bg-brand-50 text-brand-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                Parcela {t.installment}/{t.totalInstallments}
                              </span>
                            )}
                            {t.paymentMethod && (
                              <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-bold uppercase">
                                {t.paymentMethod === 'money' ? 'Dinheiro' : 
                                 t.paymentMethod === 'card' ? 'Cartão' : 
                                 t.paymentMethod === 'pix' ? 'PIX' : 'Crediário'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                            {t.category}
                          </span>
                        </td>
                        <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {t.status === 'pending' && (
                              <>
                                <button 
                                  onClick={() => handleMarkAsPaid(t.id)}
                                  className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                  title="Marcar como Pago"
                                >
                                  <CheckCircle2 size={18} />
                                  Confirmar
                                </button>
                                <button 
                                  onClick={() => {
                                    setEditingTransaction(t);
                                    setEditAmount(t.amount.toString());
                                    setEditDueDate(new Date(t.dueDate || t.date).toISOString().split('T')[0]);
                                    setIsEditModalOpen(true);
                                  }}
                                  className="p-2 text-brand-500 hover:bg-brand-50 rounded-lg transition-colors flex items-center gap-1 text-xs font-bold"
                                  title="Renegociar"
                                >
                                  <HandCoins size={18} />
                                  Renegociar
                                </button>
                              </>
                            )}
                            <button 
                              onClick={() => handleDelete(t.id)}
                              className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                          {activeTab === 'flow' ? 'Nenhum registro financeiro encontrado.' : 
                           activeTab === 'receivable' ? 'Nenhuma conta a receber pendente.' : 
                           'Nenhuma conta a pagar pendente.'}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Service Queue */}
        <div className="space-y-6">
          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
              <h3 className="font-bold text-zinc-900 flex items-center gap-2">
                <Clock size={18} className="text-rose-500" />
                Fila de Atendimento
              </h3>
              <span className="bg-rose-100 text-rose-700 text-[10px] font-bold px-2 py-1 rounded-full uppercase">
                Hoje
              </span>
            </div>
            <div className="p-4 space-y-4 max-h-[500px] overflow-y-auto">
              {todayAppointments.length > 0 ? todayAppointments.map(app => (
                <div key={app.id} className="p-4 border border-zinc-100 rounded-2xl bg-zinc-50/30 flex items-center justify-between group hover:border-rose-200 transition-all">
                  <div className="space-y-1">
                    <p className="font-bold text-zinc-900">{app.clientName}</p>
                    <p className="text-xs text-zinc-500">{app.serviceName} • {new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <button 
                    onClick={() => completeAppointment(app)}
                    className="p-2 bg-emerald-100 text-emerald-600 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-emerald-500 hover:text-white"
                    title="Finalizar e Receber"
                  >
                    <CheckCircle2 size={20} />
                  </button>
                </div>
              )) : (
                <p className="text-center py-10 text-zinc-400 text-sm italic">Nenhum atendimento pendente para hoje.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Standard Transaction Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Novo Registro</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="flex p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'income' ? 'bg-white text-emerald-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  Entrada
                </button>
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${type === 'expense' ? 'bg-white text-rose-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  Saída
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Descrição</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="Ex: Pagamento Aluguel"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Categoria</label>
                <input
                  type="text"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="Ex: Infraestrutura, Marketing, etc."
                />
              </div>

              <div className="flex p-1 bg-zinc-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => setStatus('completed')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${status === 'completed' ? 'bg-white text-zinc-900 shadow-sm' : 'text-zinc-500'}`}
                >
                  Pago/Recebido
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('pending')}
                  className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${status === 'pending' ? 'bg-white text-amber-600 shadow-sm' : 'text-zinc-500'}`}
                >
                  Pendente
                </button>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">{status === 'completed' ? 'Data do Pagamento' : 'Data de Vencimento'}</label>
                <input
                  type="date"
                  required
                  value={status === 'completed' ? date : dueDate}
                  onChange={(e) => status === 'completed' ? setDate(e.target.value) : setDueDate(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                />
              </div>

              <button
                type="submit"
                className={`w-full font-bold py-4 rounded-xl transition-all mt-4 ${type === 'income' ? 'bg-emerald-500 hover:bg-emerald-400 text-white' : 'bg-rose-500 hover:bg-rose-400 text-white'}`}
              >
                Salvar Registro
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Quick Sale Modal */}
      {isSaleModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Venda Avulsa</h3>
              <button onClick={() => setIsSaleModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleQuickSale} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Explorar Produtos Cadastrados</label>
                <select 
                  onChange={(e) => {
                    const prod = products.find(p => p.id === e.target.value);
                    if (prod) {
                      setSelectedProduct(prod);
                      setAmount(prod.price.toString());
                      setDescription(prod.name);
                    } else {
                      setSelectedProduct(null);
                    }
                  }}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">-- Selecione um produto (opcional) --</option>
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.name} - R$ {p.price.toLocaleString('pt-BR')}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Valor da Venda (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="0,00"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">O que foi vendido?</label>
                <input
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="Ex: Pomada Modeladora"
                />
              </div>


              <button
                type="submit"
                className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all mt-4"
              >
                Confirmar Venda
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Payment Machines Management Modal */}
      {isMachineModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Gerenciar Maquininhas</h3>
              <button onClick={() => setIsMachineModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <form onSubmit={handleCreateMachine} className="space-y-3">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Adicionar Nova</p>
                <div className="flex gap-2">
                  <input
                    type="text"
                    required
                    placeholder="Nome (ex: Mercado Pago)"
                    value={newMachineName}
                    onChange={(e) => setNewMachineName(e.target.value)}
                    className="flex-1 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="Taxa %"
                    value={newMachineFee}
                    onChange={(e) => setNewMachineFee(e.target.value)}
                    className="w-20 bg-zinc-50 border border-zinc-200 px-3 py-2 rounded-xl text-sm outline-none focus:ring-2 focus:ring-brand-500/20"
                  />
                  <button type="submit" className="bg-brand-500 text-white p-2 rounded-xl hover:bg-brand-400 transition-all">
                    <Plus size={20} />
                  </button>
                </div>
              </form>

              <div className="space-y-2">
                <p className="text-xs font-black text-zinc-400 uppercase tracking-widest">Suas Maquininhas</p>
                <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
                  {machines.length > 0 ? machines.map(m => (
                    <div key={m.id} className="flex items-center justify-between p-3 bg-zinc-50 rounded-2xl border border-zinc-100">
                      <div>
                        <p className="font-bold text-zinc-900">{m.name}</p>
                        <p className="text-xs text-zinc-500">Taxa: {m.fee}%</p>
                      </div>
                      <button 
                        onClick={() => handleDeleteMachine(m.id)}
                        className="p-2 text-zinc-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  )) : (
                    <p className="text-center py-4 text-zinc-400 text-sm italic">Nenhuma máquina cadastrada.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Renegotiate Modal */}
      {isEditModalOpen && editingTransaction && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-brand-50">
              <h3 className="text-xl font-bold text-brand-900 flex items-center gap-2">
                <HandCoins size={24} />
                Renegociar Título
              </h3>
              <button onClick={() => setIsEditModalOpen(false)} className="text-brand-400 hover:text-brand-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="bg-zinc-50 p-4 rounded-2xl border border-zinc-100 mb-4">
                <p className="text-[10px] font-black uppercase text-zinc-400 tracking-widest">Título Original</p>
                <p className="font-bold text-zinc-900">{editingTransaction.description}</p>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Novo Valor (R$)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Nova Data de Vencimento</label>
                <input
                  type="date"
                  required
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-4 bg-zinc-100 text-zinc-600 font-bold rounded-xl hover:bg-zinc-200 transition-all"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="flex-2 px-8 py-4 bg-brand-500 text-white font-bold rounded-xl hover:bg-brand-600 transition-all shadow-lg shadow-brand-500/20"
                >
                  Salvar Alterações
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
