import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Clock, DollarSign, Trash2, X } from 'lucide-react';
import { Service } from '../types';
import { apiFetch } from '../lib/api';

export default function Services() {
  const [services, setServices] = useState<Service[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [duration, setDuration] = useState('');

  const fetchServices = async () => {
    try {
      const data = await apiFetch('/services');
      setServices(data);
    } catch (err) {
      console.error('Failed to fetch services:', err);
    }
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiFetch('/services', {
        method: 'POST',
        body: JSON.stringify({
          name,
          price: parseFloat(price),
          duration: parseInt(duration)
        })
      });

      setIsModalOpen(false);
      setName('');
      setPrice('');
      setDuration('');
      fetchServices();
    } catch (err) {
      console.error('Failed to create service:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este serviço?')) {
      try {
        await apiFetch(`/services/${id}`, { method: 'DELETE' });
        fetchServices();
      } catch (err) {
        console.error('Failed to delete service:', err);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20"
        >
          <Plus size={20} />
          Novo Serviço
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.length > 0 ? services.map((service) => (
          <div key={service.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow group relative">
            <button 
              onClick={() => handleDelete(service.id)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-12 h-12 bg-rose-50 text-rose-600 rounded-xl flex items-center justify-center">
                <Sparkles size={24} />
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg">{service.name}</h3>
                <div className="flex items-center gap-2 text-zinc-500 text-sm">
                  <Clock size={14} />
                  <span>{service.duration} min</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-zinc-100">
              <span className="text-zinc-500 text-sm">Valor do serviço</span>
              <span className="text-xl font-bold text-zinc-900">
                R$ {service.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-200 border-dashed">
            Nenhum serviço cadastrado.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Novo Serviço</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Nome do Serviço</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                  placeholder="Ex: Corte Degradê"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Preço (R$)</label>
                  <div className="relative">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                      type="number"
                      step="0.01"
                      required
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="0,00"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Duração (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={16} />
                    <input
                      type="number"
                      required
                      value={duration}
                      onChange={(e) => setDuration(e.target.value)}
                      className="w-full bg-zinc-50 border border-zinc-200 pl-10 pr-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
                      placeholder="30"
                    />
                  </div>
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold py-4 rounded-xl transition-all mt-4"
              >
                Salvar Serviço
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
