import React, { useState, useEffect } from 'react';
import { ShopSettings, Service, Staff, BusinessHours, Appointment } from '../types';
import { Sparkles, Calendar, Clock, User, CheckCircle2, ChevronRight, ChevronLeft, MapPin, Phone, Copy } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format, addDays, startOfToday, isSameDay, parse, isAfter, isBefore } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { api } from '../services/api';

interface BookingPageProps {
  slug: string;
}

export default function BookingPage({ slug }: BookingPageProps) {
  const [shop, setShop] = useState<ShopSettings | null>(null);
  const [ownerProfile, setOwnerProfile] = useState<any>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Booking State
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(startOfToday());
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [clientInfo, setClientInfo] = useState({ name: '', phone: '' });
  const [isBooking, setIsBooking] = useState(false);
  const [bookingSuccess, setBookingSuccess] = useState(false);
  const [showCustomAlert, setShowCustomAlert] = useState(false);

  const triggerAlert = () => {
    setShowCustomAlert(true);
    setTimeout(() => setShowCustomAlert(false), 1500);
  };

  useEffect(() => {
    const fetchShopData = async () => {
      try {
        const { shop: shopData, owner } = await api.get(`/public/shop/${slug}`);
        setShop(shopData);
        setOwnerProfile(owner);

        const [servicesData, staffData] = await Promise.all([
          api.get(`/public/services/${shopData.uid}`),
          api.get(`/public/staff/${shopData.uid}`)
        ]);

        setServices(servicesData);
        setStaff(staffData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching shop data:', err);
        setError('Erro ao carregar dados do salão.');
        setLoading(false);
      }
    };

    fetchShopData();
  }, [slug]);

  const generateTimeSlots = () => {
    if (!shop?.businessHours) return [];
    
    const dayName = format(selectedDate, 'EEEE', { locale: ptBR });
    const dayConfig = shop.businessHours.find(h => h.day.toLowerCase() === dayName.toLowerCase());

    if (!dayConfig || dayConfig.closed) return [];

    const slots = [];
    let current = parse(dayConfig.open, 'HH:mm', selectedDate);
    const end = parse(dayConfig.close, 'HH:mm', selectedDate);

    while (isBefore(current, end)) {
      const timeStr = format(current, 'HH:mm');
      // Simple check: if today, only show future times
      if (isSameDay(selectedDate, startOfToday())) {
        if (isAfter(current, new Date())) {
          slots.push(timeStr);
        }
      } else {
        slots.push(timeStr);
      }
      current.setMinutes(current.getMinutes() + 30); // 30 min slots
    }

    return slots;
  };

  const [appointmentId, setAppointmentId] = useState<string | null>(null);

  const handleBooking = async () => {
    if (!selectedService || !selectedStaff || !selectedTime || !shop) return;
    setIsBooking(true);

    try {
      const appointmentDate = parse(selectedTime, 'HH:mm', selectedDate);
      
      const response = await api.post('/public/appointments', {
        ownerUid: shop.uid,
        clientName: clientInfo.name,
        phone: clientInfo.phone,
        serviceId: selectedService.id,
        serviceName: selectedService.name,
        staffId: selectedStaff.id,
        staffName: selectedStaff.name,
        date: appointmentDate.toISOString(),
        price: selectedService.price,
        status: 'pending'
      });

      if (response.appointmentId) {
        setAppointmentId(response.appointmentId);
      }
      setBookingSuccess(true);
    } catch (err) {
      console.error('Error creating appointment:', err);
      alert('Erro ao realizar agendamento. Tente novamente.');
    } finally {
      setIsBooking(false);
    }
  };

  const getWhatsAppLink = () => {
    if (!shop || !appointmentId) return '#';
    const message = `Olá! Gostaria de confirmar meu agendamento na ${shop.name || 'Barbearia'}.\n\n✅ Serviço: ${selectedService?.name}\n📅 Data: ${format(selectedDate, "dd/MM/yyyy")}\n⏰ Hora: ${selectedTime}\n\nID: ${appointmentId}`;
    const encodedMessage = encodeURIComponent(message);
    // Use the shop phone or a default
    const phone = shop.phone?.replace(/\D/g, '') || '';
    return `https://wa.me/55${phone}?text=${encodedMessage}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-4">
          <h2 className="text-2xl font-bold text-white">{error || 'Salão não encontrado'}</h2>
          <p className="text-zinc-400">Verifique o link e tente novamente.</p>
        </div>
      </div>
    );
  }

  if (bookingSuccess) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-zinc-900 border border-zinc-800 rounded-3xl p-8 text-center space-y-6"
        >
          <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
            <CheckCircle2 className="text-emerald-500" size={40} />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-white">Agendamento Realizado!</h2>
            <p className="text-zinc-400">Tudo pronto para o seu atendimento no {ownerProfile?.shopName || 'nosso salão'}.</p>
          </div>
          
          <div className="bg-zinc-950 rounded-2xl p-6 text-left space-y-4 border border-zinc-800">
            <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest">Resumo do Pedido</h3>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Serviço:</span>
                <span className="text-white font-medium">{selectedService?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-400">Data e Hora:</span>
                <span className="text-white font-medium uppercase text-xs">
                  {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <a 
              href={getWhatsAppLink()}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-3 w-full bg-emerald-600 text-white py-5 rounded-2xl font-bold hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-500/20"
            >
              <Phone size={20} />
              Confirmar no WhatsApp
            </a>
            
            <p className="text-[10px] text-zinc-500 px-6">
              Ao clicar no botão acima, você enviará uma mensagem de confirmação e receberá seu <strong>comprovante digital</strong> automaticamente.
            </p>

            <button 
              onClick={() => window.location.reload()}
              className="text-zinc-500 hover:text-white text-sm font-medium transition-colors pt-4"
            >
              Voltar ao início
            </button>
          </div>

          <div className="mt-6 p-4 bg-zinc-800/50 rounded-xl">
            <p className="text-xs text-zinc-400 mb-2">Indique este link para suas amigas:</p>
            <div className="flex items-center gap-2">
              <code className="text-rose-400 text-xs flex-1 truncate">sallon.dodile.com.br/agenda/{slug}</code>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`https://sallon.dodile.com.br/agenda/${slug}`);
                }}
                className="p-2 hover:bg-zinc-700 rounded-lg transition-colors"
              >
                <Copy size={14} />
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Header */}
      <header className="bg-zinc-900/50 backdrop-blur-xl border-b border-zinc-800 sticky top-0 z-50">
        <div className="max-w-3xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-rose-500 rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-lg font-bold leading-tight">{ownerProfile?.shopName || 'Salão de Beleza'}</h1>
              <div className="flex items-center gap-2 text-xs text-zinc-500">
                <MapPin size={12} />
                <span>{shop.address || 'Endereço não informado'}</span>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        {/* Progress Bar */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4].map((i) => (
            <div 
              key={i}
              className={`h-1.5 flex-1 rounded-full transition-all duration-500 ${step >= i ? 'bg-rose-500' : 'bg-zinc-800'}`}
            />
          ))}
        </div>

        {/* Custom Alert Modal */}
        <AnimatePresence>
          {showCustomAlert && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-zinc-900 border border-zinc-800 p-8 rounded-3xl shadow-2xl text-center space-y-4 max-w-xs w-full"
              >
                <div className="w-16 h-16 bg-rose-500/20 rounded-full flex items-center justify-center mx-auto text-rose-500">
                  <CheckCircle2 size={32} />
                </div>
                <p className="text-xl font-bold text-white">Elemento clicado!</p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <h2 className="text-2xl font-bold">Escolha o Serviço</h2>
                <p className="text-zinc-500">Selecione o que você deseja fazer hoje.</p>
              </div>
              <div className="grid gap-4">
                {services.map(service => (
                  <button
                    key={service.id}
                    onClick={() => {
                      setSelectedService(service);
                      triggerAlert();
                      setStep(2);
                    }}
                    className={`flex items-center justify-between p-6 rounded-3xl border-2 transition-all text-left ${
                      selectedService?.id === service.id 
                        ? 'bg-rose-500/10 border-rose-500' 
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="space-y-1">
                      <p className="font-bold text-lg">{service.name}</p>
                      <div className="flex items-center gap-3 text-sm text-zinc-500">
                        <span className="flex items-center gap-1">
                          <Clock size={14} />
                          {service.duration} min
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-rose-500">R$ {service.price.toFixed(2)}</p>
                      <ChevronRight size={20} className="text-zinc-700 ml-auto mt-2" />
                    </div>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(1)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white">
                  <ChevronLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Escolha o Profissional</h2>
                  <p className="text-zinc-500">Com quem você gostaria de agendar?</p>
                </div>
              </div>
              <div className="grid gap-4">
                {staff.map(member => (
                  <div
                    key={member.id}
                    className={`p-6 rounded-3xl border-2 transition-all text-left space-y-4 ${
                      selectedStaff?.id === member.id 
                        ? 'bg-rose-500/10 border-rose-500' 
                        : 'bg-zinc-900 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-zinc-800 rounded-2xl flex items-center justify-center overflow-hidden">
                        {member.portfolio && member.portfolio.length > 0 ? (
                          <img src={member.portfolio[0]} alt={member.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User size={32} className="text-zinc-600" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-lg">{member.name}</p>
                        <p className="text-sm text-zinc-500">Especialista</p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedStaff(member);
                          triggerAlert();
                          setStep(3);
                        }}
                        className="bg-rose-500 text-white px-4 py-2 rounded-xl font-bold text-sm hover:bg-rose-600 transition-all"
                      >
                        Selecionar
                      </button>
                    </div>

                    {member.portfolio && member.portfolio.length > 0 && (
                      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                        {member.portfolio.map((img, idx) => (
                          <img 
                            key={idx} 
                            src={img} 
                            alt={`Trabalho de ${member.name}`} 
                            className="w-20 h-20 rounded-xl object-cover border border-zinc-800 flex-shrink-0"
                            referrerPolicy="no-referrer"
                          />
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(2)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white">
                  <ChevronLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Data e Horário</h2>
                  <p className="text-zinc-500">Selecione o melhor momento para você.</p>
                </div>
              </div>

              {/* Date Selector */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                    <Calendar size={14} />
                    {format(selectedDate, 'MMMM yyyy', { locale: ptBR })}
                  </h3>
                </div>
                <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
                  {[...Array(14)].map((_, i) => {
                    const date = addDays(startOfToday(), i);
                    const isSelected = isSameDay(date, selectedDate);
                    return (
                      <button
                        key={i}
                        onClick={() => {
                          setSelectedDate(date);
                          triggerAlert();
                        }}
                        className={`flex flex-col items-center justify-center min-w-[80px] h-24 rounded-2xl border-2 transition-all ${
                          isSelected 
                            ? 'bg-rose-500 border-rose-500 text-white shadow-lg shadow-rose-500/20' 
                            : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                        }`}
                      >
                        <span className="text-[10px] font-bold uppercase tracking-widest mb-1">
                          {format(date, 'EEE', { locale: ptBR })}
                        </span>
                        <span className="text-xl font-bold">{format(date, 'dd')}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time Slots */}
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={14} />
                  Horários Disponíveis
                </h3>
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                  {generateTimeSlots().map(time => (
                    <button
                      key={time}
                      onClick={() => {
                        setSelectedTime(time);
                        triggerAlert();
                        setStep(4);
                      }}
                      className={`py-4 rounded-2xl border-2 font-bold transition-all ${
                        selectedTime === time 
                          ? 'bg-rose-500 border-rose-500 text-white' 
                          : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                      }`}
                    >
                      {time}
                    </button>
                  ))}
                  {generateTimeSlots().length === 0 && (
                    <div className="col-span-full py-10 text-center text-zinc-500 bg-zinc-900/50 rounded-3xl border border-dashed border-zinc-800">
                      Nenhum horário disponível para este dia.
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <button onClick={() => setStep(3)} className="p-2 bg-zinc-900 rounded-xl text-zinc-400 hover:text-white">
                  <ChevronLeft size={24} />
                </button>
                <div className="space-y-1">
                  <h2 className="text-2xl font-bold">Suas Informações</h2>
                  <p className="text-zinc-500">Quase lá! Só precisamos de alguns dados.</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">Nome Completo</label>
                  <input 
                    type="text"
                    placeholder="Como devemos te chamar?"
                    value={clientInfo.name}
                    onChange={e => setClientInfo({ ...clientInfo, name: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-rose-500 outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-zinc-400">WhatsApp</label>
                  <input 
                    type="tel"
                    placeholder="(00) 00000-0000"
                    value={clientInfo.phone}
                    onChange={e => setClientInfo({ ...clientInfo, phone: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-2xl px-6 py-4 text-white focus:border-rose-500 outline-none transition-all"
                  />
                </div>

                {/* Summary Card */}
                <div className="bg-rose-500/5 border border-rose-500/20 rounded-3xl p-6 space-y-4">
                  <h3 className="font-bold flex items-center gap-2">
                    <Calendar size={18} className="text-rose-500" />
                    Resumo do Agendamento
                  </h3>
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Serviço:</span>
                      <span className="text-white font-medium">{selectedService?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Profissional:</span>
                      <span className="text-white font-medium">{selectedStaff?.name}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-500">Data e Hora:</span>
                      <span className="text-white font-medium">
                        {format(selectedDate, "dd 'de' MMMM", { locale: ptBR })} às {selectedTime}
                      </span>
                    </div>
                    <div className="pt-3 border-t border-zinc-800 flex justify-between items-center">
                      <span className="text-zinc-500">Total:</span>
                      <span className="text-2xl font-bold text-rose-500">R$ {selectedService?.price.toFixed(2)}</span>
                    </div>
                  </div>
                </div>

                <button 
                  onClick={handleBooking}
                  disabled={!clientInfo.name || !clientInfo.phone || isBooking}
                  className="w-full bg-rose-500 text-white py-5 rounded-2xl font-bold hover:bg-rose-600 transition-all shadow-lg shadow-rose-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isBooking ? 'Processando...' : 'Confirmar Agendamento'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Info */}
      <footer className="max-w-3xl mx-auto px-6 py-10 border-t border-zinc-900 text-center space-y-4">
        <div className="flex items-center justify-center gap-6 text-zinc-500">
          <div className="flex items-center gap-2">
            <Phone size={14} />
            <span className="text-xs">{shop.whatsappConfig?.enabled ? 'WhatsApp Ativo' : 'Contato via Telefone'}</span>
          </div>
        </div>
        <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-bold italic">
          Powered by <span className="text-rose-500/50">Salão Pro Manager</span> SaaS
        </p>
      </footer>
    </div>
  );
}
