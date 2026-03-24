import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Package, 
  AlertTriangle, 
  Edit2, 
  Trash2, 
  X,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Layers
} from 'lucide-react';
import { Product } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useSubscription } from '../hooks/useSubscription';
import { Crown, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface InventoryProps {
  onNavigate?: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

export default function Inventory({ onNavigate }: InventoryProps) {
  const { user } = useAuth();
  const { plan, loading: subLoading } = useSubscription();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    price: 0,
    cost: 0,
    stock: 0,
    category: ''
  });

  const fetchData = async () => {
    if (subLoading || !user) return;

    if (!plan?.features.inventory) {
      setLoading(false);
      return;
    }

    try {
      const data = await api.get('/products');
      setProducts(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to fetch products:', error);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [subLoading, plan?.features.inventory, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingProduct) {
        await api.put(`/products/${editingProduct.id}`, formData);
      } else {
        await api.post('/products', formData);
      }
      setIsModalOpen(false);
      setEditingProduct(null);
      setFormData({ name: '', price: 0, cost: 0, stock: 0, category: '' });
      fetchData();
    } catch (error) {
      console.error('Error saving product:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      try {
        await api.delete(`/products/${id}`);
        fetchData();
      } catch (error) {
        console.error('Error deleting product:', error);
      }
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const stats = {
    totalValue: products.reduce((acc, p) => acc + (p.price * p.stock), 0),
    totalCost: products.reduce((acc, p) => acc + (p.cost * p.stock), 0),
    lowStock: products.filter(p => p.stock < 5).length,
    totalItems: products.reduce((acc, p) => acc + p.stock, 0)
  };

  if (subLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!plan?.features.inventory) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-zinc-100 rounded-full flex items-center justify-center mb-6">
          <Lock size={40} className="text-zinc-600" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Módulo de Estoque</h2>
        <p className="text-zinc-500 max-w-md mb-8">
          A gestão de produtos e controle de estoque está disponível apenas nos planos **Silver** e **Gold**. 
          Faça o upgrade agora para ter controle total sobre seus produtos.
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
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-zinc-900">Estoque</h2>
          <p className="text-zinc-500">Gerencie seus produtos e suprimentos</p>
        </div>
        <button
          onClick={() => {
            setEditingProduct(null);
            setFormData({ name: '', price: 0, cost: 0, stock: 0, category: '' });
            setIsModalOpen(true);
          }}
          className="flex items-center justify-center gap-2 bg-zinc-900 text-white px-6 py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
        >
          <Plus size={20} />
          Novo Produto
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 text-emerald-600 mb-2">
            <TrendingUp size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Valor de Venda</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">R$ {stats.totalValue.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 text-rose-600 mb-2">
            <TrendingDown size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Custo Total</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">R$ {stats.totalCost.toLocaleString('pt-BR')}</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 text-rose-600 mb-2">
            <AlertTriangle size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Estoque Baixo</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.lowStock} itens</p>
        </div>
        <div className="bg-white p-5 rounded-3xl border border-zinc-200 shadow-sm">
          <div className="flex items-center gap-3 text-blue-600 mb-2">
            <Layers size={20} />
            <span className="text-xs font-bold uppercase tracking-wider">Total em Unidades</span>
          </div>
          <p className="text-2xl font-bold text-zinc-900">{stats.totalItems}</p>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-zinc-100">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={20} />
            <input
              type="text"
              placeholder="Buscar produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/50">
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Produto</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Categoria</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Estoque</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Preço</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Custo</th>
                <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {filteredProducts.length > 0 ? filteredProducts.map((product) => (
                <tr key={product.id} className="hover:bg-zinc-50/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-600">
                        <Package size={20} />
                      </div>
                      <span className="font-semibold text-zinc-900">{product.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-3 py-1 bg-zinc-100 text-zinc-600 text-xs font-bold rounded-full uppercase tracking-wider">
                      {product.category || 'Geral'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2">
                      <span className={`font-bold ${product.stock < 5 ? 'text-rose-600' : 'text-zinc-900'}`}>
                        {product.stock}
                      </span>
                      {product.stock < 5 && (
                        <span className="flex items-center gap-1 text-[10px] font-bold uppercase bg-rose-100 text-rose-600 px-2 py-0.5 rounded-full animate-pulse">
                          <AlertTriangle size={10} />
                          Baixo
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-zinc-900">R$ {product.price.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-zinc-500">R$ {product.cost.toLocaleString('pt-BR')}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          setEditingProduct(product);
                          setFormData({
                            name: product.name,
                            price: product.price,
                            cost: product.cost,
                            stock: product.stock,
                            category: product.category || ''
                          });
                          setIsModalOpen(true);
                        }}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center space-y-4">
                    <div className="w-16 h-16 bg-zinc-50 text-zinc-400 rounded-2xl flex items-center justify-center mx-auto">
                      <Package size={32} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-zinc-900">Nenhum produto</h3>
                      <p className="text-zinc-500 max-w-xs mx-auto text-sm">
                        Sua lista de produtos está vazia. Comece cadastrando seu primeiro produto.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setEditingProduct(null);
                        setFormData({ name: '', price: 0, cost: 0, stock: 0, category: '' });
                        setIsModalOpen(true);
                      }}
                      className="bg-zinc-900 text-white px-8 py-3 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                    >
                      Cadastrar Primeiro Produto
                    </button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-zinc-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
                <h3 className="text-xl font-bold text-zinc-900">
                  {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-2 hover:bg-zinc-200 rounded-full transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-bold text-zinc-700 mb-1">Nome do Produto</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    placeholder="Ex: Pomada Modeladora"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Preço de Venda</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Custo</label>
                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                      <input
                        type="number"
                        step="0.01"
                        required
                        value={formData.cost}
                        onChange={(e) => setFormData({ ...formData, cost: parseFloat(e.target.value) })}
                        className="w-full pl-10 pr-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                      />
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Estoque Inicial</label>
                    <input
                      type="number"
                      required
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) })}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-zinc-700 mb-1">Categoria</label>
                    <input
                      type="text"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 bg-zinc-50 border border-zinc-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 transition-all"
                      placeholder="Ex: Cabelo, Estética"
                    />
                  </div>
                </div>

                <div className="pt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 px-6 py-3 border border-zinc-200 text-zinc-600 font-bold rounded-2xl hover:bg-zinc-50 transition-all"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-6 py-3 bg-zinc-900 text-white font-bold rounded-2xl hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
                  >
                    {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
