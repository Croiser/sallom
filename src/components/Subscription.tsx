import React from 'react';
import { 
  CreditCard, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function Subscription() {
  const plans = [
    {
      name: 'Básico',
      price: '49,90',
      features: ['Até 2 profissionais', 'Agendamento online', 'Gestão de clientes', 'Financeiro básico'],
      recommended: false
    },
    {
      name: 'Pro',
      price: '89,90',
      features: ['Profissionais ilimitados', 'WhatsApp Automático', 'Relatórios avançados', 'Suporte prioritário'],
      recommended: true
    },
    {
      name: 'Premium',
      price: '149,90',
      features: ['Tudo do Pro', 'App personalizado (PWA)', 'Marketing automatizado', 'Consultoria de gestão'],
      recommended: false
    }
  ];

  return (
    <div className="space-y-10 pb-20">
      {/* Current Status */}
      <div className="bg-zinc-900 rounded-3xl p-8 text-white relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-8">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-rose-500/20 text-rose-500 rounded-full text-xs font-bold uppercase tracking-wider">
              <Zap size={14} />
              Período de Teste
            </div>
            <h2 className="text-3xl font-bold">Você tem 7 dias restantes</h2>
            <p className="text-zinc-400 max-w-md">
              Aproveite todos os recursos do plano Pro durante seu período de teste. 
              Ative sua assinatura agora para não perder o acesso.
            </p>
          </div>
          <button className="bg-rose-500 text-zinc-900 px-8 py-4 rounded-2xl font-bold hover:bg-rose-600 transition-all flex items-center gap-2 group shadow-lg shadow-rose-500/20">
            Ativar Assinatura
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
        
        {/* Background Decoration */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-rose-500/10 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-rose-500/5 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />
      </div>

      {/* Plans Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {plans.map((plan) => (
          <div 
            key={plan.name}
            className={`
              relative bg-white rounded-3xl p-8 border transition-all duration-300
              ${plan.recommended 
                ? 'border-rose-500 shadow-xl shadow-rose-500/5 scale-105 z-10' 
                : 'border-zinc-200 hover:border-zinc-300'}
            `}
          >
            {plan.recommended && (
              <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-zinc-900 px-4 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                Recomendado
              </div>
            )}
            
            <div className="space-y-6">
              <div>
                <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-sm font-medium text-zinc-500">R$</span>
                  <span className="text-4xl font-bold text-zinc-900">{plan.price}</span>
                  <span className="text-sm font-medium text-zinc-500">/mês</span>
                </div>
              </div>

              <div className="space-y-4">
                {plan.features.map((feature) => (
                  <div key={feature} className="flex items-center gap-3 text-zinc-600">
                    <CheckCircle2 size={18} className="text-emerald-500 flex-shrink-0" />
                    <span className="text-sm">{feature}</span>
                  </div>
                ))}
              </div>

              <button className={`
                w-full py-4 rounded-2xl font-bold transition-all
                ${plan.recommended 
                  ? 'bg-rose-500 text-zinc-900 hover:bg-rose-600' 
                  : 'bg-zinc-100 text-zinc-900 hover:bg-zinc-200'}
              `}>
                Escolher Plano
              </button>
            </div>
          </div>
        ))}
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
