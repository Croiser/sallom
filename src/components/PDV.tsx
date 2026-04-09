import React, { useState, useEffect } from 'react';
import { 
  Search, 
  ShoppingCart, 
  User as UserIcon, 
  UserPlus, 
  Trash2, 
  Plus, 
  Minus, 
  CheckCircle2, 
  Package, 
  Sparkles,
  CreditCard,
  DollarSign,
  Smartphone,
  ArrowRight,
  ChevronRight,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Product, Service, Client, Staff } from '../types';

interface CartItem {
  id: string; // productId or serviceId
  name: string;
  price: number;
  quantity: number;
  type: 'product' | 'service';
  productId?: string;
  serviceId?: string;
}

export default function PDV() {
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix'>('pix');
  const [includeDebt, setIncludeDebt] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const fetchData = async () => {
    try {
      const [prodData, servData, cliData, staffData] = await Promise.all([
        api.get('/products'),
        api.get('/services'),
        api.get('/clients'),
        api.get('/staff')
      ]);
      setProducts(prodData || []);
      setServices(servData || []);
      setClients(cliData || []);
      setStaff(staffData || []);
    } catch (err) {
      console.error('Failed to fetch PDV data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const addToCart = (item: Product | Service, type: 'product' | 'service') => {
    setCart(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + 1 } : i);
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        price: item.price,
        quantity: 1,
        type,
        productId: type === 'product' ? item.id : undefined,
        serviceId: type === 'service' ? item.id : undefined
      }];
    });
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(1, item.quantity + delta);
        return { ...item, quantity: newQty };
      }
      return item;
    }));
  };

  const totalItems = cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const clientDebt = clients.find(c => c.id === selectedClient)?.pendingDebt || 0;
  const total = totalItems + (includeDebt ? clientDebt : 0);

  const handleFinishSale = async () => {
    if (cart.length === 0) return;
    setProcessing(true);
    try {
      await api.createSale({
        clientId: selectedClient || null,
        staffId: selectedStaff || null,
        paymentMethod,
        includeDebt, // Backend will need to handle this to clear client debt
        items: cart.map(item => ({
          productId: item.productId,
          serviceId: item.serviceId,
          quantity: item.quantity,
          unitPrice: item.price
        }))
      });
      setSuccess(true);
      setCart([]);
      setSelectedClient('');
      setSelectedStaff('');
      setIncludeDebt(false);
      // Refresh products to show updated stock
      fetchData();
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Sale failed:', err);
      alert('Erro ao processar venda: ' + (err as any).message);
    } finally {
      setProcessing(false);
    }
  };

  const filteredItems = [
    ...products.map(p => ({ ...p, type: 'product' as const })),
    ...services.map(s => ({ ...s, type: 'service' as const }))
  ].filter(item => 
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (item as any).category?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500"></div></div>;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-140px)]">
      {/* Left Column: Product/Service Search & Selection */}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="mb-4 relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 group-focus-within:text-brand-500 transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar produtos ou serviços..."
            className="input-premium pl-10 h-11 text-base"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
            {filteredItems.map(item => (
              <motion.button
                key={item.id}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => addToCart(item as any, item.type)}
                className="bg-white p-3 rounded-2xl border border-zinc-200 shadow-sm hover:shadow-premium hover:border-brand-500/50 transition-all text-left flex flex-col h-full group"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className={`p-1.5 rounded-xl ${item.type === 'product' ? 'bg-amber-50 text-amber-600' : 'bg-brand-50 text-brand-500'}`}>
                    {item.type === 'product' ? <Package size={16} /> : <Sparkles size={16} />}
                  </div>
                  <span className="text-base font-display font-black text-brand-500">
                    R$ {item.price.toFixed(2)}
                  </span>
                </div>
                <h4 className="font-bold text-zinc-900 leading-tight mb-1 text-sm group-hover:text-brand-500 transition-colors">{item.name}</h4>
                {item.type === 'product' && (
                  <div className="mt-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    <span className={ (item as Product).stock <= 5 ? 'text-rose-500' : '' }>
                      Estoque: {(item as Product).stock}
                    </span>
                  </div>
                )}
                {item.type === 'service' && (
                  <div className="mt-auto flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-zinc-400">
                    {(item as Service).duration} min
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      </div>

      {/* Right Column: Checkout Sidebar */}
      <div className="w-full lg:w-[350px] flex flex-col bg-white rounded-3xl border border-zinc-200 shadow-premium overflow-hidden sticky top-0 mt-4 lg:mt-0">
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between">
          <h3 className="text-lg font-display font-black flex items-center gap-2 text-zinc-900">
            <ShoppingCart className="text-brand-500" size={20} />
            Carrinho
          </h3>
          <span className="bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{cart.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar min-h-[200px]">
          <AnimatePresence initial={false}>
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-400 py-12">
                <ShoppingCart size={48} className="mb-4 opacity-20" />
                <p className="font-medium">O carrinho está vazio</p>
                <p className="text-xs">Clique nos itens à esquerda para adicionar</p>
              </div>
            ) : (
              cart.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-50 p-3 rounded-xl border border-zinc-100 group"
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-bold text-xs text-zinc-900 truncate">{item.name}</p>
                      <p className="text-[10px] text-brand-500 font-bold">R$ {item.price.toFixed(2)}</p>
                    </div>
                    <button 
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-300 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white rounded-lg border border-zinc-200 p-0.5">
                      <button 
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-zinc-50 rounded-md text-zinc-500 transition-colors"
                      >
                        <Minus size={12} />
                      </button>
                      <span className="px-2 text-xs font-black text-zinc-900 min-w-[24px] text-center">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-zinc-50 rounded-md text-zinc-500 transition-colors"
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <span className="font-black text-zinc-900 text-xs">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))
            )}
          </AnimatePresence>
        </div>

        <div className="p-4 bg-zinc-50/80 border-t border-zinc-100 space-y-4">
          <div className="grid grid-cols-1 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 underline uppercase tracking-widest ml-1">Cliente (Opcional)</label>
              <select
                value={selectedClient}
                onChange={e => setSelectedClient(e.target.value)}
                className="input-premium py-2 text-xs"
              >
                <option value="">Consumidor Final</option>
                {clients.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.pendingDebt > 0 ? `(Débito: R$ ${c.pendingDebt.toFixed(2)})` : ''}
                  </option>
                ))}
              </select>
            </div>

            <AnimatePresence>
              {selectedClient && (clients.find(c => c.id === selectedClient)?.pendingDebt || 0) > 0 && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="overflow-hidden"
                >
                  <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-rose-500 text-white rounded-lg">
                        <DollarSign size={14} />
                      </div>
                      <div>
                        <p className="text-[9px] font-black uppercase text-rose-500 tracking-wider">Débito Pendente</p>
                        <p className="text-xs font-bold text-rose-900">R$ {(clients.find(c => c.id === selectedClient)?.pendingDebt || 0).toFixed(2)}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setIncludeDebt(!includeDebt)}
                      className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${
                        includeDebt 
                        ? 'bg-rose-500 text-white' 
                        : 'bg-white text-rose-500 border border-rose-200'
                      }`}
                    >
                      {includeDebt ? 'Incluido' : 'Incluir'}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-2">
              <label className="text-[10px] font-black text-zinc-400 underline uppercase tracking-widest ml-1">Vendedor/Atendente</label>
              <select
                value={selectedStaff}
                onChange={e => setSelectedStaff(e.target.value)}
                className="input-premium py-2 text-xs font-bold text-brand-600"
              >
                <option value="">Selecione o Profissional</option>
                {staff.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            {[
              { id: 'pix', icon: Smartphone, label: 'PIX' },
              { id: 'money', icon: DollarSign, label: 'Dinheiro' },
              { id: 'card', icon: CreditCard, label: 'Cartão' },
            ].map(method => (
              <button
                key={method.id}
                onClick={() => setPaymentMethod(method.id as any)}
                className={`flex-1 flex flex-col items-center gap-1.5 p-3 rounded-2xl border transition-all ${
                  paymentMethod === method.id 
                  ? 'border-brand-500 bg-brand-500 text-white shadow-lg shadow-brand-500/20' 
                  : 'bg-white border-zinc-200 text-zinc-500 hover:border-zinc-300'
                }`}
              >
                <method.icon size={14} />
                <span className="text-[9px] font-black uppercase text-center leading-none">{method.label}</span>
              </button>
            ))}
          </div>

          <div className="pt-2">
            <div className="flex justify-between items-baseline mb-4">
              <span className="text-zinc-500 font-bold text-sm">Total da Venda</span>
              <div className="text-right">
                <p className="text-2xl font-display font-black text-zinc-900 tracking-tighter">
                  <span className="text-xs text-brand-500 mr-1 uppercase font-sans">R$</span>
                  {total.toFixed(2)}
                </p>
              </div>
            </div>

            <button
              disabled={cart.length === 0 || processing}
              onClick={handleFinishSale}
              className={`
                w-full h-12 rounded-2xl font-display font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 transition-all
                ${success 
                  ? 'bg-emerald-500 text-white' 
                  : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 active:scale-[0.98] shadow-premium'}
              `}
            >
              {processing ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
              ) : success ? (
                <>
                  <CheckCircle2 size={18} />
                  Venda Realizada!
                </>
              ) : (
                <>
                  Finalizar Venda
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
