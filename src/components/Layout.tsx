import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar as CalendarIcon, 
  Group as UsersIcon, 
  Sparkles as SparklesIcon,
  DollarSign, 
  LogOut, 
  Menu, 
  X,
  User as UserIcon,
  Settings as SettingsIcon,
  CreditCard,
  Package,
  BarChart3,
  ShieldAlert,
  MessageSquare as MessageIcon,
  MessageSquare,
  HelpCircle,
  Flower2,
  Settings2,
  QrCode
} from 'lucide-react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { GoogleGenAI } from "@google/genai";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user: userProfile, logout } = useAuth();
  const { plan } = useSubscription();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  useEffect(() => {
    async function generateLogo() {
      setLoadingLogo(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const logoPrompt = `A modern and elegant logo for a women's beauty salon management app named 'SallonProManager'. The logo should feature minimalist and sophisticated elements representing hair styling or aesthetics (like a stylized hair strand or a subtle silhouette). Use a luxury color palette: rose gold, deep charcoal, and soft white. The design must be clean, professional, and suitable for a high-end mobile app icon. Vector style, isolated on a white background.`;

        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash-image',
          contents: { parts: [{ text: logoPrompt }] },
          config: { imageConfig: { aspectRatio: "1:1" } },
        });

        for (const part of response.candidates[0].content.parts) {
          if (part.inlineData) {
            setLogoImage(`data:image/png;base64,${part.inlineData.data}`);
            break;
          }
        }
      } catch (error) {
        console.error('Error generating logo:', error);
      } finally {
        setLoadingLogo(false);
      }
    }
    generateLogo();
  }, []);

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'appointments', label: 'Agendamentos', icon: CalendarIcon },
    { id: 'clients', label: 'Clientes', icon: UsersIcon },
    { id: 'services', label: 'Serviços', icon: SparklesIcon },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageIcon },
    { id: 'whatsapp-chats', label: 'Mensagens', icon: MessageSquare },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
    { id: 'subscription', label: 'Minha Assinatura', icon: CreditCard },
    { id: 'automation', label: 'Automação', icon: Settings2 },
    { id: 'whatsapp-connection', label: 'Conexão WhatsApp', icon: QrCode },
    { id: 'help', label: 'Ajuda', icon: HelpCircle },
  ];

  const isSuperAdmin = 
    userProfile?.role === 'admin' || 
    userProfile?.role === 'superadmin' ||
    userProfile?.email === 'admin@sallonpromanager.com.br' ||
    userProfile?.email === 'renatadouglas739@gmail.com' || 
    userProfile?.email === 'sallonpromanager@gmail.com';

  const isProfessional = userProfile?.role === 'professional';

  const filteredMenuItems = menuItems.filter(item => {
    if (isSuperAdmin) return true;
    
    // Professionals only see restricted menu
    if (isProfessional) {
      const allowedForPro = ['dashboard', 'appointments', 'clients', 'settings', 'help', 'whatsapp-chats'];
      return allowedForPro.includes(item.id);
    }

    if (item.id === 'whatsapp' || item.id === 'whatsapp-connection' || item.id === 'whatsapp-chats') {
      return plan?.features?.whatsapp === true;
    }
    return true;
  });

  const fullMenuItems = isSuperAdmin 
    ? [...filteredMenuItems, { id: 'superadmin', label: 'SaaS Admin', icon: ShieldAlert }]
    : filteredMenuItems;

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-surface-50 flex font-sans">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-surface-900/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-surface-900 text-white transform transition-all duration-500 ease-in-out border-r border-white/5
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-8 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-12 group cursor-pointer">
            <div className="w-12 h-12 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl flex items-center justify-center shadow-premium overflow-hidden transition-transform group-hover:scale-105 duration-300">
              {loadingLogo ? (
                <Flower2 className="text-white animate-spin" size={24} />
              ) : logoImage ? (
                <img src={logoImage} alt="SallonProManager Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Flower2 className="text-white" size={28} />
              )}
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl font-display font-black tracking-tighter text-white italic leading-none group-hover:text-brand-500 transition-colors">SALLONPRO</h1>
              <span className="text-[10px] font-bold tracking-[0.2em] text-zinc-500 uppercase mt-1">Manager</span>
            </div>
          </div>

          <nav className="flex-1 space-y-1.5 overflow-y-auto pr-2 custom-scrollbar">
            {fullMenuItems.map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-300 group
                  ${activeTab === item.id 
                    ? 'bg-rose-500 text-white font-bold shadow-lg shadow-rose-500/20' 
                    : 'text-zinc-400 hover:bg-white/5 hover:text-white'}
                `}
              >
                <div className={`p-2 rounded-xl transition-all duration-300 ${
                  activeTab === item.id ? 'bg-white/20' : 'bg-zinc-800 group-hover:bg-zinc-700'
                }`}>
                  <item.icon size={18} className={activeTab === item.id ? 'text-white' : 'text-rose-500'} />
                </div>
                <span className="text-sm">{item.label}</span>
                {activeTab === item.id && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" />
                )}
              </button>
            ))}
          </nav>

          {/* Bottom logout area is clean now */}

          <div className="mt-auto pt-6 border-t border-white/5">
            <div className="flex items-center gap-3 mb-6 px-4 bg-white/5 p-4 rounded-2xl border border-white/5">
              <div className="w-10 h-10 bg-brand-500/10 rounded-xl flex items-center justify-center border border-brand-500/20">
                <UserIcon size={20} className="text-brand-500" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-bold truncate text-white">{userProfile?.name || 'Carregando...'}</p>
                <p className="text-[10px] text-zinc-500 truncate font-bold uppercase tracking-wider">{userProfile?.shopName || 'Salão de Beleza'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-500 hover:text-rose-400 hover:bg-rose-400/5 rounded-2xl transition-all font-medium text-sm"
            >
              <LogOut size={18} />
              Sair da Conta
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-white/70 backdrop-blur-xl border-b border-surface-200 flex items-center justify-between px-8 lg:px-12 sticky top-0 z-30">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-surface-900 bg-surface-100 rounded-xl hover:bg-surface-200 transition-colors"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex items-baseline gap-4">
            <h2 className="text-2xl font-display font-black text-surface-900 tracking-tight">
              {[...menuItems, { id: 'superadmin', label: 'SaaS Admin' }].find(i => i.id === activeTab)?.label}
            </h2>
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1 bg-surface-100 border border-surface-200 rounded-full">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              <span className="text-[10px] font-bold text-surface-900 uppercase tracking-widest">Ativo</span>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setActiveTab('help')}
              className="p-2 text-surface-900 hover:bg-surface-100 rounded-2xl transition-all flex items-center gap-2.5 text-sm font-bold group"
            >
              <div className="p-2 bg-surface-100 rounded-xl group-hover:bg-brand-500 group-hover:text-white transition-colors">
                <HelpCircle size={18} />
              </div>
              <span className="hidden sm:inline">Suporte</span>
            </button>
            <div className="hidden md:flex flex-col items-end">
              <p className="text-[10px] font-black text-brand-500 uppercase tracking-[0.2em]">{new Date().toLocaleDateString('pt-BR', { weekday: 'long' })}</p>
              <p className="text-sm font-bold text-surface-900">{new Date().toLocaleDateString('pt-BR', { day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 lg:p-12 bg-surface-50 custom-scrollbar">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            className="max-w-7xl mx-auto"
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
