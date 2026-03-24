import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  Sparkles, 
  Users, 
  Calendar, 
  DollarSign,
  ArrowRight,
  PartyPopper
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface OnboardingChecklistProps {
  onNavigate: (tab: string) => void;
}

export default function OnboardingChecklist({ onNavigate }: OnboardingChecklistProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState({
    hasServices: false,
    hasStaff: false,
    hasClients: false,
    hasAppointments: false,
    hasFinance: false
  });
  const [loading, setLoading] = useState(true);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!user) return;

    const checkProgress = async () => {
      try {
        const [services, staff, clients, appointments, transactions] = await Promise.all([
          api.get('/services'),
          api.get('/staff'),
          api.get('/clients'),
          api.get('/appointments'),
          api.get('/transactions')
        ]);

        setStats({
          hasServices: services.length > 0,
          hasStaff: staff.length > 0,
          hasClients: clients.length > 0,
          hasAppointments: appointments.length > 0,
          hasFinance: transactions.length > 0
        });
      } catch (err) {
        console.error('Failed to check onboarding progress:', err);
      } finally {
        setLoading(false);
      }
    };

    const isDismissed = localStorage.getItem('onboarding_dismissed') === 'true';
    setDismissed(isDismissed);
    
    checkProgress();
  }, [user]);

  const steps = [
    {
      id: 'services',
      title: 'Configure seus Serviços',
      description: 'Cadastre o que você oferece',
      icon: <Sparkles size={18} />,
      completed: stats.hasServices,
      tab: 'services'
    },
    {
      id: 'staff',
      title: 'Cadastre sua Equipe',
      description: 'Adicione seus profissionais',
      icon: <Users size={18} />,
      completed: stats.hasStaff,
      tab: 'settings'
    },
    {
      id: 'clients',
      title: 'Organize seus Clientes',
      description: 'Importe sua base de contatos',
      icon: <Users size={18} />,
      completed: stats.hasClients,
      tab: 'clients'
    },
    {
      id: 'appointments',
      title: 'Primeiro Agendamento',
      description: 'Teste o fluxo de reserva',
      icon: <Calendar size={18} />,
      completed: stats.hasAppointments,
      tab: 'appointments'
    }
  ];

  const completedCount = steps.filter(s => s.completed).length;
  const progress = (completedCount / steps.length) * 100;
  const isFullyCompleted = completedCount === steps.length;

  if (loading || (dismissed && !isFullyCompleted)) return null;

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden mb-8"
    >
      <div className="p-8 flex flex-col md:flex-row gap-8 items-center">
        <div className="flex-1 space-y-4 w-full">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-zinc-900 flex items-center gap-2">
                {isFullyCompleted ? 'Tudo pronto! 🚀' : 'Vamos começar?'}
                {isFullyCompleted && <PartyPopper className="text-rose-500" />}
              </h2>
              <p className="text-zinc-500 text-sm">
                {isFullyCompleted 
                  ? 'Seu salão está configurado e pronto para crescer.' 
                  : 'Siga os passos abaixo para configurar seu salão em minutos.'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-2xl font-black text-rose-500">{Math.round(progress)}%</span>
              <p className="text-[10px] uppercase tracking-widest font-bold text-zinc-400">Concluído</p>
            </div>
          </div>

          <div className="h-2 bg-zinc-100 rounded-full overflow-hidden">
            <motion.div 
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              className="h-full bg-rose-500"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
            {steps.map((step) => (
              <button
                key={step.id}
                onClick={() => onNavigate(step.tab)}
                className={`
                  p-4 rounded-2xl border transition-all text-left group
                  ${step.completed 
                    ? 'bg-emerald-50 border-emerald-100' 
                    : 'bg-white border-zinc-100 hover:border-rose-200 hover:shadow-md'}
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={`
                    p-2 rounded-xl 
                    ${step.completed ? 'bg-emerald-500 text-white' : 'bg-zinc-50 text-zinc-400 group-hover:bg-rose-50 group-hover:text-rose-500'}
                  `}>
                    {step.icon}
                  </div>
                  {step.completed ? (
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  ) : (
                    <Circle size={16} className="text-zinc-200 group-hover:text-rose-200" />
                  )}
                </div>
                <h3 className={`text-sm font-bold ${step.completed ? 'text-emerald-900' : 'text-zinc-900'}`}>
                  {step.title}
                </h3>
                <p className={`text-[11px] ${step.completed ? 'text-emerald-600' : 'text-zinc-400'}`}>
                  {step.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {!isFullyCompleted && (
          <div className="md:w-64 w-full bg-zinc-50 p-6 rounded-3xl flex flex-col items-center text-center space-y-4 border border-zinc-100">
            <div className="w-12 h-12 bg-rose-500 text-white rounded-2xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles size={24} />
            </div>
            <div>
              <h4 className="font-bold text-zinc-900 text-sm">Treinamento Rápido</h4>
              <p className="text-zinc-500 text-[11px] leading-relaxed">
                Aprenda a usar o sistema em menos de 5 minutos.
              </p>
            </div>
            <button 
              onClick={() => onNavigate('help')}
              className="w-full bg-white text-zinc-900 border border-zinc-200 py-2 rounded-xl text-xs font-bold hover:bg-zinc-100 transition-all flex items-center justify-center gap-2"
            >
              Ver Guia Completo
              <ArrowRight size={14} />
            </button>
            <button 
              onClick={() => {
                setDismissed(true);
                localStorage.setItem('onboarding_dismissed', 'true');
              }}
              className="text-[10px] text-zinc-400 hover:text-zinc-600 font-medium"
            >
              Ocultar por enquanto
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );
}
