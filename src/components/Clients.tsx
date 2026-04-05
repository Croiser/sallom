import React, { useState, useEffect } from 'react';
import { 
  Plus as PlusIcon, 
  Search as SearchIcon, 
  Phone as PhoneIcon, 
  Mail as MailIcon, 
  Trash2 as TrashIcon, 
  User as UserIcon, 
  X as XIcon, 
  Group as UsersIcon, 
  Gift as GiftIcon, 
  Star as StarIcon, 
  ArrowRight as ArrowIcon, 
  Check as CheckIcon 
} from 'lucide-react';
import { Client, ShopSettings } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useAuth } from '../contexts/AuthContext';
import { motion, AnimatePresence } from 'motion/react';
import { api } from '../services/api';
import ClientAnamnesis from './ClientAnamnesis';
import { ClipboardList } from 'lucide-react';

export default function Clients() {
  const { user } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRedeemModalOpen, setIsRedeemModalOpen] = useState(false);
  const [selectedClientForRedeem, setSelectedClientForRedeem] = useState<Client | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClientForAnamnesis, setSelectedClientForAnamnesis] = useState<Client | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form State
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [notes, setNotes] = useState('');

  const fetchData = async () => {
    try {
      const [clientsData, settingsData] = await Promise.all([
        api.get('/clients'),
        api.get('/settings')
      ]);
      setClients(clientsData);
      setSettings(settingsData);
    } catch (err) {
      console.error('Failed to fetch data:', err);
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
      await api.post('/clients', {
        name,
        phone,
        email,
        notes
      });

      // Trigger WhatsApp Welcome
      if (phone && user?.uid) {
        whatsappService.triggerMessage(
          phone,
          name,
          'welcome',
          {
            nome_cliente: name,
            shop_name: settings?.name || 'Salão'
          }
        );
      }

      setIsModalOpen(false);
      setName('');
      setPhone('');
      setEmail('');
      setNotes('');
      fetchData();
      setToast({ message: 'Cliente cadastrado com sucesso!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to create client:', err);
      setToast({ message: 'Erro ao cadastrar cliente.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este cliente?')) {
      try {
        await api.delete(`/clients/${id}`);
        fetchData();
        setToast({ message: 'Cliente excluído com sucesso!', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        console.error('Failed to delete client:', err);
        setToast({ message: 'Erro ao excluir cliente.', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const handleRedeem = async () => {
    if (!selectedClientForRedeem || !settings?.fidelityConfig) return;
    
    try {
      await api.post(`/clients/${selectedClientForRedeem.id}/redeem`, {});
      
      setToast({ message: 'Resgate realizado com sucesso!', type: 'success' });
      setIsRedeemModalOpen(false);
      setSelectedClientForRedeem(null);
      fetchData();
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error('Failed to redeem points:', err);
      setToast({ message: err.message || 'Erro ao realizar resgate.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
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
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
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
          <PlusIcon size={20} />
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
              <TrashIcon size={18} />
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
                <PhoneIcon size={18} className="text-zinc-400" />
                <span className="text-sm">{client.phone || 'Sem telefone'}</span>
              </div>
              <div className="flex items-center gap-3 text-zinc-600">
                <MailIcon size={18} className="text-zinc-400" />
                <span className="text-sm truncate">{client.email || 'Sem e-mail'}</span>
              </div>
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="bg-rose-50 p-3 rounded-2xl border border-rose-100 relative overflow-hidden">
                <p className="text-[10px] text-rose-600 uppercase font-bold">Pontos</p>
                <p className="text-lg font-bold text-rose-900">{client.loyaltyPoints || 0}</p>
                <GiftIcon className="absolute -right-2 -bottom-2 text-rose-200/50" size={40} />
              </div>
                <div className="bg-zinc-50 p-3 rounded-2xl border border-zinc-100">
                  <p className="text-[10px] text-zinc-500 uppercase font-bold">Visitas</p>
                  <p className="text-lg font-bold text-zinc-900">{client.loyaltyVisits || 0}</p>
                </div>
              </div>

              <button
                onClick={() => setSelectedClientForAnamnesis(client)}
                className="mt-3 w-full bg-zinc-900 hover:bg-zinc-800 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 border border-zinc-800"
              >
                <ClipboardList size={16} className="text-rose-500" />
                Ficha de Anamnese
              </button>

            {settings?.fidelityConfig?.enabled && client.loyaltyPoints >= (settings.fidelityConfig.minPointsToRedeem || 100) && (
              <button
                onClick={() => {
                  setSelectedClientForRedeem(client);
                  setIsRedeemModalOpen(true);
                }}
                className="mt-4 w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-2 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20"
              >
                <StarIcon size={16} fill="currentColor" />
                Resgatar Prêmio
              </button>
            )}

            {client.notes && (
              <div className="mt-4 pt-4 border-t border-zinc-100">
                <p className="text-xs text-zinc-400 uppercase font-bold mb-1">Notas</p>
                <p className="text-sm text-zinc-600 line-clamp-2">{client.notes}</p>
              </div>
            )}
          </div>
        )) : (
          <div className="col-span-full py-20 text-center bg-white rounded-[2.5rem] border border-zinc-200 border-dashed space-y-4">
            <div className="w-16 h-16 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto">
                <UsersIcon size={32} />
            </div>
            <div>
              <h3 className="text-xl font-bold text-zinc-900">Sua lista está vazia</h3>
              <p className="text-zinc-500 max-w-xs mx-auto text-sm">
                Cadastre seus clientes para facilitar o agendamento e manter o histórico de visitas.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-blue-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-blue-400 transition-all shadow-lg shadow-blue-500/20"
            >
              Cadastrar Primeiro Cliente
            </button>
          </div>
        )}
      </div>

      {/* Redeem Modal */}
      {isRedeemModalOpen && selectedClientForRedeem && settings?.fidelityConfig && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-emerald-50">
              <h3 className="text-xl font-bold text-emerald-900 flex items-center gap-2">
                <GiftIcon size={24} />
                Resgatar Prêmio
              </h3>
              <button onClick={() => setIsRedeemModalOpen(false)} className="text-emerald-400 hover:text-emerald-600">
                <XIcon size={24} />
              </button>
            </div>
            <div className="p-6 space-y-6">
              <div className="text-center space-y-2">
                <p className="text-zinc-500">O cliente <span className="font-bold text-zinc-900">{selectedClientForRedeem.name}</span> possui</p>
                <div className="text-4xl font-black text-rose-500">{selectedClientForRedeem.loyaltyPoints}</div>
                <p className="text-sm font-medium text-zinc-400 uppercase tracking-widest">Pontos Acumulados</p>
              </div>

              <div className="bg-zinc-50 p-6 rounded-2xl border border-zinc-100 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-zinc-500">Custo do Resgate</span>
                  <span className="font-bold text-rose-600">-{settings.fidelityConfig.minPointsToRedeem} pontos</span>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-zinc-200">
                  <span className="text-zinc-900 font-bold">Valor do Prêmio</span>
                  <span className="text-2xl font-black text-emerald-600">R$ {settings.fidelityConfig.redeemValue.toFixed(2)}</span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button
                  onClick={handleRedeem}
                  className="w-full bg-emerald-500 hover:bg-emerald-400 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2"
                >
                  Confirmar Resgate
                  <ArrowIcon size={18} />
                </button>
                <button
                  onClick={() => setIsRedeemModalOpen(false)}
                  className="w-full bg-zinc-100 hover:bg-zinc-200 text-zinc-600 font-bold py-4 rounded-xl transition-all"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-8 left-1/2 z-[100] px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border ${
              toast.type === 'success' 
                ? 'bg-emerald-900 border-emerald-500/50 text-emerald-50' 
                : 'bg-rose-900 border-rose-500/50 text-rose-50'
            }`}
          >
            {toast.type === 'success' ? (
              <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckIcon size={14} className="text-emerald-900" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <XIcon size={14} className="text-rose-900" />
              </div>
            )}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Anamnesis Modal */}
      <AnimatePresence>
        {selectedClientForAnamnesis && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-4xl rounded-[2.5rem] shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-8 border-b border-zinc-100 flex items-center justify-between">
                <div>
                    <h3 className="text-2xl font-bold text-zinc-900">{selectedClientForAnamnesis.name}</h3>
                    <p className="text-sm text-zinc-500">Histórico de Anamnese e Fichas Técnicas</p>
                </div>
                <button 
                    onClick={() => setSelectedClientForAnamnesis(null)} 
                    className="p-3 hover:bg-zinc-100 rounded-2xl transition-all text-zinc-400 hover:text-zinc-600"
                >
                  <XIcon size={24} />
                </button>
              </div>
              <div className="p-8 overflow-y-auto flex-1 custom-scrollbar">
                <ClientAnamnesis clientId={selectedClientForAnamnesis.id} />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Novo Cliente</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <XIcon size={24} />
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
