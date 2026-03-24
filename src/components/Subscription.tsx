import React from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';
import { useSubscription } from '../hooks/useSubscription';

export default function Subscription() {
  const { plans, subscription, loading } = useSubscription();

  if (loading) return <div className="flex items-center justify-center h-64">Carregando planos...</div>;

  const currentPlan = plans.find(p => p.id === subscription?.planId);
  const daysRemaining = subscription?.currentPeriodEnd 
    ? Math.ceil((new Date(subscription.currentPeriodEnd).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <div className="space-y-10 pb-20">
      {/* Current Status */}
      <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-500 rounded-full text-xs font-bold uppercase tracking-wider">
              <Zap size={14} />
              {subscription?.status === 'active' ? 'Assinatura Ativa' : 'Atenção'}
            </div>
            <h2 className="text-3xl font-bold">
              {daysRemaining > 0 
                ? `Você tem ${daysRemaining} dias restantes` 
                : 'Sua assinatura expirou'}
            </h2>
            <p className="text-zinc-400 max-w-md">
              {subscription?.status === 'active' 
                ? `Você está no plano ${currentPlan?.name || 'Básico'}. Mantenha sua assinatura em dia para continuar usando todos os recursos.`
                : 'Sua assinatura precisa de atenção. Ative um plano para continuar usando todos os recursos.'}
            </p>
          </div>
          <button className="bg-rose-500 text-zinc-900 px-8 py-4 rounded-2xl font-bold hover:bg-rose-600 transition-all flex items-center gap-2 group shadow-lg shadow-rose-500/20">
            {subscription?.status === 'active' ? 'Mudar de Plano' : 'Ativar Assinatura'}
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = subscription?.planId === plan.id;
          return (
            <div 
              key={plan.id}
              className={`
                relative bg-white rounded-3xl p-8 border transition-all duration-300
                ${plan.slug === 'silver' 
                  ? 'border-rose-500 shadow-xl shadow-rose-500/5 scale-105 z-10' 
                  : 'border-zinc-200 hover:border-zinc-300'}
              `}
            >
              {plan.slug === 'silver' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-zinc-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                  Recomendado
                </div>
              )}
              
              <div className="space-y-6">
                <div>
                  <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
                  <div className="mt-4 flex items-baseline gap-1">
                    <span className="text-sm font-medium text-zinc-500">R$</span>
                    <span className="text-4xl font-bold text-zinc-900">{plan.priceMonthly.toFixed(2)}</span>
                    <span className="text-sm font-medium text-zinc-500">/mês</span>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-zinc-600">
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">
                      {plan.features.staffLimit === null ? 'Profissionais Ilimitados' : `Até ${plan.features.staffLimit} Profissional${plan.features.staffLimit > 1 ? 'ais' : ''}`}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">Agendamento online</span>
                  </div>
                  <div className="flex items-center gap-3 text-zinc-600">
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">Gestão de clientes</span>
                  </div>
                  {plan.features.inventory && (
                    <div className="flex items-center gap-3 text-zinc-600">
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-sm">Gestão de Estoque</span>
                    </div>
                  )}
                  {plan.features.reports && (
                    <div className="flex items-center gap-3 text-zinc-600">
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-sm">Relatórios Avançados</span>
                    </div>
                  )}
                  {plan.features.whatsapp && (
                    <div className="flex items-center gap-3 text-zinc-600">
                      <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                      <span className="text-sm">WhatsApp Automático</span>
                    </div>
                  )}
                </div>

                <button 
                  disabled={isCurrent}
                  className={`
                    w-full py-4 rounded-2xl font-bold transition-all
                    ${isCurrent
                      ? 'bg-zinc-100 text-zinc-400 cursor-default'
                      : plan.slug === 'silver' 
                        ? 'bg-rose-500 text-zinc-900 hover:bg-rose-600' 
                        : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}
                  `}
                >
                  {isCurrent ? 'Plano Atual' : 'Escolher Plano'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Security Info */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 py-10 border-t border-zinc-200">
        <div className="flex items-center gap-3 text-zinc-500">
          <ShieldCheck size={24} className="text-zinc-400" />
          <span className="text-sm">Pagamento 100% Seguro</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-500">
          <AlertCircle size={24} className="text-zinc-400" />
          <span className="text-sm">Cancele quando quiser</span>
        </div>
        <div className="flex items-center gap-3 text-zinc-500">
          <CreditCard size={24} className="text-zinc-400" />
          <span className="text-sm">Aceitamos Cartão e Pix</span>
        </div>
      </div>
    </div>
  );
}
