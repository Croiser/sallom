import React, { useState, useEffect } from 'react';
import { 
  Sparkles as SparklesIcon, 
  CheckCircle2 as CheckIcon, 
  Zap as ZapIcon, 
  Star as StarIcon, 
  Crown as CrownIcon, 
  ArrowRight as ArrowIcon, 
  MessageSquare as MessageIcon, 
  BarChart3 as BarChartIcon, 
  Package as PackageIcon, 
  Calendar as CalendarIcon,
  Group as UsersIcon,
  Smartphone as SmartphoneIcon,
  ShieldCheck as ShieldIcon,
  Clock as ClockIcon,
  TrendingUp as TrendingIcon,
  Heart as HeartIcon,
  Flower2 as FlowerIcon,
  Loader2 as LoaderIcon,
  Scissors as ScissorsIcon,
  DollarSign as DollarIcon,
  Smartphone as MobileIcon,
  CheckCircle,
  Plus as PlusIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import Pricing from './Pricing';
import { api } from '../services/api';

export default function LandingPage({ onAuthClick }: { onAuthClick: (view?: 'login' | 'register') => void }) {
  const [heroImage, setHeroImage] = useState<string | null>(null);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingLogo, setLoadingLogo] = useState(false);
  const [quickReg, setQuickReg] = useState({ name: '', shopName: '', whatsapp: '' });

  const handleQuickRegister = (e: React.FormEvent) => {
    e.preventDefault();
    // Pass data to auth component via local storage or state
    localStorage.setItem('quickReg', JSON.stringify(quickReg));
    onAuthClick('register');
  };

  useEffect(() => {
    async function generateAssets() {
      setLoadingImage(true);
      setLoadingLogo(true);
      try {
        // Generate Hero Image
        const heroPrompt = `A high-quality, professional photography of a modern beauty salon. In the foreground, a middle-aged female salon owner sits at a cluttered reception desk, looking exhausted and overwhelmed with her hands on her head. The desk is covered in messy paper planners, notebooks, a ringing telephone, and a tablet displaying numerous notifications. In the background, the salon is bustling with activity, showing hairdressers working and clients in styling chairs. The lighting is dramatic and natural, highlighting the owner's stressed expression. In the center of the composition, there is a clean, empty space for text, featuring a prominent, elegant hot pink button that clearly says 'CADASTRE-SE AGORA' in bold white letters. The overall mood captures the contrast between professional success and administrative chaos.`;

        const heroResponse = await api.post('/ai/generate-assets', { 
          prompt: heroPrompt,
          aspectRatio: "16:9"
        });

        if (heroResponse.data) {
          setHeroImage(`data:image/png;base64,${heroResponse.data}`);
        }

        // Generate Logo
        const logoPrompt = `A modern and elegant logo for a women's beauty salon management app named 'SallonProManager'. The logo should feature minimalist and sophisticated elements representing hair styling or aesthetics (like a stylized hair strand or a subtle silhouette). Use a luxury color palette: rose gold, deep charcoal, and soft white. The design must be clean, professional, and suitable for a high-end mobile app icon. Vector style, isolated on a white background.`;

        const logoResponse = await api.post('/ai/generate-assets', {
          prompt: logoPrompt,
          aspectRatio: "1:1"
        });

        if (logoResponse.data) {
          setLogoImage(`data:image/png;base64,${logoResponse.data}`);
        }
      } catch (error) {
        console.error('Error generating assets:', error);
      } finally {
        setLoadingImage(false);
        setLoadingLogo(false);
      }
    }

    generateAssets();
  }, []);

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 overflow-hidden">
              {loadingLogo ? (
                <LoaderIcon className="text-white animate-spin" size={20} />
              ) : logoImage ? (
                <img src={logoImage} alt="SallonProManager Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <ScissorsIcon className="text-white" size={24} />
              )}
            </div>
            <span className="text-xl font-bold text-zinc-900 tracking-tight bg-gradient-to-r from-zinc-900 to-rose-600 bg-clip-text text-transparent italic uppercase">SallonProManager</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <a href="#features" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Recursos</a>
            <a href="#pricing" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Preços</a>
            <a href="#testimonials" className="text-sm font-medium text-zinc-600 hover:text-zinc-900 transition-colors">Depoimentos</a>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => onAuthClick('login')}
              className="text-sm font-bold text-zinc-900 hover:text-rose-600 transition-colors"
            >
              Entrar
            </button>
            <button 
              onClick={() => onAuthClick('register')}
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
                <ZapIcon size={14} />
                A plataforma #1 para Salões de Beleza
              </motion.div>
              <motion.h1 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="text-5xl lg:text-7xl font-bold text-zinc-900 leading-[1.1] mb-6"
              >
                SallonProManager: Chega de <span className="text-rose-500">Caos</span> na Agenda e Prejuízo no Fim do Mês.
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-xl text-zinc-500 mb-10 max-w-2xl mx-auto lg:mx-0"
              >
                Em 30 segundos você ganha seu próprio site de agendamento em <span className="font-bold text-zinc-900">seu-salao.sallonpromanager.com.br</span>. Automatize lembretes e recupere o controle do seu tempo.
              </motion.p>
              
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-[2rem] border border-zinc-100 shadow-2xl shadow-zinc-200/50 max-w-md mx-auto lg:mx-0"
              >
                <form onSubmit={handleQuickRegister} className="space-y-4">
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-zinc-400 uppercase ml-2">Seu Nome</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Maria Silva"
                      value={quickReg.name}
                      onChange={e => setQuickReg({...quickReg, name: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-zinc-400 uppercase ml-2">Nome do Salão</label>
                    <input 
                      required
                      type="text" 
                      placeholder="Ex: Studio Glow"
                      value={quickReg.shopName}
                      onChange={e => setQuickReg({...quickReg, shopName: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-xs font-bold text-zinc-400 uppercase ml-2">WhatsApp</label>
                    <input 
                      required
                      type="tel" 
                      placeholder="(00) 00000-0000"
                      value={quickReg.whatsapp}
                      onChange={e => setQuickReg({...quickReg, whatsapp: e.target.value})}
                      className="w-full bg-zinc-50 border border-zinc-100 rounded-xl px-4 py-3 text-sm focus:border-rose-500 outline-none transition-all"
                    />
                  </div>
                  <button 
                    type="submit"
                    className="w-full bg-rose-500 text-white py-4 rounded-xl font-bold text-lg hover:bg-rose-600 transition-all shadow-lg shadow-rose-200 flex items-center justify-center gap-2"
                  >
                    Criar minha agenda digital agora
                    <ArrowIcon size={20} />
                  </button>
                  <p className="text-[10px] text-zinc-400 text-center">Teste grátis por 7 dias. Sem cartão de crédito.</p>
                </form>
              </motion.div>
            </div>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4 }}
              className="flex-1 relative"
            >
              <div className="relative z-10 bg-white rounded-[2.5rem] p-4 shadow-2xl border border-zinc-100 min-h-[500px] flex items-center justify-center overflow-hidden">
                {loadingImage ? (
                  <div className="flex flex-col items-center gap-4">
                    <LoaderIcon className="w-12 h-12 text-rose-500 animate-spin" />
                    <p className="text-zinc-500 font-medium italic">Gerando imagem conceito...</p>
                  </div>
                ) : heroImage ? (
                  <img 
                    src={heroImage} 
                    alt="Conceito visual do sistema SallonProManager em um salão de beleza moderno" 
                    className="rounded-[2rem] w-full h-[500px] object-cover"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="text-center p-8">
                    <p className="text-zinc-400 italic">Conceito visual do salão</p>
                  </div>
                )}
                
                <div className="absolute -bottom-10 -left-10 bg-white p-6 rounded-3xl shadow-xl border border-zinc-100 hidden md:block">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600">
                      <TrendingIcon size={24} />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-zinc-400 uppercase">Faturamento Mensal</p>
                      <p className="text-2xl font-bold text-zinc-900">R$ 24.850,00</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-600 text-sm font-bold">
                    <CheckIcon size={16} />
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

      {/* Social Proof Bar */}
      <section className="py-12 border-y border-zinc-100 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex flex-wrap items-center justify-center gap-12 opacity-50 grayscale hover:grayscale-0 transition-all">
            <div className="flex items-center gap-2 font-bold text-xl text-zinc-400">
              <UsersIcon size={24} />
              <span>+2.500 SALÕES</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-zinc-400">
              <CalendarIcon size={24} />
              <span>150k AGENDAMENTOS</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-zinc-400">
              <SmartphoneIcon size={24} />
              <span>APP NOTA 4.9</span>
            </div>
            <div className="flex items-center gap-2 font-bold text-xl text-zinc-400">
              <ShieldIcon size={24} />
              <span>100% SEGURO</span>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Como funciona o SallonProManager?</h2>
            <p className="text-zinc-500 text-lg">Três passos simples para profissionalizar sua agenda.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-lg shadow-rose-500/20">1</div>
              <h3 className="text-xl font-bold text-zinc-900">Cadastre seu Salão</h3>
              <p className="text-zinc-500">Crie sua conta em segundos e personalize seu link exclusivo.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-lg shadow-rose-500/20">2</div>
              <h3 className="text-xl font-bold text-zinc-900">Divulgue seu Link</h3>
              <p className="text-zinc-500">Coloque seu link na Bio do Instagram e envie para suas clientes.</p>
            </div>
            <div className="text-center space-y-4">
              <div className="w-16 h-16 bg-rose-500 text-white rounded-2xl flex items-center justify-center mx-auto text-2xl font-bold shadow-lg shadow-rose-500/20">3</div>
              <h3 className="text-xl font-bold text-zinc-900">Receba Agendamentos</h3>
              <p className="text-zinc-500">As clientes agendam sozinhas e você recebe notificações em tempo real.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Time Calculator Section */}
      <section className="py-24 bg-zinc-950 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16">
            <div className="flex-1">
              <h2 className="text-4xl font-bold mb-6">Quanto tempo você perde com agenda manual?</h2>
              <p className="text-zinc-400 text-lg mb-8">
                Cada agendamento manual via WhatsApp leva em média 5 minutos. Calcule quanto tempo você está jogando fora todo mês.
              </p>
              <TimeCalculator />
            </div>
            <div className="flex-1 bg-white/5 backdrop-blur-xl p-8 rounded-[3rem] border border-white/10">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 flex-shrink-0">
                    <ClockIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">Recupere suas noites</h4>
                    <p className="text-zinc-400">Pare de responder clientes às 22h. Deixe o Dodile trabalhar enquanto você descansa.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-rose-500/20 rounded-2xl flex items-center justify-center text-rose-500 flex-shrink-0">
                    <TrendingIcon size={24} />
                  </div>
                  <div>
                    <h4 className="font-bold text-xl mb-1">Aumente sua produtividade</h4>
                    <p className="text-zinc-400">Foque no que você faz de melhor: cuidar das suas clientes.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Who is it for? */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Perfeito para qualquer negócio de beleza</h2>
            <p className="text-zinc-500 text-lg">O SallonProManager se adapta ao seu estilo de trabalho.</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 text-center hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <ScissorsIcon size={24} />
              </div>
              <h4 className="font-bold text-zinc-900">Salões de Cabelo</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 text-center hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UsersIcon size={24} />
              </div>
              <h4 className="font-bold text-zinc-900">Barbearias</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 text-center hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <SparklesIcon size={24} />
              </div>
              <h4 className="font-bold text-zinc-900">Estética & SPA</h4>
            </div>
            <div className="bg-white p-6 rounded-3xl border border-zinc-100 text-center hover:shadow-xl transition-all">
              <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <HeartIcon size={24} />
              </div>
              <h4 className="font-bold text-zinc-900">Nail Designers</h4>
            </div>
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
              icon={<MessageIcon className="text-zinc-400" />}
              title="Lembretes WhatsApp"
              description="Notificações de agendamento simplificadas. (Recurso automático disponível em breve)."
            />
            <FeatureCard 
              icon={<MobileIcon className="text-rose-500" />}
              title="Link de Agendamento"
              description="Sua cliente agenda sozinha pelo celular. Você só recebe a notificação e foca no serviço."
            />
            <FeatureCard 
              icon={<DollarIcon className="text-rose-500" />}
              title="Controle Financeiro"
              description="Saiba exatamente quanto entrou no dia, as comissões dos profissionais e seu lucro real."
            />
            <FeatureCard 
              icon={<CheckCircle className="text-rose-500" />}
              title="Site Próprio"
              description="Ganhe um endereço exclusivo seu-salao.sallonpromanager.com.br para passar mais profissionalismo."
            />
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="py-24 bg-white">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Por que escolher o Dodile?</h2>
            <p className="text-zinc-500 text-lg">Compare e veja a diferença na sua rotina.</p>
          </div>
          <div className="bg-white rounded-[2.5rem] border border-zinc-100 shadow-2xl overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-zinc-50/50">
                  <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider">Recurso</th>
                  <th className="px-8 py-6 text-sm font-bold text-zinc-400 uppercase tracking-wider">Agenda Manual</th>
                  <th className="px-8 py-6 text-sm font-bold text-rose-500 uppercase tracking-wider bg-rose-50/50">SallonProManager</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                <ComparisonRow label="Agendamento 24/7" manual="Não (Só horário comercial)" dodile="Sim (Automático)" />
                <ComparisonRow label="Lembretes WhatsApp" manual="Manual (Toma tempo)" dodile="Em Breve (Automático)" />
                <ComparisonRow label="Controle Financeiro" manual="Caderninho/Excel" dodile="Relatórios em 1 clique" />
                <ComparisonRow label="Histórico de Clientes" manual="Difícil de achar" dodile="Busca instantânea" />
                <ComparisonRow label="Profissionalismo" manual="Amador" dodile="Site Exclusivo" />
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Security & Trust */}
      <section className="py-24 bg-zinc-900 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-rose-500 border border-white/10">
                <ShieldIcon size={32} />
              </div>
              <h3 className="text-xl font-bold">Dados 100% Seguros</h3>
              <p className="text-zinc-400">Seus dados e de suas clientes são protegidos com criptografia de ponta a ponta.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-rose-500 border border-white/10">
                <ZapIcon size={32} />
              </div>
              <h3 className="text-xl font-bold">99.9% de Disponibilidade</h3>
              <p className="text-zinc-400">Sua agenda nunca sai do ar. Suas clientes agendam a qualquer hora, em qualquer lugar.</p>
            </div>
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-rose-500 border border-white/10">
                <TrendingIcon size={32} />
              </div>
              <h3 className="text-xl font-bold">Backup Diário</h3>
              <p className="text-zinc-400">Nunca perca uma informação. Fazemos cópias de segurança automáticas todos os dias.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24">
        <Pricing onSelectPlan={() => onAuthClick('register')} />
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
              <img src="https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400" alt="Ambiente de salão de beleza moderno" className="rounded-3xl w-full h-64 object-cover rotate-3" />
              <img src="https://images.unsplash.com/photo-1527799822367-3188572f483f?auto=format&fit=crop&q=80&w=400" alt="Detalhe de produtos de beleza profissionais" className="rounded-3xl w-full h-64 object-cover -rotate-3 mt-12" />
            </div>
          </div>
        </div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-rose-500/10 blur-[120px] rounded-full" />
      </section>

      {/* FAQ Section */}
      <section className="py-24 bg-zinc-50">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-zinc-900 mb-4">Dúvidas Frequentes</h2>
            <p className="text-zinc-500 text-lg">Tudo o que você precisa saber para começar.</p>
          </div>
          <div className="space-y-4">
            <FAQItem 
              question="Preciso baixar algum aplicativo?"
              answer="Não! O SallonProManager é uma plataforma web. Você e suas clientes acessam tudo pelo navegador do celular ou computador, sem ocupar espaço na memória."
            />
            <FAQItem 
              question="Como minhas clientes agendam?"
              answer="Você recebe um link exclusivo (ex: seu-salao.sallonpromanager.com.br). Basta colocar esse link no seu Instagram ou enviar pelo WhatsApp. A cliente escolhe o serviço, o profissional e o horário disponível."
            />
            <FAQItem 
              question="O sistema envia lembretes automáticos?"
              answer="Sim! Em breve teremos integração total com a API Oficial da Meta para envios automáticos sem risco de bloqueio."
            />
            <FAQItem 
              question="Posso testar antes de pagar?"
              answer="Com certeza! Oferecemos 7 dias de teste grátis em qualquer plano, sem necessidade de cadastrar cartão de crédito."
            />
          </div>
        </div>
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
                onClick={() => onAuthClick('register')}
                className="bg-zinc-950 text-white px-10 py-5 rounded-2xl font-bold text-lg hover:bg-zinc-800 transition-all shadow-xl shadow-zinc-950/20"
              >
                Cadastre-se agora
              </button>
            </div>
            <FlowerIcon className="absolute -bottom-10 -right-10 text-white/10" size={300} />
          </div>
        </div>
      </section>

      {/* Floating WhatsApp Button */}
      <a 
        href="https://wa.me/5511999999999" 
        target="_blank" 
        rel="noopener noreferrer"
        className="fixed bottom-8 right-8 z-50 bg-emerald-500 text-white p-4 rounded-full shadow-2xl hover:bg-emerald-600 hover:scale-110 transition-all group"
      >
        <MessageIcon size={28} />
        <span className="absolute right-full mr-4 top-1/2 -translate-y-1/2 bg-white text-zinc-900 px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Falar com Suporte
        </span>
      </a>

      {/* Footer */}
      <footer className="py-12 border-t border-zinc-100">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-rose-500 rounded-lg flex items-center justify-center">
              <SparklesIcon className="text-white" size={18} />
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

function ComparisonRow({ label, manual, dodile }: { label: string, manual: string, dodile: string }) {
  return (
    <tr className="hover:bg-zinc-50 transition-colors">
      <td className="px-8 py-5 text-zinc-900 font-bold">{label}</td>
      <td className="px-8 py-5 text-zinc-500">{manual}</td>
      <td className="px-8 py-5 text-rose-600 font-bold bg-rose-50/20">{dodile}</td>
    </tr>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div className="bg-white rounded-2xl border border-zinc-100 overflow-hidden transition-all">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-zinc-50 transition-colors"
      >
        <span className="font-bold text-zinc-900">{question}</span>
        <PlusIcon className={`text-rose-500 transition-transform ${isOpen ? 'rotate-45' : ''}`} size={20} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="px-6 pb-4 text-zinc-500 text-sm leading-relaxed"
          >
            {answer}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function TimeCalculator() {
  const [appointments, setAppointments] = useState(10);
  const hoursSaved = Math.round((appointments * 5 * 22) / 60);

  return (
    <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/10">
      <div className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-zinc-400 uppercase mb-4">
            Quantos agendamentos você faz por dia?
          </label>
          <input 
            type="range" 
            min="1" 
            max="50" 
            value={appointments}
            onChange={(e) => setAppointments(parseInt(e.target.value))}
            className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between mt-2 text-xs font-bold text-zinc-500">
            <span>1</span>
            <span>25</span>
            <span>50</span>
          </div>
        </div>

        <div className="pt-6 border-t border-white/10">
          <div className="flex items-center justify-between mb-2">
            <span className="text-zinc-400">Tempo economizado por mês:</span>
            <span className="text-3xl font-bold text-rose-500">{hoursSaved} horas</span>
          </div>
          <p className="text-sm text-zinc-500 italic">
            * Baseado em 22 dias úteis e 5 minutos por agendamento manual.
          </p>
        </div>
      </div>
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
        <img src={`https://i.pravatar.cc/100?u=salon-user${author}`} alt={`Foto de ${author}`} className="w-12 h-12 rounded-full" />
        <div>
          <p className="font-bold text-white">{author}</p>
          <p className="text-sm text-zinc-500">{role}</p>
        </div>
      </div>
    </div>
  );
}
