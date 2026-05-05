import React, { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Sparkles,
  MoreVertical,
  Check,
  X,
  Trash2,
  LayoutList,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
  Repeat,
  MessageCircle,
  TrendingUp
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Appointment, Client, Service, Staff, ShopSettings, ServiceCombo } from '../types';
import { whatsappService } from '../services/whatsappService';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import RecurringAppointmentModal from './RecurringAppointmentModal';

export default function Appointments() {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [combos, setCombos] = useState<ServiceCombo[]>([]);
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isRecurringOpen, setIsRecurringOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [staffFilter, setStaffFilter] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'monthly' | 'semiannual' | 'annual'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // Form State
  const [selectedClient, setSelectedClient] = useState('');
  const [selectedService, setSelectedService] = useState('');
  const [selectedStaff, setSelectedStaff] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [isFitIn, setIsFitIn] = useState(false);

  const fetchData = async () => {
    try {
      const [appsData, clientsData, servicesData, staffData, settingsData, combosData] = await Promise.all([
        api.get('/appointments'),
        api.get('/clients'),
        api.get('/services'),
        api.get('/staff'),
        api.get('/settings'),
        api.get('/combos')
      ]);
      setAppointments(appsData);
      setClients(clientsData);
      setServices(servicesData);
      setStaff(staffData);
      setSettings(settingsData);
      setCombos(combosData || []);
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      fetchData();
      setToast({ message: `Status atualizado para ${status}`, type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error(err);
      setToast({ message: 'Erro ao atualizar status', type: 'error' });
    }
  };

  const handleNoShow = async (id: string) => {
    try {
      await api.post(`/appointments/${id}/no-show`);
      fetchData();
      setToast({ message: 'No-Show registrado', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) { console.error(err); }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Excluir este agendamento?')) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchData();
      } catch (err) { console.error(err); }
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = app.clientName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesStaff = staffFilter === 'all' || app.staffId === staffFilter;
    return matchesSearch && matchesStatus && matchesStaff;
  });

  const getMonthDays = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const days = [];

    // Add empty days from previous month
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, -i));
    }
    days.reverse();

    // Add days of current month
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }

    // Add empty days from next month
    const remainingDays = 42 - days.length;
    for (let i = 1; i <= remainingDays; i++) {
      days.push(new Date(year, month + 1, i));
    }

    return days;
  };

  const monthDays = getMonthDays(currentDate);

  return (
    <div className="space-y-10 pb-20">
      {/* Header & View Switcher */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white p-6 rounded-[2.5rem] border border-zinc-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-black text-zinc-900 tracking-tight">Agenda Digital</h2>
          <p className="text-xs text-zinc-400 font-bold uppercase tracking-widest mt-1">Planejamento e Gestão de Fluxo</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3 bg-zinc-50 p-1.5 rounded-2xl border border-zinc-100">
          {[
            { id: 'monthly', label: 'Mês' },
            { id: 'semiannual', label: 'Semestre' },
            { id: 'annual', label: 'Anual' },
            { id: 'list', label: 'Lista' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setViewMode(mode.id as any)}
              className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                viewMode === mode.id ? 'bg-zinc-900 text-white shadow-lg' : 'text-zinc-400 hover:text-zinc-600'
              }`}
            >
              {mode.label}
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsRecurringOpen(true)}
            className="p-4 bg-zinc-100 text-zinc-900 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 border border-zinc-200"
            title="Recorrência"
          >
            <Repeat size={20} />
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-brand-500 text-white font-black px-6 py-4 rounded-2xl flex items-center gap-2 hover:bg-brand-600 transition-all shadow-xl shadow-brand-500/10 active:scale-95"
          >
            <Plus size={20} />
            Novo Agendamento
          </button>
        </div>
      </div>

      {/* View Content */}
      <AnimatePresence mode="wait">
        {/* Monthly Calendar View */}
        {viewMode === 'monthly' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-10"
          >
            <div className="lg:col-span-2 bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-premium">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-4">
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1))} className="p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 text-zinc-400"><ChevronLeft size={20} /></button>
                  <h3 className="text-xl font-display font-black text-zinc-900 min-w-[200px] text-center capitalize">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h3>
                  <button onClick={() => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1))} className="p-3 bg-zinc-50 rounded-xl hover:bg-zinc-100 text-zinc-400"><ChevronRight size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-7 gap-4 mb-4">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                  <div key={day} className="text-center text-[10px] font-black text-zinc-400 uppercase tracking-widest">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 gap-3">
                {monthDays.map((day, idx) => {
                  const isSelected = day.toDateString() === selectedDate.toDateString();
                  const isToday = day.toDateString() === new Date().toDateString();
                  const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                  const dayApps = filteredAppointments.filter(a => new Date(a.date).toDateString() === day.toDateString());
                  
                  return (
                    <button
                      key={idx}
                      onClick={() => setSelectedDate(day)}
                      className={`
                        aspect-square rounded-2xl flex flex-col items-center justify-center relative transition-all group border
                        ${isSelected ? 'bg-zinc-900 text-white border-zinc-900 shadow-xl' : 
                          isToday ? 'bg-brand-50 text-brand-500 border-brand-100' : 
                          isCurrentMonth ? 'bg-white text-zinc-900 border-zinc-100 hover:border-zinc-300' : 'bg-zinc-50/50 text-zinc-300 border-transparent'}
                      `}
                    >
                      <span className="text-sm font-bold">{day.getDate()}</span>
                      {dayApps.length > 0 && (
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-brand-500' : 'bg-brand-500'}`} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-premium flex flex-col h-[600px]">
              <div className="mb-6">
                <h4 className="text-lg font-black text-zinc-900 uppercase tracking-tight">Agenda do Dia</h4>
                <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">{selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
              </div>
              
              <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                {filteredAppointments.filter(a => new Date(a.date).toDateString() === selectedDate.toDateString()).length > 0 ? (
                  filteredAppointments.filter(a => new Date(a.date).toDateString() === selectedDate.toDateString()).map(app => (
                    <div key={app.id} className="p-4 bg-zinc-50 rounded-2xl border border-zinc-100 hover:border-zinc-200 transition-all group">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-zinc-400 uppercase">{new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => updateStatus(app.id, 'completed')} className="p-1.5 bg-white text-emerald-600 rounded-lg shadow-sm border border-emerald-50"><Check size={14} /></button>
                          <button onClick={() => updateStatus(app.id, 'cancelled')} className="p-1.5 bg-white text-rose-500 rounded-lg shadow-sm border border-rose-50"><X size={14} /></button>
                        </div>
                      </div>
                      <h5 className="font-bold text-zinc-900 uppercase text-sm truncate">{app.clientName}</h5>
                      <p className="text-[10px] font-bold text-brand-500 uppercase mt-0.5">{app.serviceName}</p>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center py-10 opacity-40">
                    <CalendarIcon size={32} className="mb-2" />
                    <p className="text-[10px] font-bold uppercase tracking-widest">Sem agendamentos</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Planning View (Semiannual / Annual) */}
        {(viewMode === 'semiannual' || viewMode === 'annual') && (
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {Array.from({ length: viewMode === 'semiannual' ? 6 : 12 }).map((_, i) => {
              const d = new Date(currentDate.getFullYear(), currentDate.getMonth() + i, 1);
              const monthApps = appointments.filter(a => {
                const appDate = new Date(a.date);
                return appDate.getMonth() === d.getMonth() && appDate.getFullYear() === d.getFullYear();
              });
              const monthRevenue = monthApps.reduce((acc, a) => acc + (a.price || 0), 0);

              return (
                <div key={i} className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-premium group hover:border-brand-500 transition-colors">
                  <div className="flex items-center justify-between mb-8">
                    <div className="p-4 bg-zinc-900 text-white rounded-2xl group-hover:bg-brand-500 transition-colors">
                      <TrendingUp size={24} />
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">{d.getFullYear()}</p>
                      <h4 className="text-lg font-display font-black text-zinc-900 capitalize leading-none">{d.toLocaleDateString('pt-BR', { month: 'long' })}</h4>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center bg-zinc-50 p-4 rounded-2xl border border-zinc-100">
                      <span className="text-[10px] font-black text-zinc-400 uppercase">Ocupação</span>
                      <span className="text-sm font-black text-zinc-900">{monthApps.length} Apps</span>
                    </div>
                    <div className="flex justify-between items-center bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
                      <span className="text-[10px] font-black text-emerald-600 uppercase">Previsão</span>
                      <span className="text-sm font-black text-emerald-700">R$ {monthRevenue.toLocaleString('pt-BR')}</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => { setCurrentDate(d); setViewMode('monthly'); }}
                    className="w-full mt-6 py-4 bg-zinc-900 text-white text-[10px] font-black uppercase tracking-widest rounded-2xl hover:bg-brand-500 transition-all"
                  >
                    Abrir Planejamento
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}

        {/* List View */}
        {viewMode === 'list' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-premium overflow-hidden"
          >
            <div className="p-8 border-b border-zinc-100 bg-zinc-50/50 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input 
                  type="text" placeholder="Buscar por cliente ou serviço..." 
                  value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full bg-white border border-zinc-200 pl-12 pr-4 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-brand-500/20 transition-all font-bold"
                />
              </div>
              <select 
                value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-white border border-zinc-200 px-6 py-3 rounded-2xl font-bold text-zinc-900 outline-none"
              >
                <option value="all">Todos os Status</option>
                <option value="scheduled">Agendados</option>
                <option value="completed">Concluídos</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-zinc-50/50 border-b border-zinc-100">
                    <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Cliente</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Serviço</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Data & Hora</th>
                    <th className="px-8 py-5 text-left text-[10px] font-black text-zinc-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-5 text-right text-[10px] font-black text-zinc-400 uppercase tracking-widest">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-50">
                  {filteredAppointments.map(app => (
                    <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                      <td className="px-8 py-6 font-bold text-zinc-900 uppercase text-sm">{app.clientName}</td>
                      <td className="px-8 py-6">
                        <span className="bg-brand-50 text-brand-500 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase border border-brand-100">{app.serviceName}</span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-zinc-900">{new Date(app.date).toLocaleDateString('pt-BR')}</span>
                          <span className="text-[10px] font-black text-zinc-400 uppercase">{new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className={`text-[9px] font-black uppercase px-3 py-1.5 rounded-full border ${
                          app.status === 'scheduled' ? 'bg-amber-50 text-amber-600 border-amber-100' : 
                          app.status === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-rose-50 text-rose-500 border-rose-100'
                        }`}>
                          {app.status === 'scheduled' ? 'Agendado' : app.status === 'completed' ? 'Concluído' : 'Cancelado'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => updateStatus(app.id, 'completed')} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-xl transition-colors"><Check size={18} /></button>
                          <button onClick={() => handleDelete(app.id)} className="p-2 text-zinc-300 hover:text-rose-500 transition-colors"><Trash2 size={18} /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <RecurringAppointmentModal
        isOpen={isRecurringOpen}
        onClose={() => setIsRecurringOpen(false)}
        clients={clients}
        services={services}
        staff={staff}
        combos={combos}
        onSuccess={(msg) => {
          fetchData();
          setToast({ message: msg, type: 'success' });
          setTimeout(() => setToast(null), 3000);
        }}
      />

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className={`fixed bottom-10 left-1/2 z-[200] px-8 py-4 rounded-[2rem] shadow-2xl flex items-center gap-4 border backdrop-blur-xl ${
              toast.type === 'success' ? 'bg-zinc-900/90 border-zinc-500/50 text-white' : 'bg-rose-900/90 border-rose-500/50 text-white'
            }`}
          >
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${toast.type === 'success' ? 'bg-emerald-500' : 'bg-rose-500'}`}>
              <Check size={18} strokeWidth={3} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-widest">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
