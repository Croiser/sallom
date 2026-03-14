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
import { Plan } from './types';
import { ShieldAlert } from 'lucide-react';
import { apiFetch } from './lib/api';

import ErrorBoundary from './components/ErrorBoundary';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showAuth, setShowAuth] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [checkoutData, setCheckoutData] = useState<{ plan: Plan, cycle: 'monthly' | 'yearly' } | null>(null);

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

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const data = await apiFetch('/auth/me');
          setUser(data.user);
        } catch (err) {
          console.error('Auth check failed:', err);
          localStorage.removeItem('token');
          setUser(null);
        }
      } else {
        setUser(null);
      }
      setLoading(false);
    };

    const fetchPlans = async () => {
      try {
        const data = await apiFetch('/public/plans');
        setPlans(data);
      } catch (err) {
        console.error('Failed to fetch plans:', err);
      }
    };

    checkAuth();
    fetchPlans();
  }, []);

  // Public Booking Route
  const path = window.location.pathname;
  if (path.startsWith('/book/')) {
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
      return <Auth onBack={() => setShowAuth(false)} onLoginSuccess={(u) => setUser(u)} />;
    }
    return <LandingPage onAuthClick={() => setShowAuth(true)} />;
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

  const renderContent = () => {
    const props = { onNavigate: setActiveTab };
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard {...props} />;
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
      case 'help':
        return <HelpGuide />;
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
