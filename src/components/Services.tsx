import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Clock, DollarSign, Trash2, X, Package, ChevronRight } from 'lucide-react';
import { Service } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { motion, AnimatePresence } from 'motion/react';

interface ServicePackage {
  id: string;
  name: string;
  sessions: number;
  price: number;
  validityDays: number;
  serviceId: string;
}

export default function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [packages, setPackages] = useState<ServicePackage[]>([]);
  const [isServiceModalOpen, setIsServiceModalOpen] = useState(false);
  const [isPackageModalOpen, setIsPackageModalOpen] = useState(false);
  
  // Service Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  // Package Form State
  const [packageName, setPackageName] = useState('');
  const [packageSessions, setPackageSessions] = useState('4');
  const [packagePrice, setPackagePrice] = useState('');
  const [packageServiceId, setPackageServiceId] = useState('');

  const fetchData = async () => {
    try {
      const [servicesData, packagesData] = await Promise.all([
        api.get('/services'),
        api.get('/service-packages')
      ]);
      setServices(servicesData || []);
      setPackages(packagesData || []);
    } catch (err) {
      console.error('Failed to fetch services/packages:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/services', {
        name,
        price: parseFloat(price),
        duration: parseInt(duration)
      });
      setIsServiceModalOpen(false);
      setName(''); setPrice(''); setDuration('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleCreatePackage = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.post('/service-packages', {
        name: packageName,
        sessions: parseInt(packageSessions),
        price: parseFloat(packagePrice),
        serviceId: packageServiceId,
        validityDays: 30
      });
      setIsPackageModalOpen(false);
      setPackageName(''); setPackagePrice(''); setPackageServiceId('');
      fetchData();
    } catch (err) { console.error(err); }
  };

  const handleDeleteService = async (id: string) => {
    if (confirm('Deseja realmente excluir este serviço?')) {
      try {
        await api.delete(`/services/${id}`);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const handleDeletePackage = async (id: string) => {
    if (confirm('Deseja realmente excluir este pacote?')) {
      try {
        await api.delete(`/service-packages/${id}`);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  return (
    <div className="space-y-10 pb-20">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-black text-zinc-900 tracking-tight">Serviços e Pacotes</h2>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Gestão de Cardápio e Recorrência</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setIsServiceModalOpen(true)}
            className="bg-zinc-900 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-900/10 active:scale-95"
          >
            <Plus size={18} />
            Novo Serviço
          </button>
          <button
            onClick={() => setIsPackageModalOpen(true)}
            className="bg-brand-500 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/10 active:scale-95"
          >
            <Package size={18} />
            Pacote Mensal
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Services Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="p-2 bg-amber-50 text-amber-600 rounded-xl">
              <Sparkles size={18} />
            </div>
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Serviços Individuais</h3>
          </div>
          
          <div className="grid grid-cols-1 gap-4">
            {services.map(service => (
              <motion.div 
                layout
                key={service.id} 
                className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-sm hover:shadow-premium transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center text-zinc-900 group-hover:bg-amber-500 group-hover:text-white transition-all">
                    <Sparkles size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-zinc-900 uppercase tracking-tight">{service.name}</h4>
                    <div className="flex items-center gap-3 text-xs font-bold text-zinc-400 mt-1">
                      <span className="flex items-center gap-1"><Clock size={12} /> {service.duration} min</span>
                      <span>•</span>
                      <span className="text-zinc-900">R$ {service.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
                <button onClick={() => handleDeleteService(service.id)} className="p-3 text-zinc-300 hover:text-rose-500 transition-colors">
                  <Trash2 size={18} />
                </button>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Packages Section */}
        <section className="space-y-6">
          <div className="flex items-center gap-3 ml-2">
            <div className="p-2 bg-brand-50 text-brand-500 rounded-xl">
              <Package size={18} />
            </div>
            <h3 className="text-sm font-black text-zinc-400 uppercase tracking-widest">Pacotes Recorrentes</h3>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {packages.map(pkg => (
              <motion.div 
                layout
                key={pkg.id} 
                className="bg-white p-6 rounded-[2rem] border border-brand-100 shadow-sm hover:shadow-premium transition-all group border-l-8 border-l-brand-500"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-50 text-brand-500 rounded-2xl flex items-center justify-center">
                      <Package size={24} />
                    </div>
                    <div>
                      <h4 className="font-bold text-zinc-900 uppercase tracking-tight">{pkg.name}</h4>
                      <p className="text-[10px] font-black text-brand-500 uppercase mt-1">{pkg.sessions} Sessões inclusas</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-black text-zinc-900">R$ {pkg.price.toFixed(2)}</p>
                    <button onClick={() => handleDeletePackage(pkg.id)} className="text-xs font-bold text-rose-500 hover:underline mt-1">Excluir</button>
                  </div>
                </div>
              </motion.div>
            ))}
            {packages.length === 0 && (
              <div className="p-12 text-center bg-zinc-50 rounded-[2.5rem] border-2 border-dashed border-zinc-200">
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Nenhum pacote mensal cadastrado</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Service Modal */}
      <AnimatePresence>
        {isServiceModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-black text-zinc-900">Novo Serviço</h3>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Cadastre um atendimento avulso</p>
                </div>
                <button onClick={() => setIsServiceModalOpen(false)} className="p-2 bg-zinc-100 text-zinc-500 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreateService} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome do Serviço *</label>
                  <input
                    type="text" required value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold placeholder:text-zinc-600"
                    placeholder="Ex: Corte de Cabelo"
                  />
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Preço (R$) *</label>
                    <input
                      type="number" step="0.01" required value={price} onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                      placeholder="50.00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Duração (minutos) *</label>
                    <input
                      type="number" required value={duration} onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all font-bold"
                      placeholder="60"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-amber-500 text-zinc-900 font-black py-5 rounded-2xl shadow-xl shadow-amber-500/20 hover:bg-amber-400 transition-all flex items-center justify-center gap-2">
                  Criar Serviço <ChevronRight size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Package Modal */}
      <AnimatePresence>
        {isPackageModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-zinc-900/40 backdrop-blur-md">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-display font-black text-zinc-900">Novo Pacote Mensal</h3>
                  <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest">Recorrência e fidelidade</p>
                </div>
                <button onClick={() => setIsPackageModalOpen(false)} className="p-2 bg-zinc-100 text-zinc-500 rounded-full">
                  <X size={20} />
                </button>
              </div>
              <form onSubmit={handleCreatePackage} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nome do Pacote *</label>
                  <input
                    type="text" required value={packageName} onChange={(e) => setPackageName(e.target.value)}
                    className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold"
                    placeholder="Ex: Assinatura Mensal - 4 Cortes"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Serviço Base *</label>
                  <select 
                    required value={packageServiceId} onChange={(e) => setPackageServiceId(e.target.value)}
                    className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold"
                  >
                    <option value="">Selecione o serviço</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Nº de Sessões *</label>
                    <input
                      type="number" required value={packageSessions} onChange={(e) => setPackageSessions(e.target.value)}
                      className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-zinc-400 uppercase tracking-widest ml-1">Preço Total (R$) *</label>
                    <input
                      type="number" step="0.01" required value={packagePrice} onChange={(e) => setPackagePrice(e.target.value)}
                      className="w-full bg-zinc-900 text-white px-6 py-4 rounded-2xl focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 outline-none transition-all font-bold"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-brand-500 text-white font-black py-5 rounded-2xl shadow-xl shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center justify-center gap-2">
                  Criar Pacote <ChevronRight size={18} />
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
