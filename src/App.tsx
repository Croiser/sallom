/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import Auth from './components/Auth';
import LandingPage from './components/LandingPage';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Appointments from './components/Appointments';
import Clients from './components/Clients';
import Services from './components/Services';
import Finance from './components/Finance';
import Settings from './components/Settings';
import Pricing from './components/Pricing';
import SuperAdmin from './components/SuperAdmin';
import WhatsApp from './components/WhatsApp';
import Inventory from './components/Inventory';
import Reports from './components/Reports';
import Checkout from './components/Checkout';
import HelpGuide from './components/HelpGuide';
import BookingPage from './components/BookingPage';
import AutomationSettings from './components/AutomationSettings';
import WhatsAppConnection from './components/WhatsAppConnection';
import WhatsAppChatList from './components/whatsapp/WhatsAppChatList';
import ProfessionalDashboard from './components/ProfessionalDashboard';
import ClientPortal from './components/ClientPortal';
import PDV from './components/PDV';
import { Plan } from './types';
import { ShieldAlert } from 'lucide-react';
import { api } from './services/api';
import ErrorBoundary from './components/ErrorBoundary';
import { useAuth } from './contexts/AuthContext';

export default function App() {
  const { user, loading, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState<'login' | 'register' | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checkoutData, setCheckoutData] = useState<{ plan: Plan, cycle: 'monthly' | 'yearly' } | null>(null);
  const [tenant, setTenant] = useState<any>(null);
  const [tenantLoading, setTenantLoading] = useState(false);

  // Subdomain Detection Logic
  const hostname = window.location.hostname;
  const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1';
  const parts = hostname.split('.');
  
  const path = window.location.pathname;
  let subdomainSlug = '';
  
  if (path.startsWith('/t/')) {
    subdomainSlug = path.split('/')[2];
  } else if (!isLocalhost) {
    // Check if it's a run.app domain (AI Studio environment)
    const isRunApp = hostname.endsWith('.run.app');
    
    if (isRunApp) {
      // In AI Studio, the base URL usually has 4 parts: [unique-id, region, run, app]
      // A subdomain would have 5 or more parts.
      if (parts.length > 4) {
        subdomainSlug = parts[0];
      }
    } else if (parts.length >= 4) {
      // Standard domain logic for .com.br (e.g., salon.dodile.com.br)
      // root: dodile.com.br (3 parts)
      // sub: salon.dodile.com.br (4 parts)
      if (parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'sallon') {
        subdomainSlug = parts[0];
      }
    } else if (parts.length === 3 && !hostname.endsWith('.com.br')) {
      // Fallback for .com or other 2-part registries (e.g. salon.domain.com)
      if (parts[0] !== 'www' && parts[0] !== 'app' && parts[0] !== 'sallon') {
        subdomainSlug = parts[0];
      }
    }
  } else if (isLocalhost && parts.length > 1 && parts[0] !== 'localhost') {
    subdomainSlug = parts[0];
  }

  useEffect(() => {
    if (subdomainSlug) {
      const fetchTenant = async () => {
        setTenantLoading(true);
        try {
          const tenantData = await api.get(`/tenants/${subdomainSlug}`);
          setTenant(tenantData);
        } catch (err) {
          console.error('Failed to fetch tenant:', err);
          setTenant(null);
        } finally {
          setTenantLoading(false);
        }
      };
      fetchTenant();
    }
  }, [subdomainSlug]);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const plansData = await api.get('/plans');
        setPlans(plansData);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    };
    fetchPlans();
  }, []);

  const handleNavigate = (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => {
    setActiveTab(tab);
    if (tab === 'subscription' && data?.planId) {
      const selectedPlan = plans.find(p => p.id === data.planId || p.slug === data.planId);
      if (selectedPlan) {
        setCheckoutData({ plan: selectedPlan, cycle: data.cycle || 'monthly' });
      }
    } else if (tab === 'subscription' && !data) {
      // If going to subscription without data, reset checkout to show pricing list
      setCheckoutData(null);
    }
  };

  useEffect(() => {
    // Handle hash navigation for landing page links
    const handleHashChange = () => {
      if (window.location.hash === '#subscription' && user) {
        setActiveTab('subscription');
        // Clear hash so it can be triggered again
        window.history.replaceState(null, '', window.location.pathname);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [user]);

  // Tenant View (Booking Page)
  if (subdomainSlug) {
    if (tenantLoading) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
        </div>
      );
    }

    if (!tenant) {
      return (
        <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
          <div className="max-w-md space-y-4">
            <h2 className="text-3xl font-bold text-white tracking-tight">Salão não encontrado</h2>
            <p className="text-zinc-400">O endereço <span className="text-rose-500 font-bold">{subdomainSlug}</span> não está cadastrado no Salão Pro Manager.</p>
            <a href="/" className="inline-block bg-rose-500 text-white px-8 py-3 rounded-xl font-bold">Voltar para o Início</a>
          </div>
        </div>
      );
    }

    // If on a subdomain, we show the booking page by default
    // unless the path is /admin or /portal
    if (path.includes('/admin')) {
      // Allow login/admin view even on subdomain
    } else if (path.includes('/portal')) {
      return (
        <ErrorBoundary>
          <ClientPortal slug={subdomainSlug} />
        </ErrorBoundary>
      );
    } else {
      return (
        <ErrorBoundary>
          <BookingPage slug={subdomainSlug} />
        </ErrorBoundary>
      );
    }
  }

  // Public Routes ( /portal/:slug, /book/:slug, etc. )
  if (path.startsWith('/portal/')) {
    const slug = path.split('/')[2];
    return (
      <ErrorBoundary>
        <ClientPortal slug={slug} />
      </ErrorBoundary>
    );
  }

  // Public Booking Route (/book/:slug, /agendar/:slug, /agenda/:slug, /empresa/:slug, /cliente/:slug)
  if (path.startsWith('/book/') || path.startsWith('/agendar/') || path.startsWith('/agenda/') || path.startsWith('/empresa/') || path.startsWith('/cliente/')) {
    const slug = path.split('/')[2];
    if (slug) {
      return (
        <ErrorBoundary>
          <BookingPage slug={slug} />
        </ErrorBoundary>
      );
    }
  }

  // Special case for sallon.dodile.com.br/agenda/:slug
  if (hostname === 'sallon.dodile.com.br' && path.startsWith('/agenda/')) {
    const slug = path.split('/')[2];
    if (slug) {
      return (
        <ErrorBoundary>
          <BookingPage slug={slug} />
        </ErrorBoundary>
      );
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-rose-500"></div>
      </div>
    );
  }

  if (!user) {
    if (showAuth) {
      return <Auth 
        onBack={() => setShowAuth(null)} 
        initialView={showAuth}
      />;
    }
    return <LandingPage 
      onAuthClick={(view = 'login') => setShowAuth(view)} 
    />;
  }

  if (user?.status === 'suspended') {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 text-center">
        <div className="max-w-md space-y-6">
          <div className="w-20 h-20 bg-rose-500/10 rounded-full flex items-center justify-center mx-auto">
            <ShieldAlert className="text-rose-500" size={40} />
          </div>
          <h2 className="text-3xl font-bold text-white">Conta Suspensa</h2>
          <p className="text-zinc-400">Sua conta foi suspensa por um administrador. Entre em contato com o suporte para mais informações.</p>
          <button
            onClick={() => {
              localStorage.removeItem('token');
              window.location.reload();
            }}
            className="bg-zinc-800 text-white px-8 py-3 rounded-xl hover:bg-zinc-700 transition-colors"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    );
  }

  const isAdmin = 
    user?.role === 'admin' || 
    user?.role === 'superadmin' ||
    user?.email === 'admin@sallonpromanager.com.br' ||
    user?.email === 'renatadouglas739@gmail.com' || 
    user?.email === 'sallonpromanager@gmail.com';

  // Multi-Tenancy: Professional View (Admins and Owners see full dashboard)
  const isProfessional = user?.role === 'professional' && !isAdmin;

  const renderContent = () => {
    const props = { onNavigate: handleNavigate };
    switch (activeTab) {
      case 'dashboard':
        return isProfessional ? <ProfessionalDashboard /> : <Dashboard {...props} />;
      case 'appointments':
        return <Appointments />;
      case 'clients':
        return <Clients />;
      case 'services':
        return <Services />;
      case 'finance':
        return <Finance />;
      case 'settings':
        return <Settings onNavigate={handleNavigate} />;
      case 'inventory':
        return <Inventory onNavigate={handleNavigate} />;
      case 'reports':
        return <Reports onNavigate={handleNavigate} />;
      case 'pdv':
        return <PDV />;
      case 'subscription':
        return checkoutData ? (
          <Checkout 
            plan={checkoutData.plan} 
            billingCycle={checkoutData.cycle} 
            onBack={() => setCheckoutData(null)}
            onSuccess={() => {
              setCheckoutData(null);
              setActiveTab('dashboard');
            }}
          />
        ) : (
          <Pricing onSelectPlan={(plan, cycle) => setCheckoutData({ plan, cycle })} />
        );
      case 'superadmin':
        return <SuperAdmin />;
      case 'whatsapp':
        return <WhatsApp onNavigate={handleNavigate} />;
      case 'whatsapp-chats':
        return <WhatsAppChatList onBack={() => setActiveTab('whatsapp')} />;
      case 'automation':
        return <AutomationSettings />;
      case 'whatsapp-connection':
        return <WhatsAppConnection />;
      case 'help':
        return <HelpGuide onNavigate={handleNavigate} />;
      default:
        return <Dashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <ErrorBoundary>
      <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
        {renderContent()}
      </Layout>
    </ErrorBoundary>
  );
}
