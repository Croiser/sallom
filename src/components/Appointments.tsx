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
  Repeat
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
  const [viewMode, setViewMode] = useState<'list' | 'calendar' | 'monthly'>('monthly');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [previewDate, setPreviewDate] = useState<Date | null>(null);
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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    const client = clients.find(c => c.id === selectedClient);
    const service = services.find(s => s.id === selectedService);
    const staffMember = staff.find(s => s.id === selectedStaff);

    if (!client || !service) return;

    const appointmentDate = new Date(`${date}T${time}`);

    try {
      await api.post('/appointments', {
        clientId: client.id,
        clientName: client.name,
        phone: client.phone || '',
        serviceId: service.id,
        serviceName: service.name,
        barberId: staffMember?.id || '',
        barberName: staffMember?.name || 'Geral',
        staffId: staffMember?.id || '',
        staffName: staffMember?.name || 'Geral',
        date: appointmentDate.toISOString(),
        price: service.price,
        isFitIn
      });

      // Trigger WhatsApp Confirmation
      if (client.phone && user?.uid) {
        whatsappService.triggerMessage(
          client.phone,
          client.name,
          'confirmation',
          {
            nome_cliente: client.name,
            shop_name: settings?.name || 'Salão',
            data: appointmentDate.toLocaleDateString('pt-BR'),
            hora: appointmentDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
          }
        );
      }

      setIsModalOpen(false);
      setSelectedClient('');
      setSelectedService('');
      setSelectedStaff('');
      setDate('');
      setTime('');
      setIsFitIn(false);
      fetchData();
      setToast({ message: 'Agendamento criado com sucesso!', type: 'success' });
      setTimeout(() => setToast(null), 3000);
    } catch (err) {
      console.error('Failed to create appointment:', err);
      setToast({ message: 'Erro ao criar agendamento.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleNoShow = async (id: string) => {
    if (confirm('Marcar como Faltou (No-Show)? Esto gerará uma cobrança de 50% do valor do serviço para a cliente.')) {
      try {
        await api.post(`/appointments/${id}/no-show`);
        fetchData();
        setToast({ message: 'No-Show registrado! Débito gerado para a cliente.', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        console.error('Failed to register No-Show:', err);
        setToast({ message: 'Erro ao registrar No-Show.', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const updateStatus = async (id: string, status: Appointment['status']) => {
    try {
      await api.put(`/appointments/${id}/status`, { status });
      fetchData();
      
      if (status === 'completed') {
        setToast({ message: 'Agendamento concluído! Pontos de fidelidade adicionados.', type: 'success' });
      } else if (status === 'cancelled') {
        setToast({ message: 'Agendamento cancelado.', type: 'success' });
      } else {
        setToast({ message: 'Status atualizado com sucesso!', type: 'success' });
      }
      
      setTimeout(() => setToast(null), 3000);
    } catch (error) {
      console.error('Error updating status:', error);
      setToast({ message: 'Erro ao atualizar status.', type: 'error' });
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Deseja realmente excluir este agendamento?')) {
      try {
        await api.delete(`/appointments/${id}`);
        fetchData();
        setToast({ message: 'Agendamento excluído com sucesso!', type: 'success' });
        setTimeout(() => setToast(null), 3000);
      } catch (err) {
        console.error('Failed to delete appointment:', err);
        setToast({ message: 'Erro ao excluir agendamento.', type: 'error' });
        setTimeout(() => setToast(null), 3000);
      }
    }
  };

  const filteredAppointments = appointments.filter(app => {
    const matchesSearch = (app.clientName?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                         (app.serviceName?.toLowerCase() || '').includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    const matchesStaff = staffFilter === 'all' || app.staffId === staffFilter;
    
    return matchesSearch && matchesStatus && matchesStaff;
  });

  // Calendar Logic
  const getDaysInWeek = (date: Date) => {
    const start = new Date(date);
    start.setDate(date.getDate() - date.getDay());
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      return d;
    });
  };

  const weekDays = getDaysInWeek(currentDate);
  const hours = Array.from({ length: 14 }, (_, i) => i + 8); // 8:00 to 21:00

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    
    const days = [];
    const startPadding = firstDay.getDay();
    
    for (let i = startPadding; i > 0; i--) {
      days.push(new Date(year, month, 1 - i));
    }
    
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
    
    const endPadding = 42 - days.length;
    for (let i = 1; i <= endPadding; i++) {
      days.push(new Date(year, month + 1, i));
    }
    
    return days;
  };

  const monthDays = getDaysInMonth(currentDate);

  const renderMonthlyView = () => {
    const selectedDayApps = filteredAppointments.filter(app => 
      new Date(app.date).toDateString() === selectedDate.toDateString()
    );

    return (
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900 text-lg">
              {currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
            </h3>
            <div className="flex items-center gap-2">
              <button 
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setMonth(d.getMonth() - 1);
                  setCurrentDate(d);
                }}
                className="p-2 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                <ChevronLeft size={20} />
              </button>
              <button 
                onClick={() => {
                  const now = new Date();
                  setCurrentDate(now);
                  setSelectedDate(now);
                }}
                className="text-sm font-bold px-4 py-2 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                Hoje
              </button>
              <button 
                onClick={() => {
                  const d = new Date(currentDate);
                  d.setMonth(d.getMonth() + 1);
                  setCurrentDate(d);
                }}
                className="p-2 hover:bg-zinc-200 rounded-xl transition-colors"
              >
                <ChevronRight size={20} />
              </button>
            </div>
          </div>
          
          <div className="p-4">
            <div className="grid grid-cols-7 mb-2">
              {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => (
                <div key={day} className="text-center text-xs font-bold text-zinc-400 uppercase py-2">
                  {day}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {monthDays.map((day) => {
                const isSelected = day.toDateString() === selectedDate.toDateString();
                const isToday = day.toDateString() === new Date().toDateString();
                const isCurrentMonth = day.getMonth() === currentDate.getMonth();
                const dayApps = filteredAppointments.filter(app => 
                  new Date(app.date).toDateString() === day.toDateString()
                );
                const hasApps = dayApps.length > 0;

                return (
                  <div key={day.toISOString()} className="relative group">
                    <button
                      onClick={() => {
                        setSelectedDate(day);
                        if (hasApps) {
                          setPreviewDate(previewDate?.toDateString() === day.toDateString() ? null : day);
                        } else {
                          setPreviewDate(null);
                        }
                      }}
                      className={`
                        w-full aspect-square p-2 rounded-2xl flex flex-col items-center justify-center relative transition-all
                        ${isSelected ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/20' : 
                          isToday ? 'bg-rose-50 text-rose-600' : 
                          isCurrentMonth ? 'hover:bg-zinc-50 text-zinc-900' : 'text-zinc-300'}
                      `}
                    >
                      <span className="text-sm font-bold">{day.getDate()}</span>
                      {hasApps && (
                        <div className={`w-1.5 h-1.5 rounded-full mt-1 ${isSelected ? 'bg-white' : 'bg-rose-500'}`} />
                      )}
                    </button>

                    <AnimatePresence>
                      {previewDate?.toDateString() === day.toDateString() && hasApps && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.9, y: 10 }}
                          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-50 w-48 bg-zinc-900 text-white p-3 rounded-2xl shadow-xl pointer-events-none"
                        >
                          <div className="space-y-2">
                            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Preview</p>
                            {dayApps.slice(0, 2).map(app => (
                              <div key={app.id} className={`border-l-2 ${app.isFitIn ? 'border-amber-500' : 'border-rose-500'} pl-2 py-0.5`}>
                                <p className="text-[11px] font-bold truncate">
                                  {app.clientName} {app.isFitIn && '⚡'}
                                </p>
                                <p className="text-[9px] text-zinc-400 truncate">{app.serviceName}</p>
                              </div>
                            ))}
                            {dayApps.length > 2 && (
                              <p className="text-[9px] text-rose-500 font-medium">+ {dayApps.length - 2} outros</p>
                            )}
                          </div>
                          <div className="absolute top-full left-1/2 -translate-x-1/2 border-8 border-transparent border-t-zinc-900" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
            <h3 className="font-bold text-zinc-900">
              {selectedDate.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}
            </h3>
            <p className="text-xs text-zinc-500 mt-1">{selectedDayApps.length} agendamentos</p>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {selectedDayApps.length > 0 ? selectedDayApps.map(app => (
              <div key={app.id} className="p-4 rounded-2xl border border-zinc-100 hover:border-rose-200 transition-all group">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-1 rounded-lg">
                    {new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                    app.status === 'scheduled' ? 'bg-zinc-100 text-zinc-600' : 
                    app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                    app.status === 'no_show' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                  }`}>
                    {app.status === 'scheduled' ? 'Agendado' : app.status === 'completed' ? 'Concluído' : app.status === 'no_show' ? 'No-Show' : 'Cancelado'}
                  </span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-bold text-zinc-900 flex items-center gap-2">
                    {app.clientName}
                    {app.isFitIn && (
                      <span className="text-[9px] bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-md font-bold uppercase">
                        Encaixe
                      </span>
                    )}
                  </h4>
                  {app.status === 'scheduled' && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => updateStatus(app.id, 'completed')}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="Concluir"
                      >
                        <Check size={14} />
                      </button>
                      <button 
                        onClick={() => handleNoShow(app.id)}
                        className="p-1.5 text-rose-400 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Faltou (No-Show)"
                      >
                        <AlertCircle size={14} />
                      </button>
                      <button 
                        onClick={() => updateStatus(app.id, 'cancelled')}
                        className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  )}
                </div>
                <p className="text-xs text-zinc-500">{app.serviceName}</p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-zinc-50">
                  <div className="w-6 h-6 bg-zinc-100 rounded-full flex items-center justify-center text-[10px] font-bold text-zinc-500">
                    {app.staffName?.charAt(0) || 'G'}
                  </div>
                  <span className="text-[10px] text-zinc-400 font-medium">{app.staffName || 'Geral'}</span>
                </div>
              </div>
            )) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-8">
                <div className="w-12 h-12 bg-zinc-50 rounded-full flex items-center justify-center mb-4">
                  <CalendarIcon size={24} className="text-zinc-300" />
                </div>
                <p className="text-sm text-zinc-500">Nenhum agendamento para este dia.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-zinc-200">
          <button 
            onClick={() => setViewMode('list')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'list' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
            title="Lista"
          >
            <LayoutList size={20} />
          </button>
          <button 
            onClick={() => setViewMode('monthly')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'monthly' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
            title="Mensal"
          >
            <CalendarIcon size={20} />
          </button>
          <button 
            onClick={() => setViewMode('calendar')}
            className={`p-2 rounded-xl transition-all ${viewMode === 'calendar' ? 'bg-rose-500 text-white' : 'text-zinc-400 hover:text-zinc-600'}`}
            title="Semanal"
          >
            <Clock size={20} />
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-4 flex-1">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
            <input
              type="text"
              placeholder="Buscar agendamentos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-white border border-zinc-200 pl-12 pr-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all"
            />
          </div>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-white border border-zinc-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium"
          >
            <option value="all">Todos os Status</option>
            <option value="scheduled">Agendado</option>
            <option value="completed">Concluído</option>
            <option value="no_show">No-Show</option>
            <option value="cancelled">Cancelado</option>
          </select>

          <select
            value={staffFilter}
            onChange={(e) => setStaffFilter(e.target.value)}
            className="bg-white border border-zinc-200 px-4 py-3 rounded-2xl focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-all text-sm font-medium"
          >
            <option value="all">Todos os Profissionais</option>
            {staff.map(member => (
              <option key={member.id} value={member.id}>{member.name}</option>
            ))}
          </select>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-rose-500 hover:bg-rose-400 text-white font-bold px-6 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-rose-500/20"
        >
          <Plus size={20} />
          Novo Agendamento
        </button>
        <button
          id="recurring-open-btn"
          onClick={() => setIsRecurringOpen(true)}
          className="bg-zinc-900 hover:bg-zinc-700 text-white font-bold px-5 py-3 rounded-2xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-zinc-900/20"
          title="Agendamento Recorrente"
        >
          <Repeat size={18} />
          Recorrente
        </button>
      </div>

      {viewMode === 'list' ? (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50 border-b border-zinc-100">
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Cliente</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Serviço</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Profissional</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Data & Hora</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-zinc-500 uppercase tracking-wider text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {filteredAppointments.length > 0 ? filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-zinc-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-zinc-100 rounded-full flex items-center justify-center text-xs font-bold text-zinc-600">
                          {app.clientName?.charAt(0) || '?'}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-zinc-900">{app.clientName}</span>
                          {app.isFitIn && <span className="text-[10px] text-rose-600 font-bold uppercase">Encaixe</span>}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-zinc-600">{app.serviceName}</td>
                    <td className="px-6 py-4 text-zinc-600">{app.staffName || 'Geral'}</td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col">
                        <span className="text-zinc-900 font-medium">
                          {new Date(app.date).toLocaleDateString('pt-BR')}
                        </span>
                        <span className="text-xs text-zinc-500">
                          {new Date(app.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`
                        text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded-full
                        ${app.status === 'scheduled' ? 'bg-rose-100 text-rose-700' : 
                          app.status === 'completed' ? 'bg-emerald-100 text-emerald-700' : 
                          app.status === 'no_show' ? 'bg-amber-100 text-amber-700' :
                          'bg-rose-100 text-rose-700'}
                      `}>
                        {app.status === 'scheduled' ? 'Agendado' : app.status === 'completed' ? 'Concluído' : app.status === 'no_show' ? 'No-Show' : 'Cancelado'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {app.status === 'scheduled' && (
                          <>
                            <button 
                              onClick={() => updateStatus(app.id, 'completed')}
                              className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Concluir"
                            >
                              <Check size={18} />
                            </button>
                            <button 
                              onClick={() => handleNoShow(app.id)}
                              className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                              title="Faltou (No-Show)"
                            >
                              <AlertCircle size={18} />
                            </button>
                            <button 
                              onClick={() => updateStatus(app.id, 'cancelled')}
                              className="p-2 text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Cancelar"
                            >
                              <X size={18} />
                            </button>
                          </>
                        )}
                        <button 
                          onClick={() => handleDelete(app.id)}
                          className="p-2 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-20 text-center space-y-4">
                      <div className="w-16 h-16 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto">
                        <CalendarIcon size={32} />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-zinc-900">Nenhum agendamento</h3>
                        <p className="text-zinc-500 max-w-xs mx-auto text-sm">
                          Seus agendamentos aparecerão aqui. Comece marcando um horário para um cliente.
                        </p>
                      </div>
                      <button
                        onClick={() => setIsModalOpen(true)}
                        className="bg-rose-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-rose-400 transition-all shadow-lg shadow-rose-500/20"
                      >
                        Marcar Primeiro Horário
                      </button>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : viewMode === 'monthly' ? (
        renderMonthlyView()
      ) : (
        <div className="bg-white rounded-3xl border border-zinc-200 shadow-sm overflow-hidden flex flex-col h-[600px]">
          <div className="p-4 border-b border-zinc-100 flex items-center justify-between bg-zinc-50/50">
            <div className="flex items-center gap-4">
              <h3 className="font-bold text-zinc-900">
                {weekDays[0].toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
              </h3>
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() - 7);
                    setCurrentDate(d);
                  }}
                  className="p-1 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  <ChevronLeft size={20} />
                </button>
                <button 
                  onClick={() => setCurrentDate(new Date())}
                  className="text-xs font-bold px-2 py-1 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  Hoje
                </button>
                <button 
                  onClick={() => {
                    const d = new Date(currentDate);
                    d.setDate(d.getDate() + 7);
                    setCurrentDate(d);
                  }}
                  className="p-1 hover:bg-zinc-200 rounded-lg transition-colors"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>
          </div>
          <div className="flex-1 overflow-auto">
            <div className="grid grid-cols-[80px_repeat(7,1fr)] min-w-[800px]">
              <div className="bg-zinc-50 border-r border-zinc-100" />
              {weekDays.map((day) => (
                <div key={day.toISOString()} className={`p-3 text-center border-b border-zinc-100 ${day.toDateString() === new Date().toDateString() ? 'bg-rose-50' : 'bg-zinc-50'}`}>
                  <p className="text-xs font-bold text-zinc-400 uppercase">{day.toLocaleDateString('pt-BR', { weekday: 'short' })}</p>
                  <p className={`text-lg font-bold ${day.toDateString() === new Date().toDateString() ? 'text-rose-600' : 'text-zinc-900'}`}>{day.getDate()}</p>
                </div>
              ))}
              
              {hours.map((hour) => (
                <React.Fragment key={hour}>
                  <div className="p-2 text-right text-xs font-medium text-zinc-400 border-r border-zinc-100 h-20">
                    {hour}:00
                  </div>
                  {weekDays.map((day) => {
                    const dayApps = filteredAppointments.filter(app => {
                      const appDate = new Date(app.date);
                      return appDate.toDateString() === day.toDateString() && appDate.getHours() === hour;
                    });
                    
                    return (
                      <div key={`${day.toISOString()}-${hour}`} className="border-b border-r border-zinc-50 p-1 relative group h-20">
                        {dayApps.map(app => (
                          <div 
                            key={app.id} 
                            className={`
                              mb-1 p-1.5 rounded-lg text-[10px] leading-tight shadow-sm border
                              ${app.status === 'completed' ? 'bg-emerald-50 border-emerald-100 text-emerald-700' : 
                                app.status === 'cancelled' ? 'bg-rose-50 border-rose-100 text-rose-700' : 
                                app.status === 'no_show' ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                app.isFitIn ? 'bg-amber-50 border-amber-100 text-amber-700' :
                                'bg-rose-50 border-rose-100 text-rose-700'}
                            `}
                          >
                            <p className="font-bold truncate">
                              {app.clientName} {app.isFitIn && '⚡'}
                            </p>
                            <p className="opacity-70 truncate">{app.serviceName}</p>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </React.Fragment>
              ))}
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
                <Check size={14} className="text-emerald-900" />
              </div>
            ) : (
              <div className="w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center">
                <X size={14} className="text-rose-900" />
              </div>
            )}
            <span className="font-bold text-sm tracking-tight">{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="text-xl font-bold text-zinc-900">Novo Agendamento</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-zinc-600">
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Cliente</label>
                <select
                  required
                  value={selectedClient}
                  onChange={(e) => setSelectedClient(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">Selecione um cliente</option>
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Serviço</label>
                <select
                  required
                  value={selectedService}
                  onChange={(e) => setSelectedService(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">Selecione um serviço</option>
                  {services.map(s => <option key={s.id} value={s.id}>{s.name} - R$ {s.price}</option>)}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-zinc-700">Profissional</label>
                <select
                  value={selectedStaff}
                  onChange={(e) => setSelectedStaff(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                >
                  <option value="">Selecione um profissional (opcional)</option>
                  {staff.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
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
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-700">Hora</label>
                  <input
                    type="time"
                    required
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 py-2">
                <input
                  type="checkbox"
                  id="fitin"
                  checked={isFitIn}
                  onChange={(e) => setIsFitIn(e.target.checked)}
                  className="w-4 h-4 text-rose-500 border-zinc-300 rounded focus:ring-rose-500"
                />
                <label htmlFor="fitin" className="text-sm font-medium text-zinc-700 cursor-pointer">
                  Marcar como Encaixe
                </label>
              </div>

              <button
                type="submit"
                className="w-full bg-rose-500 hover:bg-rose-400 text-white font-bold py-4 rounded-xl transition-all mt-4"
              >
                Confirmar Agendamento
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Recurring Appointment Modal */}
      <RecurringAppointmentModal
        isOpen={isRecurringOpen}
        onClose={() => setIsRecurringOpen(false)}
        clients={clients}
        services={services}
        staff={staff}
        combos={combos}
        onSuccess={(msg) => {
          setToast({ message: msg, type: 'success' });
          setTimeout(() => setToast(null), 5000);
          fetchData();
        }}
      />
    </div>
  );
}
