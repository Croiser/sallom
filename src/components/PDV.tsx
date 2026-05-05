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
  HandCoins,
  CreditCard,
  DollarSign,
  Smartphone,
  ArrowRight,
  ChevronRight,
  Info,
  Calendar,
  Clock
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Product, Service, Client, Staff, Appointment, PaymentMachine } from '../types';

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
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>('');
  const [selectedStaff, setSelectedStaff] = useState<string>('');
  const [activeAppointmentId, setActiveAppointmentId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'money' | 'card' | 'pix' | 'crediario'>('money');
  const [paymentMethodServices, setPaymentMethodServices] = useState<'money' | 'card' | 'pix'>('money');
  const [installments, setInstallments] = useState<number>(1);
  const [cardFeePercentage, setCardFeePercentage] = useState<number>(0);
  const [includeDebt, setIncludeDebt] = useState(false);
  const [productsOnAccount, setProductsOnAccount] = useState(false);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const [machines, setMachines] = useState<PaymentMachine[]>([]);
  const [selectedMachineId, setSelectedMachineId] = useState<string>('');
  const [upsellSuggestions, setUpsellSuggestions] = useState<Product[]>([]);
  
  // New payment fields
  const [entryAmount, setEntryAmount] = useState<number>(0);
  const [nextPaymentDate, setNextPaymentDate] = useState<string>(new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0]);
  const [entryPaymentMethod, setEntryPaymentMethod] = useState<'money' | 'pix'>('money');

  const fetchData = async () => {
    try {
      const [prodData, servData, cliData, staffData, appData, machineData] = await Promise.all([
        api.get('/products'),
        api.get('/services'),
        api.get('/clients'),
        api.get('/staff'),
        api.get('/appointments'),
        api.get('/payment-machines')
      ]);
      setProducts(prodData || []);
      setServices(servData || []);
      setClients(cliData || []);
      setStaff(staffData || []);
      setMachines(machineData || []);

      // Filter appointments: Today + Yesterday, status: scheduled or in_progress
      const now = new Date();
      const yesterday = new Date(now);
      yesterday.setDate(now.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);

      const filteredApps = (appData || []).filter((app: Appointment) => {
        const appDate = new Date(app.date);
        const isRecent = appDate >= yesterday;
        const isPending = ['scheduled', 'confirmed', 'in_progress'].includes(app.status);
        return isRecent && isPending;
      });
      setAppointments(filteredApps);
    } catch (err) {
      console.error('Failed to fetch PDV data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const fetchUpsell = async () => {
      if (!selectedClient) {
        setUpsellSuggestions([]);
        return;
      }
      try {
        const data = await api.get(`/intelligence/upsell/${selectedClient}`);
        setUpsellSuggestions(data || []);
      } catch (err) {
        console.error('Failed to fetch upsell suggestions:', err);
      }
    };
    fetchUpsell();
  }, [selectedClient]);

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

  const loadAppointment = (app: Appointment) => {
    // Clear current cart and add appointment service
    const service = services.find(s => s.id === app.serviceId);
    if (!service) {
      alert('Serviço do agendamento não encontrado em sua lista de serviços ativos.');
      return;
    }

    setCart([{
      id: service.id,
      name: service.name,
      price: app.price || service.price,
      quantity: 1,
      type: 'service',
      serviceId: service.id
    }]);

    setSelectedClient(app.clientId || '');
    setSelectedStaff(app.staffId || app.barberId || '');
    setActiveAppointmentId(app.id);
  };

  const removeFromCart = (id: string) => {
    setCart(prev => {
      const updated = prev.filter(item => item.id !== id);
      // If we remove the appointment service, clear the vinculation
      if (activeAppointmentId && updated.length === 0) {
        setActiveAppointmentId(null);
      }
      return updated;
    });
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

  const subtotalServices = cart.filter(i => i.type === 'service').reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const subtotalProducts = cart.filter(i => i.type === 'product').reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const clientDebt = clients.find(c => c.id === selectedClient)?.pendingDebt || 0;

  const totalImmediate = subtotalServices + (productsOnAccount ? 0 : subtotalProducts) + (includeDebt ? clientDebt : 0);
  const totalOnAccount = productsOnAccount ? subtotalProducts : 0;
  const totalGlobal = subtotalServices + subtotalProducts + (includeDebt ? clientDebt : 0);

  const handleFinishSale = async () => {
    if (cart.length === 0) return;

    if ((productsOnAccount || paymentMethod === 'crediario') && !selectedClient) {
      alert('Para lançar produtos na conta ou usar crediário, selecione um cliente primeiro.');
      return;
    }

    setProcessing(true);
    try {
      await api.post('/sales', {
        clientId: selectedClient || null,
        staffId: selectedStaff || null,
        paymentMethod: 'hybrid',
        paymentMethodServices: paymentMethodServices,
        paymentMethodProducts: productsOnAccount ? 'on_account' : paymentMethod,
        includeDebt,
        appointmentId: activeAppointmentId,
        installments: (paymentMethod === 'card' || paymentMethod === 'crediario') ? installments : 1,
        cardFeePercentage: (paymentMethod === 'card' || paymentMethodServices === 'card') ? cardFeePercentage : 0,
        entryAmount: (paymentMethod === 'card' || paymentMethod === 'crediario') ? entryAmount : 0,
        entryPaymentMethod,
        nextPaymentDate,
        items: cart.map(item => ({
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          quantity: item.quantity,
          unitPrice: item.price
        }))
      });
      setSuccess(true);
      setCart([]);
      setSelectedClient('');
      setSelectedStaff('');
      setIncludeDebt(false);
      setProductsOnAccount(false);
      setActiveAppointmentId(null);
      // Refresh data
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

        {/* Pending Appointments Bar */}
        {appointments.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3 px-1">
              <div className="p-1 bg-brand-50 rounded-lg text-brand-500">
                <Calendar size={16} className="text-brand-500" />
              </div>
              <h3 className="text-sm font-display font-black text-zinc-900 uppercase tracking-tight">Atendimentos Pendentes</h3>
              <span className="bg-brand-50 text-brand-500 text-[10px] font-black px-2 py-0.5 rounded-full border border-brand-100">{appointments.length}</span>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar">
              {appointments.map(app => (
                <motion.button
                  key={app.id}
                  whileHover={{ scale: 1.02, y: -2 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => loadAppointment(app)}
                  className={`
                    flex-shrink-0 w-64 bg-white p-3 rounded-2xl border transition-all text-left group
                    ${activeAppointmentId === app.id ? 'border-brand-500 ring-2 ring-brand-500/10 shadow-lg' : 'border-zinc-200 hover:border-brand-300 shadow-sm'}
                  `}
                >
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${activeAppointmentId === app.id ? 'bg-brand-500 text-white' : 'bg-zinc-100 text-zinc-500'}`}>
                        {app.clientName.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-xs text-zinc-900 truncate max-w-[120px]">{app.clientName}</p>
                        <div className="flex items-center gap-1 text-[9px] text-zinc-500 font-medium">
                          <Clock size={10} />
                          {new Date(app.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div className={`px-2 py-0.5 rounded-full text-[8px] font-black uppercase ${app.status === 'in_progress' ? 'bg-amber-100 text-amber-700' : 'bg-zinc-100 text-zinc-500'}`}>
                      {app.status === 'in_progress' ? 'Em curso' : 'Agendado'}
                    </div>
                  </div>
                  <div className="border-t border-zinc-50 pt-2 flex items-center justify-between">
                    <span className="text-[10px] font-black text-brand-500 truncate max-w-[140px]">{app.serviceName}</span>
                    <span className="text-xs font-black text-zinc-900">R$ {app.price.toFixed(2)}</span>
                  </div>
                </motion.button>
              ))}
            </div>
          </div>
        )}

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
                    <span className={(item as Product).stock <= 5 ? 'text-rose-500' : ''}>
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
      <div className="w-full lg:w-[360px] flex flex-col bg-white rounded-3xl border border-zinc-200 shadow-premium overflow-hidden h-full">
        {/* Header (Fixed) */}
        <div className="p-4 border-b border-zinc-100 bg-zinc-50/50 flex items-center justify-between shrink-0">
          <h3 className="text-base font-display font-black flex items-center gap-2 text-zinc-900">
            <ShoppingCart className="text-brand-500" size={18} />
            Carrinho
          </h3>
          <span className="bg-brand-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full">{cart.length}</span>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
          {/* Cart Items List */}
          <div className="space-y-3">
            <AnimatePresence initial={false}>
              {cart.map(item => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 group"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div className="min-w-0 flex-1 pr-3">
                      <p className="font-bold text-[11px] text-zinc-900 truncate">{item.name}</p>
                      <div className="flex items-center gap-2">
                        <p className="text-[9px] text-brand-500 font-bold">R$ {item.price.toFixed(2)}</p>
                        <span className={`text-[8px] font-black uppercase px-1.5 py-0.5 rounded ${item.type === 'product' ? 'bg-amber-100 text-amber-700' : 'bg-brand-100 text-brand-700'}`}>
                          {item.type === 'product' ? 'Produto' : 'Serviço'}
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-zinc-300 hover:text-rose-500 transition-colors p-1"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center bg-white rounded-lg border border-zinc-200 p-0.5">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="p-1 hover:bg-zinc-50 rounded-md text-zinc-500 transition-colors"
                      >
                        <Minus size={10} />
                      </button>
                      <span className="px-2 text-[10px] font-black text-zinc-900 min-w-[20px] text-center">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="p-1 hover:bg-zinc-50 rounded-md text-zinc-500 transition-colors"
                      >
                        <Plus size={10} />
                      </button>
                    </div>
                    <span className="font-black text-zinc-900 text-[11px]">
                      R$ {(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {cart.length === 0 && (
              <div className="flex flex-col items-center justify-center text-zinc-400 py-10">
                <ShoppingCart size={32} className="mb-2 opacity-20" />
                <p className="text-xs font-medium text-center">O carrinho está vazio.<br />Selecione itens à esquerda.</p>
              </div>
            )}
          </div>

          {/* Checkout Logic & Payment */}
          <div className="space-y-6 pt-4 border-t border-zinc-100">
            <AnimatePresence>
              {upsellSuggestions.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="bg-brand-50 border border-brand-100 rounded-2xl p-4 shadow-sm"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <div className="p-1.5 bg-brand-500 text-white rounded-lg shadow-brand-500/20 shadow-lg">
                      <Sparkles size={14} />
                    </div>
                    <span className="text-[10px] font-black text-brand-600 uppercase tracking-wider">Oportunidade de Upsell</span>
                  </div>
                  <div className="space-y-2">
                    {upsellSuggestions.map((suggestion: any) => (
                      <div key={suggestion.id} className="flex items-center justify-between bg-white/50 p-2 rounded-xl border border-brand-100/50">
                        <div className="flex flex-col">
                          <span className="text-xs font-bold text-zinc-900">{suggestion.name}</span>
                          <span className="text-[9px] text-brand-500 font-bold">R$ {suggestion.price.toFixed(2)}</span>
                        </div>
                        <button
                          onClick={() => addToCart(suggestion, 'product')}
                          className="p-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600 transition-colors shadow-sm"
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-zinc-400 underline uppercase tracking-widest ml-1">Cliente</label>
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

              {cart.some(i => i.type === 'product') && (
                <div className="bg-white border border-zinc-200 rounded-2xl p-3 shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-amber-500 text-white rounded-lg">
                        <Package size={14} />
                      </div>
                      <span className="text-[10px] font-black text-zinc-900 uppercase">Produtos (R$ {subtotalProducts.toFixed(2)})</span>
                    </div>
                    <button
                      onClick={() => setProductsOnAccount(!productsOnAccount)}
                      className={`relative w-10 h-5 rounded-full transition-colors ${productsOnAccount ? 'bg-amber-500' : 'bg-zinc-200'}`}
                    >
                      <motion.div animate={{ x: productsOnAccount ? 22 : 2 }} className="absolute top-1 left-0 w-3 h-3 bg-white rounded-full shadow-sm" />
                    </button>
                  </div>
                  <p className="text-[9px] text-zinc-400 font-medium leading-tight">
                    {productsOnAccount
                      ? 'Produtos serão adicionados ao débito do cliente.'
                      : 'Os produtos serão pagos agora junto com os serviços.'}
                  </p>
                </div>
              )}

              <AnimatePresence>
                {selectedClient && (clients.find(c => c.id === selectedClient)?.pendingDebt || 0) > 0 && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
                    <div className="bg-rose-50 border border-rose-100 rounded-xl p-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="p-1.5 bg-rose-500 text-white rounded-lg"><DollarSign size={14} /></div>
                        <div>
                          <p className="text-[9px] font-black uppercase text-rose-500">Dívida Pendente</p>
                          <p className="text-xs font-bold text-rose-900">R$ {(clients.find(c => c.id === selectedClient)?.pendingDebt || 0).toFixed(2)}</p>
                        </div>
                      </div>
                      <button onClick={() => setIncludeDebt(!includeDebt)} className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase transition-all ${includeDebt ? 'bg-rose-500 text-white' : 'bg-white text-rose-500 border border-rose-200'}`}>
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

            {/* Payment Sections */}
            <div className="space-y-6">
              {(subtotalServices > 0 || includeDebt) && (
                <div className="space-y-3">
                  <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest px-1 flex justify-between">
                    <span>Serviços + Dívida</span>
                    <span>R$ {(subtotalServices + (includeDebt ? clientDebt : 0)).toFixed(2)}</span>
                  </p>
                  <div className="flex gap-2">
                    {[
                      { id: 'pix', icon: Smartphone, label: 'PIX' },
                      { id: 'money', icon: DollarSign, label: 'Dinheiro' },
                      { id: 'card', icon: CreditCard, label: 'Cartão 1x' },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethodServices(method.id as any)}
                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${paymentMethodServices === method.id ? 'border-brand-500 bg-brand-500 text-white shadow-lg' : 'bg-white border-zinc-200 text-zinc-500'}`}
                      >
                        <method.icon size={12} />
                        <span className="text-[8px] font-black uppercase tracking-tight">{method.label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {!productsOnAccount && subtotalProducts > 0 && (
                <div className="space-y-3 pt-4 border-t border-zinc-100">
                  <p className="text-[10px] font-black text-brand-600 uppercase tracking-widest px-1 flex justify-between">
                    <span>Produtos</span>
                    <span>R$ {subtotalProducts.toFixed(2)}</span>
                  </p>
                  <div className="flex gap-2">
                    {[
                      { id: 'pix', icon: Smartphone, label: 'PIX' },
                      { id: 'money', icon: DollarSign, label: 'Dinheiro' },
                      { id: 'card', icon: CreditCard, label: 'Cartão' },
                      { id: 'crediario', icon: HandCoins, label: 'Crediário' },
                    ].map(method => (
                      <button
                        key={method.id}
                        onClick={() => setPaymentMethod(method.id as any)}
                        className={`flex-1 flex flex-col items-center gap-1.5 p-2 rounded-2xl border transition-all ${paymentMethod === method.id ? 'border-brand-500 bg-brand-500 text-white shadow-lg' : 'bg-white border-zinc-200 text-zinc-500'}`}
                      >
                        <method.icon size={12} />
                        <span className="text-[8px] font-black uppercase tracking-tight text-center">{method.label}</span>
                      </button>
                    ))}
                  </div>

                  <AnimatePresence>
                    {(paymentMethod === 'card' || paymentMethod === 'crediario') && (
                      <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden bg-brand-50/50 border border-brand-100 rounded-2xl p-3 space-y-3 mt-2">
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-[9px] font-black uppercase text-brand-600">Parcelas</p>
                          <select value={installments} onChange={(e) => setInstallments(Number(e.target.value))} className="bg-white border border-brand-200 text-brand-600 font-bold rounded-lg px-2 py-1 text-[10px] outline-none">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => (
                              <option key={n} value={n}>{n}x {n > 1 ? `(R$ ${((subtotalProducts - entryAmount) / n).toFixed(2)})` : ''}</option>
                            ))}
                          </select>
                        </div>

                        <div className="space-y-3 pt-3 border-t border-brand-100">
                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-brand-600">Valor de Entrada</span>
                            <div className="flex items-center bg-white border border-brand-200 rounded-lg overflow-hidden">
                              <span className="px-2 text-[9px] font-bold text-zinc-400">R$</span>
                              <input
                                type="number"
                                step="0.01"
                                value={entryAmount}
                                onChange={(e) => setEntryAmount(Number(e.target.value))}
                                className="w-20 py-1 text-[10px] font-bold text-zinc-900 outline-none"
                              />
                            </div>
                          </div>

                          {entryAmount > 0 && (
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[9px] font-black uppercase text-brand-600">Meio da Entrada</span>
                              <div className="flex gap-1 flex-1">
                                <button
                                  onClick={() => setEntryPaymentMethod('money')}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[8px] font-black uppercase border transition-all ${entryPaymentMethod === 'money' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-zinc-500 border-zinc-200'}`}
                                >
                                  Dinheiro
                                </button>
                                <button
                                  onClick={() => setEntryPaymentMethod('pix')}
                                  className={`flex-1 py-1 px-2 rounded-lg text-[8px] font-black uppercase border transition-all ${entryPaymentMethod === 'pix' ? 'bg-brand-500 text-white border-brand-500' : 'bg-white text-zinc-500 border-zinc-200'}`}
                                >
                                  PIX
                                </button>
                              </div>
                            </div>
                          )}

                          <div className="flex items-center justify-between">
                            <span className="text-[9px] font-black uppercase text-brand-600">Próximo Pagamento</span>
                            <input
                              type="date"
                              value={nextPaymentDate}
                              onChange={(e) => setNextPaymentDate(e.target.value)}
                              className="bg-white border border-brand-200 text-brand-600 font-bold rounded-lg px-2 py-1 text-[10px] outline-none"
                            />
                          </div>
                        </div>

                        {paymentMethod === 'card' && (
                          <div className="space-y-2 pt-2 border-t border-brand-100">
                            <select value={selectedMachineId} onChange={(e) => { const id = e.target.value; setSelectedMachineId(id); const machine = machines.find(m => m.id === id); if (machine) setCardFeePercentage(machine.fee); }} className="w-full bg-white border border-brand-200 text-brand-600 font-bold rounded-lg px-2 py-1 text-[10px] outline-none">
                              <option value="">Máquina: Manual / Outra</option>
                              {machines.map(m => (<option key={m.id} value={m.id}>{m.name} ({m.fee}%)</option>))}
                            </select>
                            <div className="flex items-center justify-between">
                              <span className="text-[9px] font-black uppercase text-zinc-900">Taxa %</span>
                              <input type="number" step="0.01" value={cardFeePercentage} onChange={(e) => { setCardFeePercentage(Number(e.target.value)); setSelectedMachineId(''); }} className="w-16 bg-white border border-zinc-200 text-zinc-900 font-bold rounded-lg px-2 py-1 text-[10px] outline-none" />
                            </div>
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer (Fixed) */}
        <div className="p-4 bg-zinc-50 border-t border-zinc-100 shrink-0 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
          <div className="flex justify-between items-baseline mb-4">
            <span className="text-zinc-900 font-black text-xs uppercase tracking-wider">Total Agora</span>
            <p className="text-2xl font-display font-black text-zinc-900 tracking-tighter">
              <span className="text-xs text-brand-500 mr-1 uppercase font-sans">R$</span>
              {totalImmediate.toFixed(2)}
            </p>
          </div>

          <button
            disabled={cart.length === 0 || processing || (productsOnAccount && !selectedClient)}
            onClick={handleFinishSale}
            className={`w-full h-12 rounded-2xl font-display font-black text-sm uppercase tracking-tight flex items-center justify-center gap-2 transition-all ${success ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-900 text-white hover:bg-zinc-800 disabled:opacity-50 shadow-premium active:scale-[0.98]'}`}
          >
            {processing ? (
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent" />
            ) : success ? (
              <><CheckCircle2 size={18} /> Venda Realizada!</>
            ) : (
              <><CreditCard size={18} /> Finalizar Venda <ArrowRight size={18} /></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
