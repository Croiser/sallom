import React, { useState, useEffect } from 'react';
import { 
  Check, 
  ArrowLeft, 
  CreditCard, 
  QrCode, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Copy, 
  CheckCircle2,
  Loader2,
  Zap,
  Star,
  Crown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Plan } from '../types';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

import { asaasService } from '../services/asaasService';

interface CheckoutProps {
  plan: Plan;
  billingCycle: 'monthly' | 'yearly';
  onBack: () => void;
  onSuccess: () => void;
}

export default function Checkout({ plan, billingCycle, onBack, onSuccess }: CheckoutProps) {
  const { user } = useAuth();
  const [paymentMethod, setPaymentMethod] = useState<'pix' | 'card' | 'boleto'>('pix');
  const [step, setStep] = useState<'billing' | 'payment' | 'success'>('billing');
  const [loading, setLoading] = useState(false);
  const [pixCode, setPixCode] = useState<string | null>(null);
  const [pixQrCode, setPixQrCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  
  // Form State
  const [billingInfo, setBillingInfo] = useState({
    cpfCnpj: '',
    phone: '',
    name: '',
    email: ''
  });

  useEffect(() => {
    if (!user) return;
    setBillingInfo(prev => ({ 
      ...prev, 
      name: user.name || '',
      email: user.email || '' 
    }));
  }, [user]);

  const price = billingCycle === 'monthly' ? plan.priceMonthly : plan.priceYearly;
  const formattedPrice = price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  const validateCpfCnpj = (val: string) => {
    const clean = val.replace(/\D/g, '');
    return clean.length === 11 || clean.length === 14;
  };

  const validatePhone = (val: string) => {
    const clean = val.replace(/\D/g, '');
    return clean.length >= 10 && clean.length <= 11;
  };

  const handleNextStep = () => {
    if (step === 'billing') {
      if (!billingInfo.cpfCnpj || !billingInfo.phone || !billingInfo.name) {
        alert('Por favor, preencha todos os dados de faturamento.');
        return;
      }

      if (!validateCpfCnpj(billingInfo.cpfCnpj)) {
        alert('Por favor, insira um CPF (11 dígitos) ou CNPJ (14 dígitos) válido.');
        return;
      }

      if (!validatePhone(billingInfo.phone)) {
        alert('Por favor, insira um telefone válido com DDD (10 ou 11 dígitos).');
        return;
      }

      setStep('payment');
    }
  };

  const [cardInfo, setCardInfo] = useState({
    number: '',
    expiry: '',
    cvv: '',
    holderName: ''
  });

  const handlePayment = async () => {
    setLoading(true);
    try {
      if (paymentMethod === 'pix') {
        const response = await asaasService.createPixPayment(price, billingInfo, plan.id, billingCycle);
        setPixCode(response.pixCopyPaste || null);
        // If it returns a base64 image, we might want to use it
        if (response.pixQrCode) {
          setPixQrCode(`data:image/png;base64,${response.pixQrCode}`);
        }
      } else if (paymentMethod === 'card') {
        const [expiryMonth, expiryYear] = cardInfo.expiry.split('/');
        const cardData = {
          holderName: cardInfo.holderName,
          number: cardInfo.number.replace(/\s/g, ''),
          expiryMonth: expiryMonth,
          expiryYear: '20' + expiryYear,
          ccv: cardInfo.cvv
        };
        const holderData = {
          name: cardInfo.holderName,
          email: billingInfo.email || '', // need to make sure we have email
          cpfCnpj: billingInfo.cpfCnpj.replace(/\D/g, ''),
          postalCode: '00000000', // Mocking postal code for now
          addressNumber: '0',
          phone: billingInfo.phone.replace(/\D/g, '')
        };
        const response = await asaasService.createCardPayment(price, billingInfo, cardData, holderData, plan.id, billingCycle);
        if (response.status === 'CONFIRMED' || response.status === 'RECEIVED') {
          setStep('success');
        }
      } else {
        // Boleto simulation
        await new Promise(resolve => setTimeout(resolve, 1500));
        alert('Boleto gerado com sucesso! Verifique seu e-mail.');
        await completeSubscription();
        setStep('success');
      }
    } catch (error) {
      console.error('Payment error:', error);
      alert('Erro ao processar pagamento. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const completeSubscription = async () => {
    if (!user) return;
    try {
      const startDate = new Date();
      const endDate = new Date();
      if (billingCycle === 'monthly') {
        endDate.setMonth(startDate.getMonth() + 1);
      } else {
        endDate.setFullYear(startDate.getFullYear() + 1);
      }

      await api.post('/subscriptions', {
        planId: plan.id,
        billingCycle,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      setStep('success');
    } catch (err) {
      console.error('Error completing subscription:', err);
      alert('Erro ao concluir assinatura.');
    }
  };

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (pixCode && step === 'payment') {
      interval = setInterval(async () => {
        try {
          const status = await asaasService.checkPaymentStatus('');
          if (status === 'CONFIRMED') {
            setStep('success');
            clearInterval(interval);
          }
        } catch (err) {
          console.error('Error polling payment status:', err);
        }
      }, 5000);
    }
    return () => clearInterval(interval);
  }, [pixCode, step]);

  const copyPix = () => {
    if (pixCode) {
      navigator.clipboard.writeText(pixCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (step === 'success') {
    return (
      <div className="max-w-md mx-auto py-20 text-center">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6"
        >
          <CheckCircle2 size={40} className="text-emerald-600" />
        </motion.div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-2">Assinatura Confirmada!</h2>
        <p className="text-zinc-500 mb-8">Seu plano {plan.name} já está ativo. Aproveite todos os recursos!</p>
        <button
          onClick={onSuccess}
          className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all"
        >
          Ir para o Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <button 
        onClick={onBack}
        className="flex items-center gap-2 text-zinc-500 hover:text-zinc-900 mb-8 transition-colors group"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
        Voltar para planos
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Left Column: Form */}
        <div className="lg:col-span-2 space-y-8">
          {/* Progress Bar */}
          <div className="flex items-center gap-4 mb-8">
            <div className={`flex items-center gap-2 ${step === 'billing' ? 'text-rose-600' : 'text-emerald-600'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'billing' ? 'bg-rose-100' : 'bg-emerald-100'}`}>
                {step === 'billing' ? '1' : <Check size={16} />}
              </div>
              <span className="font-bold text-sm">Dados</span>
            </div>
            <div className="flex-1 h-px bg-zinc-200" />
            <div className={`flex items-center gap-2 ${step === 'payment' ? 'text-rose-600' : 'text-zinc-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${step === 'payment' ? 'bg-rose-100' : 'bg-zinc-100'}`}>
                2
              </div>
              <span className="font-bold text-sm">Pagamento</span>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {step === 'billing' ? (
              <motion.div
                key="billing"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-6"
              >
                <h3 className="text-xl font-bold text-zinc-900">Dados de Faturamento</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Nome Completo</label>
                    <input 
                      type="text"
                      value={billingInfo.name}
                      onChange={(e) => setBillingInfo({...billingInfo, name: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">E-mail</label>
                    <input 
                      type="email"
                      value={billingInfo.email}
                      onChange={(e) => setBillingInfo({...billingInfo, email: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                      placeholder="seu@email.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">CPF ou CNPJ</label>
                    <input 
                      type="text"
                      value={billingInfo.cpfCnpj}
                      onChange={(e) => setBillingInfo({...billingInfo, cpfCnpj: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                      placeholder="000.000.000-00"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-zinc-700">Telefone</label>
                    <input 
                      type="tel"
                      value={billingInfo.phone}
                      onChange={(e) => setBillingInfo({...billingInfo, phone: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl focus:ring-2 focus:ring-rose-500/20 outline-none transition-all"
                      placeholder="(00) 00000-0000"
                    />
                  </div>
                </div>
                <button
                  onClick={handleNextStep}
                  className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all mt-4"
                >
                  Continuar para Pagamento
                </button>
              </motion.div>
            ) : (
              <motion.div
                key="payment"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-100 shadow-sm space-y-8">
                  <h3 className="text-xl font-bold text-zinc-900">Forma de Pagamento</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <PaymentMethodButton 
                      active={paymentMethod === 'pix'} 
                      onClick={() => setPaymentMethod('pix')}
                      icon={<QrCode size={24} />}
                      label="Pix"
                    />
                    <PaymentMethodButton 
                      active={paymentMethod === 'card'} 
                      onClick={() => setPaymentMethod('card')}
                      icon={<CreditCard size={24} />}
                      label="Cartão"
                    />
                    <PaymentMethodButton 
                      active={paymentMethod === 'boleto'} 
                      onClick={() => setPaymentMethod('boleto')}
                      icon={<FileText size={24} />}
                      label="Boleto"
                    />
                  </div>

                  {paymentMethod === 'card' && (
                    <div className="space-y-4 pt-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Nome no Cartão</label>
                        <input 
                          type="text" 
                          value={cardInfo.holderName}
                          onChange={(e) => setCardInfo({...cardInfo, holderName: e.target.value})}
                          className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" 
                          placeholder="Como está no cartão" 
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-zinc-700">Número do Cartão</label>
                        <input 
                          type="text" 
                          value={cardInfo.number}
                          onChange={(e) => setCardInfo({...cardInfo, number: e.target.value})}
                          className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" 
                          placeholder="0000 0000 0000 0000" 
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-700">Validade</label>
                          <input 
                            type="text" 
                            value={cardInfo.expiry}
                            onChange={(e) => setCardInfo({...cardInfo, expiry: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" 
                            placeholder="MM/AA" 
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-zinc-700">CVV</label>
                          <input 
                            type="text" 
                            value={cardInfo.cvv}
                            onChange={(e) => setCardInfo({...cardInfo, cvv: e.target.value})}
                            className="w-full bg-zinc-50 border border-zinc-200 px-4 py-3 rounded-xl outline-none" 
                            placeholder="000" 
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {pixCode ? (
                    <div className="bg-zinc-50 p-8 rounded-3xl border border-zinc-200 text-center space-y-6">
                      <div className="bg-white p-4 rounded-2xl inline-block shadow-sm border border-zinc-100">
                        <img 
                          src={pixQrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pixCode)}`} 
                          alt="Pix QR Code" 
                          className="w-48 h-48"
                        />
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm text-zinc-500">Escaneie o código acima ou copie o código abaixo</p>
                        <button
                          onClick={copyPix}
                          className="w-full flex items-center justify-center gap-2 bg-white border border-zinc-200 py-3 rounded-xl text-sm font-bold hover:bg-zinc-100 transition-all"
                        >
                          {copied ? <CheckCircle2 size={18} className="text-emerald-500" /> : <Copy size={18} />}
                          {copied ? 'Copiado!' : 'Copiar Código Pix'}
                        </button>
                        <div className="flex items-center justify-center gap-2 text-xs text-zinc-400">
                          <Clock size={14} />
                          Expira em 30:00
                        </div>
                      </div>
                      <button
                        onClick={completeSubscription}
                        className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-bold hover:bg-emerald-600 transition-all"
                      >
                        Já realizei o pagamento
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={handlePayment}
                      disabled={loading}
                      className="w-full bg-zinc-900 text-white py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all flex items-center justify-center gap-2"
                    >
                      {loading ? <Loader2 className="animate-spin" size={20} /> : <ShieldCheck size={20} />}
                      {loading ? 'Processando...' : `Pagar ${formattedPrice}`}
                    </button>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Column: Summary */}
        <div className="space-y-6">
          <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-zinc-900/20">
            <h3 className="text-lg font-bold mb-6">Resumo do Pedido</h3>
            
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2rem] p-5 mb-8 flex items-center gap-4">
              <div className="w-14 h-14 bg-rose-500 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-rose-500/20">
                {plan.slug === 'bronze' && <Zap size={28} />}
                {plan.slug === 'silver' && <Star size={28} />}
                {plan.slug === 'gold' && <Crown size={28} />}
              </div>
              <div>
                <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mb-0.5">Plano Selecionado</p>
                <h4 className="text-xl font-bold">{plan.name}</h4>
              </div>
            </div>

            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-sm">
                <span className="text-zinc-400">Ciclo de Cobrança</span>
                <span className="font-bold bg-white/10 px-3 py-1 rounded-full">{billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</span>
              </div>
              <div className="h-px bg-white/10 my-4" />
              <div className="flex justify-between items-end">
                <span className="text-zinc-400 text-sm">Total a pagar</span>
                <div className="text-right">
                  <div className="text-3xl font-bold text-rose-500">{formattedPrice}</div>
                  <div className="text-[10px] text-zinc-500 uppercase tracking-wider">Pagamento {billingCycle === 'monthly' ? 'Mensal' : 'Anual'}</div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <p className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Benefícios Inclusos</p>
              <ul className="grid grid-cols-1 gap-2">
                <SummaryFeatureItem label={plan.features.staffLimit === null ? 'Profissionais Ilimitados' : `Até ${plan.features.staffLimit} Profissionais`} />
                <SummaryFeatureItem label="Gestão de Agendamentos" />
                {plan.features.inventory && <SummaryFeatureItem label="Gestão de Estoque" />}
                {plan.features.reports && <SummaryFeatureItem label="Relatórios Avançados" />}
                {plan.features.whatsapp && <SummaryFeatureItem label="WhatsApp Automático" />}
              </ul>
            </div>
          </div>

          <div className="bg-zinc-50 p-6 rounded-3xl border border-zinc-100">
            <div className="flex gap-3">
              <ShieldCheck className="text-emerald-600 flex-shrink-0" size={20} />
              <div>
                <p className="text-sm font-bold text-zinc-900">Pagamento Seguro</p>
                <p className="text-xs text-zinc-500 mt-1">
                  Suas informações são processadas de forma criptografada pelo Asaas.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PaymentMethodButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`flex flex-col items-center gap-3 p-6 rounded-2xl border-2 transition-all ${
        active 
          ? 'border-rose-500 bg-rose-50 text-rose-600' 
          : 'border-zinc-100 hover:border-zinc-200 text-zinc-500'
      }`}
    >
      {icon}
      <span className="text-sm font-bold">{label}</span>
    </button>
  );
}

function SummaryFeatureItem({ label }: { label: string }) {
  return (
    <li className="flex items-center gap-3 text-xs text-zinc-300 bg-white/5 p-3 rounded-2xl border border-white/5">
      <div className="w-5 h-5 bg-rose-500/20 rounded-full flex items-center justify-center flex-shrink-0">
        <Check size={12} className="text-rose-500" />
      </div>
      {label}
    </li>
  );
}
