import React from 'react';
import { 
  BookOpen, 
  Calendar as CalendarIcon, 
  Users as UsersIcon, 
  Sparkles, 
  DollarSign, 
  Package, 
  MessageSquare, 
  ChevronRight,
  PlayCircle,
  CheckCircle2
} from 'lucide-react';
import { motion } from 'motion/react';

interface HelpGuideProps {
  onNavigate: (tab: string) => void;
}

export default function HelpGuide({ onNavigate }: HelpGuideProps) {
  const steps = [
    {
      title: '1. Configure seus Serviços',
      description: 'Comece cadastrando os serviços que seu salão oferece, definindo preços e duração.',
      icon: <Sparkles className="text-rose-500" size={24} />,
      tab: 'services'
    },
    {
      title: '2. Cadastre sua Equipe',
      description: 'Adicione os profissionais que trabalham com você para gerenciar as agendas individuais.',
      icon: <UsersIcon className="text-blue-500" size={24} />,
      tab: 'settings'
    },
    {
      title: '3. Organize seus Clientes',
      description: 'Mantenha uma base de dados dos seus clientes para facilitar o agendamento e o contato via WhatsApp.',
      icon: <UsersIcon className="text-emerald-500" size={24} />,
      tab: 'clients'
    },
    {
      title: '4. Realize Agendamentos',
      description: 'Use o calendário para marcar horários. Você pode visualizar por dia, semana ou mês.',
      icon: <CalendarIcon className="text-rose-500" size={24} />,
      tab: 'appointments'
    },
    {
      title: '5. Controle suas Finanças',
      description: 'Ao concluir um agendamento, o sistema registra automaticamente a receita. Adicione despesas manualmente.',
      icon: <DollarSign className="text-rose-500" size={24} />,
      tab: 'finance'
    }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8 pb-12">
      <div className="text-center space-y-4">
        <div className="w-16 h-16 bg-rose-500/10 rounded-2xl flex items-center justify-center mx-auto">
          <BookOpen className="text-rose-500" size={32} />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900">Guia de Uso do Sistema</h2>
        <p className="text-zinc-500 max-w-lg mx-auto">
          Siga este passo a passo para configurar seu salão e começar a aproveitar todos os recursos do Salão Pro Manager.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {steps.map((step, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => onNavigate(step.tab)}
            className="bg-white p-6 rounded-[2rem] border border-zinc-200 shadow-sm hover:border-rose-500/30 transition-all group cursor-pointer"
          >
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-zinc-50 rounded-2xl flex items-center justify-center flex-shrink-0 group-hover:bg-rose-500/10 transition-colors">
                {step.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-bold text-zinc-900 mb-1">{step.title}</h3>
                <p className="text-zinc-500 text-sm leading-relaxed">{step.description}</p>
              </div>
              <div className="hidden sm:flex items-center gap-2 text-rose-600 font-bold text-sm">
                Ir para módulo
                <ChevronRight size={16} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
        <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <MessageSquare className="text-rose-500" />
              WhatsApp Automático
            </h3>
            <p className="text-zinc-400 text-sm mb-6 leading-relaxed">
              O sistema envia confirmações automáticas para seus clientes. Certifique-se de cadastrar o número de telefone com o DDD correto.
            </p>
            <div className="flex items-center gap-2 text-xs font-bold text-rose-500 uppercase tracking-widest">
              <CheckCircle2 size={14} />
              Recurso Ativo
            </div>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <MessageSquare size={120} />
          </div>
        </div>

        <div className="bg-rose-500 p-8 rounded-[2.5rem] text-zinc-900 relative overflow-hidden">
          <div className="relative z-10">
            <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Package />
              Gestão de Estoque
            </h3>
            <p className="text-zinc-800/70 text-sm mb-6 leading-relaxed">
              Mantenha o controle de seus produtos e receba alertas quando o estoque estiver baixo. Evite faltas inesperadas.
            </p>
            <button 
              onClick={() => onNavigate('inventory')}
              className="bg-zinc-900 text-white px-6 py-2 rounded-xl text-sm font-bold hover:bg-zinc-800 transition-colors"
            >
              Configurar Agora
            </button>
          </div>
          <div className="absolute -bottom-4 -right-4 opacity-10">
            <Package size={120} />
          </div>
        </div>
      </div>

      <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 text-center space-y-4">
        <h3 className="text-xl font-bold text-zinc-900">Ainda precisa de ajuda?</h3>
        <p className="text-zinc-500 text-sm">
          Nossa equipe de suporte está disponível de segunda a sexta, das 09h às 18h.
        </p>
        <button className="bg-emerald-500 text-white px-8 py-3 rounded-2xl font-bold hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
          Falar com Suporte no WhatsApp
        </button>
      </div>
    </div>
  );
}
