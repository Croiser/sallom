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
  CheckCircle2
} from 'lucide-react';
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
  
  // Form State
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);

  const fetchData = async () => {
    try {
      const [transData, appsData, productsData] = await Promise.all([
        api.get('/transactions'),
        api.get('/appointments'),
        api.get('/products')
      ]);
      setTransactions(transData);
      setProducts(productsData);

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
        date: new Date(date).toISOString()
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

  const totals = {
    income: transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0),
    expense: transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0),
  };

  const filteredTransactions = transactions.filter(t => 
    filterType === 'all' ? true : t.type === filterType
  );

  return (
    <div className="space-y-8 pb-20">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <p className="text-sm text-zinc-500 mb-1">Saldo Total</p>
          <h3 className={`text-2xl font-bold ${totals.income - totals.expense >= 0 ? 'text-zinc-900' : 'text-rose-600'}`}>
            R$ {(totals.income - totals.expense).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 text-emerald-600 mb-1">
            <TrendingUp size={16} />
            <p className="text-sm font-medium">Entradas</p>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900">
            R$ {totals.income.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
        <div className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-2 text-rose-600 mb-1">
            <TrendingDown size={16} />
            <p className="text-sm font-medium">Saídas</p>
          </div>
          <h3 className="text-2xl font-bold text-zinc-900">
            R$ {totals.expense.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </h3>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Finance Area */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
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
            <div className="flex gap-2">
              <button
                onClick={() => setIsSaleModalOpen(true)}
                className="bg-zinc-100 hover:bg-zinc-200 text-zinc-900 font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all"
              >
                <ShoppingBag size={20} />
                Venda Avulsa
              </button>
              <button
                onClick={() => setIsModalOpen(true)}
                className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-4 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20"
              >
                <Plus size={20} />
                Novo Registro
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-zinc-50 border-b border-zinc-100">
                    <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Data</th>
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
                        {new Date(t.date).toLocaleDateString('pt-BR')}
                      </td>
                      <td className="px-6 py-4 font-medium text-zinc-900">{t.description}</td>
                      <td className="px-6 py-4">
                        <span className="text-xs bg-zinc-100 text-zinc-600 px-2 py-1 rounded-md">
                          {t.category}
                        </span>
                      </td>
                      <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-emerald-600' : 'text-rose-600'}`}>
                        {t.type === 'income' ? '+' : '-'} R$ {t.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => handleDelete(t.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-zinc-500">
                        Nenhum registro financeiro encontrado.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
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

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Data</label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
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
    </div>
  );
}
