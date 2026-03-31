import React, { useState, useEffect } from 'react';
import { Check, X, Star, Zap, Crown, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Plan, Subscription } from '../types';

interface PricingProps {
  onSelectPlan: (plan: Plan, cycle: 'monthly' | 'yearly') => void;
}

export default function Pricing({ onSelectPlan }: PricingProps) {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [plansData, subData] = await Promise.all([
          api.get('/public/plans'),
          user ? api.get('/subscriptions/me').catch(() => null) : Promise.resolve(null)
        ]);
        const filteredPlans = plansData
          .map((p: Plan) => {
            if (p.slug === 'silver') return { ...p, name: 'Prata' };
            if (p.slug === 'gold') return { ...p, name: 'Ouro' };
            return p;
          })
          .sort((a: Plan, b: Plan) => a.priceMonthly - b.priceMonthly);
          
        setPlans(filteredPlans);
        setSubscription(subData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching pricing data:', error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const handleSubscribe = (plan: Plan) => {
    onSelectPlan(plan, billingCycle);
  };

  if (loading) return <div className="flex items-center justify-center h-64">Carregando planos...</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="text-center mb-16">
        <motion.h2 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-4xl font-bold text-zinc-900 mb-4"
        >
          Escolha o plano ideal para seu salão
        </motion.h2>
        <p className="text-zinc-500 text-lg mb-8">Potencialize sua gestão com as ferramentas certas.</p>
        
        <div className="flex items-center justify-center gap-4">
          <span className={`text-sm font-medium ${billingCycle === 'monthly' ? 'text-zinc-900' : 'text-zinc-500'}`}>Mensal</span>
          <button 
            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
            className="w-14 h-7 bg-zinc-200 rounded-full p-1 relative transition-colors"
          >
            <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${billingCycle === 'yearly' ? 'translate-x-7' : 'translate-x-0'}`} />
          </button>
          <span className={`text-sm font-medium ${billingCycle === 'yearly' ? 'text-zinc-900' : 'text-zinc-500'}`}>
            Anual <span className="text-emerald-500 text-xs font-bold ml-1">(até -23%)</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {plans.map((plan) => {
          const isCurrent = subscription?.planId === plan.id;
          const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly / 12;

          return (
            <motion.div
              key={plan.id}
              whileHover={{ y: -10 }}
              className={`relative bg-white rounded-3xl border-2 p-8 transition-all ${
                plan.slug === 'silver' ? 'border-rose-500 shadow-xl shadow-rose-500/10' : 'border-zinc-100'
              }`}
            >
              {plan.slug === 'silver' && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-rose-500 text-zinc-900 text-xs font-bold px-4 py-1 rounded-full uppercase tracking-wider">
                  Mais Popular
                </div>
              )}

              <div className="mb-8">
                <div className="flex items-center gap-2 mb-2">
                  {plan.slug === 'bronze' && <Zap size={20} className="text-zinc-400" />}
                  {plan.slug === 'silver' && <Star size={20} className="text-rose-500" />}
                  {plan.slug === 'gold' && <Crown size={20} className="text-rose-600" />}
                  <h3 className="text-xl font-bold text-zinc-900">{plan.name}</h3>
                  {isCurrent && (
                    <div className="flex items-center gap-1 ml-auto px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                      <ShieldCheck size={10} />
                      Seu Plano
                    </div>
                  )}
                </div>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-zinc-900">R$ {price.toFixed(2)}</span>
                  <span className="text-zinc-500 text-sm">/mês</span>
                </div>
                {billingCycle === 'yearly' && (
                  <p className="text-xs text-emerald-600 font-medium mt-1">Cobrado anualmente (R$ {plan.priceYearly.toFixed(2)})</p>
                )}
              </div>

              <ul className="space-y-4 mb-10">
                <FeatureItem 
                  label={plan.features.staffLimit === null ? 'Profissionais Ilimitados' : `Até ${plan.features.staffLimit} Profissional${plan.features.staffLimit > 1 ? 'ais' : ''}`} 
                  included={true} 
                />
                <FeatureItem label="Gestão de Agendamentos" included={true} />
                <FeatureItem label="Controle Financeiro" included={true} />
                <FeatureItem label="Gestão de Estoque" included={plan.features.inventory} />
                <FeatureItem label="Relatórios Avançados" included={plan.features.reports} />
                <FeatureItem label="WhatsApp Automático" included={plan.features.whatsapp} />
              </ul>

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrent}
                className={`w-full py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${
                  isCurrent 
                    ? 'bg-zinc-100 text-zinc-400 cursor-default' 
                    : plan.slug === 'silver'
                      ? 'bg-rose-500 text-zinc-900 hover:bg-rose-600 shadow-lg shadow-rose-500/20'
                      : 'bg-zinc-900 text-white hover:bg-zinc-800'
                }`}
              >
                {isCurrent ? 'Plano Atual' : 'Cadastre-se Agora'}
                {!isCurrent && <ArrowRight size={18} />}
              </button>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-20 bg-zinc-50 rounded-3xl p-10 border border-zinc-100 text-center">
        <h4 className="text-2xl font-bold text-zinc-900 mb-4">Precisa de algo personalizado?</h4>
        <p className="text-zinc-500 mb-8 max-w-2xl mx-auto">
          Temos soluções especiais para redes de salões e franquias. Entre em contato com nosso time de especialistas.
        </p>
        <button className="bg-white border border-zinc-200 text-zinc-900 px-8 py-3 rounded-2xl font-bold hover:bg-zinc-100 transition-colors">
          Falar com Consultor
        </button>
      </div>
    </div>
  );
}

function FeatureItem({ label, included }: { label: string, included: boolean }) {
  return (
    <li className={`flex items-center gap-3 text-sm ${included ? 'text-zinc-700' : 'text-zinc-400'}`}>
      {included ? (
        <div className="w-5 h-5 bg-emerald-100 rounded-full flex items-center justify-center">
          <Check size={12} className="text-emerald-600" />
        </div>
      ) : (
        <div className="w-5 h-5 bg-zinc-100 rounded-full flex items-center justify-center">
          <X size={12} className="text-zinc-400" />
        </div>
      )}
      <span className={included ? '' : 'line-through opacity-50'}>{label}</span>
    </li>
  );
}
