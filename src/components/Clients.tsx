import React, { useState, useEffect } from 'react';
import { Plus, Search, Phone, Mail, Trash2, User, X } from 'lucide-react';
import { Client } from '../types';
import { whatsappService } from '../services/whatsappService';
import { apiFetch } from '../lib/api';

export default function Clients() {
  const [clients, setClients] = useState<Client[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const fetchClients = async () => {
    try {
      const data = await apiFetch('/clients');
      setClients(data);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    }
  };

  useEffect(() => {
    fetchClients();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiFetch('/clients', {
        method: 'POST',
        body: JSON.stringify({
          name,
          phone,
          email,
          notes
        })
      });

      // Trigger WhatsApp Welcome
      if (phone) {
        whatsappService.triggerMessage(
          'welcome',
          phone,
          name,
          {
            nome_cliente: name,
            shop_name: 'Salão' // Could be fetched from settings
          }
        );
      }

      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      fetchClients();
    } catch (err) {
      console.error('Failed to create client:', err);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      try {
        await apiFetch(`/clients/${id}`, { method: 'DELETE' });
        fetchClients();
      } catch (err) {
        console.error('Failed to delete client:', err);
      }
    }
  };

  const filteredClients = clients.filter(client => 
    client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    client.phone.includes(searchTerm)
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
          <input
            type="text"
            placeholder="Buscar clientes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-zinc-200 pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
          />
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-amber-500 hover:bg-amber-400 text-zinc-900 font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-amber-500/20"
        >
          <Plus size={20} />
          Novo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.length > 0 ? filteredClients.map((client) => (
          <div key={client.id} className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm hover:shadow-md transition-shadow group relative">
            <button 
              onClick={() => handleDelete(client.id)}
              className="absolute top-4 right-4 p-2 text-zinc-400 hover:text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 size={18} />
            </button>
            
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 bg-zinc-100 rounded-2xl flex items-center justify-center text-xl font-bold text-zinc-600">
                {client.name.charAt(0)}
              </div>
              <div>
                <h3 className="font-bold text-zinc-900 text-lg">{client.name}</h3>
                <p className="text-sm text-zinc-500">Cliente desde {new Date(client.createdAt).toLocaleDateString('pt-BR')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-3 text-zinc-600">
                <Phone size={18} className="text-zinc-400" />
                <span className="text-sm">{client.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <Mail size={18} className="text-zinc-400" />
                <span className="text-sm truncate">{client.email || 'Sem e-mail'}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100">
                <p className="text-[10px] text-rose-600 uppercase font-bold">Pontos</p>
                <p className="text-lg font-bold text-rose-900">{client.loyaltyPoints || 0}</p>
              </div>
              <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                <p className="text-[10px] text-zinc-500 uppercase font-bold">Visitas</p>
                <p className="text-lg font-bold text-zinc-900">{client.loyaltyVisits || 0}</p>
              </div>
            </div>

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Notas</p>
                <p className="text-sm text-zinc-600 line-clamp-2">{client.notes}</p>
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-full py-20 text-center text-zinc-500 bg-white rounded-3xl border border-zinc-200 border-dashed">
            Nenhum cliente cadastrado.
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Novo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Nome Completo</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="Nome do cliente"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Telefone / WhatsApp</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="(00) 00000-0000"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">E-mail (Opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  placeholder="cliente@email.com"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 h-24 resize-none"
                  placeholder="Alguma preferência ou detalhe importante?"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-xl transition-all mt-4"
              >
                Salvar Cliente
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
