import React, { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Calendar, 
  Users, 
  Sparkles,
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
  MessageSquare,
  HelpCircle,
  Flower2
} from 'lucide-react';
import { UserProfile } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { GoogleGenAI } from "@google/genai";

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export default function Layout({ children, activeTab, setActiveTab }: LayoutProps) {
  const { user: userProfile, logout } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [logoImage, setLogoImage] = useState<string | null>(null);
  const [loadingLogo, setLoadingLogo] = useState(false);

  useEffect(() => {
    async function generateLogo() {
      setLoadingLogo(true);
      try {
        const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
        const logoPrompt = `A modern and elegant logo for a women's beauty salon management app named 'Dodile'. The logo should feature minimalist and sophisticated elements representing hair styling or aesthetics (like a stylized hair strand or a subtle silhouette). Use a luxury color palette: rose gold, deep charcoal, and soft white. The design must be clean, professional, and suitable for a high-end mobile app icon. Vector style, isolated on a white background.`;

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
    { id: 'appointments', label: 'Agendamentos', icon: Calendar },
    { id: 'clients', label: 'Clientes', icon: Users },
    { id: 'services', label: 'Serviços', icon: Sparkles },
    { id: 'inventory', label: 'Estoque', icon: Package },
    { id: 'finance', label: 'Financeiro', icon: DollarSign },
    { id: 'reports', label: 'Relatórios', icon: BarChart3 },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'settings', label: 'Configurações', icon: SettingsIcon },
    { id: 'subscription', label: 'Minha Assinatura', icon: CreditCard },
    { id: 'help', label: 'Ajuda', icon: HelpCircle },
  ];

  const isSuperAdmin = userProfile?.email === 'renatadouglas739@gmail.com' || userProfile?.email === 'barbeiromanager@gmail.com';

  const fullMenuItems = isSuperAdmin 
    ? [...menuItems, { id: 'superadmin', label: 'SaaS Admin', icon: ShieldAlert }]
    : menuItems;

  const handleLogout = async () => {
    await logout();
    window.location.reload();
  };

  return (
    <div className="min-h-screen bg-zinc-50 flex">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(false)}
            className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-zinc-900 text-white transform transition-transform duration-300 ease-in-out
        lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-10">
            <div className="w-10 h-10 bg-rose-500 rounded-xl flex items-center justify-center shadow-lg shadow-rose-500/20 overflow-hidden">
              {loadingLogo ? (
                <Flower2 className="text-white animate-spin" size={24} />
              ) : logoImage ? (
                <img src={logoImage} alt="Dodile Logo" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              ) : (
                <Flower2 className="text-white" size={24} />
              )}
            </div>
            <h1 className="text-2xl font-black tracking-tighter text-white italic leading-tight">DODILE</h1>
          </div>

          <nav className="flex-1 space-y-1">
            {fullMenuItems.filter(item => item.id !== 'superadmin').map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                  ${activeTab === item.id 
                    ? 'bg-rose-500 text-white font-medium shadow-lg shadow-rose-500/20' 
                    : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'}
                `}
              >
                <item.icon size={20} />
                {item.label}
              </button>
            ))}
          </nav>

          {isSuperAdmin && (
            <div className="mt-4 pt-4 border-t border-zinc-800">
              <button
                onClick={() => {
                  setActiveTab('superadmin');
                  setIsSidebarOpen(false);
                }}
                className={`
                  w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all
                  ${activeTab === 'superadmin' 
                    ? 'bg-zinc-100 text-zinc-900 font-bold shadow-xl' 
                    : 'text-rose-500 hover:bg-zinc-800'}
                `}
              >
                <ShieldAlert size={20} />
                SaaS Admin
              </button>
            </div>
          )}

          <div className="pt-6 border-t border-zinc-800">
            <div className="flex items-center gap-3 mb-6 px-4">
              <div className="w-10 h-10 bg-zinc-800 rounded-full flex items-center justify-center">
                <UserIcon size={20} className="text-zinc-400" />
              </div>
              <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{userProfile?.name || 'Carregando...'}</p>
                <p className="text-xs text-zinc-500 truncate">{userProfile?.shopName || 'Salão de Beleza'}</p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 text-zinc-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
            >
              <LogOut size={20} />
              Sair
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-zinc-200 flex items-center justify-between px-6 lg:px-10">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="lg:hidden p-2 text-zinc-600 hover:bg-zinc-100 rounded-lg"
          >
            <Menu size={24} />
          </button>
          
          <div className="flex-1 lg:flex-none">
            <h2 className="text-lg font-semibold text-zinc-900 capitalize">
              {[...menuItems, { id: 'superadmin', label: 'SaaS Admin' }].find(i => i.id === activeTab)?.label}
            </h2>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={() => setActiveTab('help')}
              className="p-2 text-zinc-400 hover:text-rose-500 hover:bg-rose-50 rounded-xl transition-all flex items-center gap-2 text-sm font-medium"
            >
              <HelpCircle size={20} />
              <span className="hidden sm:inline">Ajuda</span>
            </button>
            <div className="hidden sm:block text-right">
              <p className="text-xs text-zinc-500">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.div>
        </div>
      </main>
    </div>
  );
}
