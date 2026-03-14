import React from 'react';
import { 
  Sparkles, 
  CheckCircle2, 
  Zap, 
  Star, 
  Crown, 
  ArrowRight, 
  MessageSquare, 
  BarChart3, 
  Package, 
  Calendar,
  Users,
  Smartphone,
  ShieldCheck,
  Clock,
  TrendingUp,
  Heart,
  Flower2
} from 'lucide-react';
import { motion } from 'motion/react';
import Pricing from './Pricing';

export default function LandingPage({ onAuthClick }: { onAuthClick: () => void }) {
  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20">
              <Sparkles className="text-white" size={24} />
            </div>
            <span className="text-xl font-bold text-zinc-900 tracking-tight bg-gradient-to-r from-zinc-900 to-rose-600 bg-clip-text text-transparent italic">Salão Pro Manager</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Preços</a>
            <a href="#testimonials" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Depoimentos</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={onAuthClick}
              className="text-sm font-bold text-zinc-900 hover:text-rose-600 transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={onAuthClick}
              className="bg-zinc-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
            >
              Começar Grátis
            </button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="inline-flex items-center gap-2 px-4 py-2 bg-rose-100 text-rose-700 rounded-full text-xs font-bold uppercase tracking-wider mb-6"
              >
                <Zap size={14} />
                A plataforma #1 para Salões de Beleza
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-bold text-zinc-900 leading-[1.1] mb-6"
              >
                Eleve seu <span className="text-rose-500">Salão</span> ao próximo nível de excelência.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto lg:mx-0"
              >
                Agendamento online, gestão de estoque, controle de comissões e automação de WhatsApp em uma única plataforma elegante e intuitiva.
              </motion.p>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start"
              >
                <button 
                  onClick={onAuthClick}
                  className="w-full sm:w-auto bg-zinc-900 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all flex items-center justify-center gap-2 shadow-xl shadow-zinc-200"
                >
                  Criar minha conta
                  <ArrowRight size={20} />
                </button>
                <div className="flex items-center gap-2 text-zinc-500">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map(i => (
                      <img key={i} src={`https://i.pravatar.cc/100?u=salon${i}`} className="w-8 h-8 rounded-full border-2 border-white" />
                    ))}
                  </div>
                  <span className="text-sm font-medium">+1.200 salões já usam</span>
                </div>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-1 relative"
            >
              <div className="relative z-10 bg-white rounded-[2.5rem] p-4 shadow-2xl border border-zinc-100">
                <img 
                  src="https://images.unsplash.com/photo-1560066984-138dadb4c035?auto=format&fit=crop&q=80&w=1000" 
                  alt="Beauty Salon" 
                  className="rounded-[2rem] w-full h-[500px] object-cover"
                />
                <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-xl border border-zinc-100 hidden md:block">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <TrendingUp size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Faturamento Mensal</p>
                      <p className="text-2xl font-bold text-zinc-900">R$ 24.850,00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                    <CheckCircle2 size={16} />
                    +18% que o mês anterior
                  </div>
                </div>
              </div>
              {/* Decorative elements */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-rose-500/5 blur-[120px] rounded-full -z-10" />
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Tudo o que seu salão precisa para brilhar</h2>
            <p className="text-zinc-500 text-lg max-w-2xl mx-auto">
              Desenvolvido para profissionais que buscam excelência no atendimento e gestão.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <FeatureCard 
              icon={<Calendar className="text-rose-500" />}
              title="Agendamento 24h"
              description="Seus clientes agendam pelo link exclusivo a qualquer hora, integrando direto na sua agenda."
            />
            <FeatureCard 
              icon={<MessageSquare className="text-rose-500" />}
              title="Lembretes WhatsApp"
              description="Reduza faltas enviando lembretes automáticos e personalizados para suas clientes."
            />
            <FeatureCard 
              icon={<BarChart3 className="text-rose-500" />}
              title="Gestão de Comissões"
              description="Cálculo automático de comissões para seus profissionais, sem erros e sem planilhas."
            />
            <FeatureCard 
              icon={<Package className="text-rose-500" />}
              title="Controle de Estoque"
              description="Gerencie produtos de uso e revenda com alertas inteligentes de reposição."
            />
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <Pricing onSelectPlan={() => onAuthClick()} />
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-24 bg-zinc-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-6">O que dizem as donas de salões de sucesso</h2>
              <div className="space-y-8">
                <Testimonial 
                  quote="O Salão Pro Manager profissionalizou meu negócio. Hoje tenho controle total das comissões e da minha agenda."
                  author="Mariana Costa"
                  role="Dona do Studio Glow"
                />
                <Testimonial 
                  quote="O agendamento online é maravilhoso. Minhas clientes amam a facilidade e eu ganho tempo."
                  author="Patrícia Lima"
                  role="Salão Elegance"
                />
              </div>
            </div>
            <div className="flex-1 grid grid-cols-2 gap-4">
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400" className="rounded-3xl w-full h-64 object-cover rotate-3" />
              <img src="https://images.unsplash.com/photo-1527799822367-3188572f483f?auto=format&fit=crop&q=80&w=400" className="rounded-3xl w-full h-64 object-cover -rotate-3 mt-12" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full" />
      </section>

      {/* CTA Footer */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-4">
          <div className="bg-rose-500 rounded-[3rem] p-12 text-center text-white relative overflow-hidden">
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-6">Pronta para transformar seu salão?</h2>
              <p className="text-white/80 text-lg mb-10 max-w-xl mx-auto">
                Junte-se a centenas de empreendedoras que já profissionalizaram sua gestão. Comece seu teste grátis hoje.
              </p>
              <button 
                onClick={onAuthClick}
                className="bg-zinc-950 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-950/20"
              >
                Começar agora mesmo
              </button>
            </div>
            <Flower2 className="absolute -bottom-10 -right-10 text-white/10" size={300} />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <Sparkles className="text-white" size={18} />
            </div>
            <span className="font-bold text-zinc-900 italic">Salão Pro Manager</span>
          </div>
          <p className="text-zinc-500 text-sm">© 2026 Salão Pro Manager. Todos os direitos reservados.</p>
          <div className="flex items-center gap-6">
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">Termos</a>
            <a href="#" className="text-zinc-400 hover:text-zinc-900 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="bg-white p-8 rounded-3xl border border-zinc-100 hover:border-rose-500/20 hover:shadow-xl hover:shadow-rose-500/5 transition-all group">
      <div className="w-14 h-14 bg-zinc-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-rose-50 transition-colors">
        {icon}
      </div>
      <h3 className="text-xl font-bold text-zinc-900 mb-3">{title}</h3>
      <p className="text-zinc-500 text-sm leading-relaxed">{description}</p>
    </div>
  );
}

function Testimonial({ quote, author, role }: { quote: string, author: string, role: string }) {
  return (
    <div className="bg-zinc-800/50 p-8 rounded-3xl border border-zinc-700">
      <p className="text-lg italic text-zinc-300 mb-6">"{quote}"</p>
      <div className="flex items-center gap-4">
        <img src={`https://i.pravatar.cc/100?u=salon-user${author}`} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-bold text-white">{author}</p>
          <p className="text-sm text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
