import React, { useState, useEffect } from 'react';
import { 
  Building2 as BuildingIcon, 
  MapPin as MapIcon, 
  Globe as GlobeIcon, 
  Clock as ClockIcon, 
  MessageSquare as MessageIcon, 
  Plus as PlusIcon, 
  Trash2 as TrashIcon, 
  Save as SaveIcon,
  UserPlus as UserPlusIcon,
  Calendar as CalendarIcon,
  Copy as CopyIcon,
  ExternalLink as LinkIcon,
  Check as CheckIcon,
  Crown as CrownIcon,
  Lock as LockIcon,
  Settings as SettingsIcon,
  Zap as ZapIcon,
  Star as StarIcon,
  Battery as BatteryIcon,
  Loader2 as LoaderIcon,
  QrCode as QrIcon,
  ShieldCheck as ShieldIcon,
  Smartphone as SmartphoneIcon,
  Facebook as FacebookIcon,
  Music2 as MusicIcon,
  Gift as GiftIcon
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useSubscription } from '../hooks/useSubscription';
import { ShopSettings, Staff, Holiday } from '../types';
import { api } from '../services/api';
import BusinessProfile from './settings/BusinessProfile';
import BusinessHours from './settings/BusinessHours';
import StaffManagement from './settings/StaffManagement';
import HolidayManagement from './settings/HolidayManagement';
import FidelityProgram from './settings/FidelityProgram';
import WhatsAppIntegration from './settings/WhatsAppIntegration';

interface SettingsProps {
  onNavigate?: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

type SettingsTab = 'perfil' | 'agenda' | 'equipe' | 'financeiro' | 'comunicacao';

const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
  { id: 'perfil', label: 'Perfil', icon: <BuildingIcon size={18} /> },
  { id: 'agenda', label: 'Agenda', icon: <ClockIcon size={18} /> },
  { id: 'equipe', label: 'Equipe', icon: <UserPlusIcon size={18} /> },
  { id: 'financeiro', label: 'Financeiro', icon: <CrownIcon size={18} /> },
  { id: 'comunicacao', label: 'Comunicação', icon: <MessageIcon size={18} /> },
];

export default function Settings({ onNavigate }: SettingsProps) {
  const { user } = useAuth();
  const { plan, loading: subLoading } = useSubscription();
  const [activeTab, setActiveTab] = useState<SettingsTab>('perfil');
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  const [isSuperAdmin, setIsSuperAdmin] = useState(false);

  const [newStaffName, setNewStaffName] = useState('');
  const [newHolidayName, setNewHolidayName] = useState('');
  const [newHolidayDate, setNewHolidayDate] = useState('');
  const [isWhatsAppConnected, setIsWhatsAppConnected] = useState(false);
  const [isGeneratingQR, setIsGeneratingQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [batteryLevel, setBatteryLevel] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [timeError, setTimeError] = useState<string | null>(null);

  const daysOfWeek = [
    { id: 'monday', label: 'Segunda-feira' },
    { id: 'tuesday', label: 'Terça-feira' },
    { id: 'wednesday', label: 'Quarta-feira' },
    { id: 'thursday', label: 'Quinta-feira' },
    { id: 'friday', label: 'Sexta-feira' },
    { id: 'saturday', label: 'Sábado' },
    { id: 'sunday', label: 'Domingo' },
  ];

  const fetchData = async () => {
    try {
      const [settingsData, staffData] = await Promise.all([
        api.get('/settings'),
        api.get('/staff')
      ]);
      
      if (settingsData) {
        setSettings(settingsData);
        setHolidays(settingsData.holidays || []);
      } else {
        // Default settings if none exist
        setSettings({
          name: '',
          slug: '',
          businessHours: daysOfWeek.map(day => ({
            day: day.label,
            open: '09:00',
            close: '18:00',
            closed: day.id === 'sunday'
          }))
        } as ShopSettings);
      }
      setStaff(staffData);
    } catch (err) {
      console.error('Failed to fetch settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.email) {
      if (user.email === 'renatadouglas739@gmail.com' || user.email === 'sallonpromanager@gmail.com') {
        setIsSuperAdmin(true);
      }
      fetchData();
    }
  }, [user]);

  const checkWahaStatus = async () => {
    if (!plan?.features?.whatsapp) return;
    try {
      // Ensure backend has created the WhatsApp settings row for this user
      await api.getWhatsAppSettings().catch(() => {});
      
      const res = await api.getWahaStatus();
      if (res && (res.status === 'CONNECTED' || res.status === 'WORKING')) {
        setIsWhatsAppConnected(true);
        setBatteryLevel(100);
        setQrCode(null);
      } else {
        setIsWhatsAppConnected(false);
      }
    } catch (err) {
      console.error('Failed to get WAHA status:', err);
    }
  };

  useEffect(() => {
    if (plan?.features?.whatsapp) {
      checkWahaStatus();
      const interval = setInterval(checkWahaStatus, 15000); // Check every 15s
      return () => clearInterval(interval);
    }
  }, [plan]);

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    setQrCode(null);
    
    try {
      // Create settings record if it doesn't exist
      await api.getWhatsAppSettings().catch(() => {});
      
      // Request backend to start session
      await api.startWahaSession().catch(() => {});
      
      // Wait a few seconds for WAHA to spawn the browser and make QR ready
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const res = await api.getWahaQr();
      if (res && res.qr) {
        setQrCode(res.qr);
      } else {
        alert('O QR Code ainda está sendo gerado ou o serviço está iniciando. Tente clicar novamente em alguns segundos.');
      }
    } catch (err) {
      console.error('Failed to fetch real WAHA QR:', err);
      alert('Houve um erro de conexão com o servidor do WhatsApp. Tente novamente mais tarde.');
    } finally {
      setIsGeneratingQR(false);
    }
  };

  const handleSimulateConnection = async () => {
    // Used to refresh connection status manually, instead of just simulating
    await checkWahaStatus();
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!settings || !user?.uid) return;

    // Validation
    if (settings.businessHours) {
      for (const hour of settings.businessHours) {
        if (!hour.closed && hour.close <= hour.open) {
          setTimeError(`O horário de fechamento deve ser posterior ao de abertura na ${hour.day}.`);
          return;
        }
      }
    }

    setTimeError(null);
    try {
      await api.put('/settings', {
        ...settings,
        holidays
      });
      alert('Configurações salvas com sucesso!');
      fetchData();
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Erro ao salvar configurações.');
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName || !user?.uid) return;
    
    // Check barber limit
    const staffLimit = plan?.features?.staffLimit;
    if (staffLimit !== undefined && staffLimit !== null && staff.length >= staffLimit) {
      alert(`Seu plano atual permite apenas ${staffLimit} profissional(is). Faça o upgrade para adicionar mais.`);
      return;
    }

    try {
      await api.post('/staff', {
        name: newStaffName,
        active: true,
        commissionPercentage: 0,
        portfolio: []
      });
      setNewStaffName('');
      fetchData();
      alert('Profissional adicionado com sucesso!');
    } catch (err: any) {
      console.error('Failed to add staff:', err);
      alert(`Erro ao adicionar profissional: ${err.message}`);
    }
  };

  const handleUpdateStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      await api.put(`/staff/${id}`, updates);
      fetchData();
    } catch (err) {
      console.error('Failed to update staff:', err);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHolidayName || !newHolidayDate || !user?.uid) return;
    
    const newHoliday: Holiday = {
      id: Math.random().toString(36).substr(2, 9),
      name: newHolidayName,
      date: newHolidayDate
    };
    
    const updatedHolidays = [...holidays, newHoliday];
    setHolidays(updatedHolidays);
    setNewHolidayName('');
    setNewHolidayDate('');
    
    if (settings) {
      try {
        await api.put('/settings', {
          ...settings,
          holidays: updatedHolidays
        });
        fetchData();
      } catch (err) {
        console.error('Failed to save holiday:', err);
      }
    }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (!user?.uid) return;
    if (coll === 'staff') {
      try {
        await api.delete(`/staff/${id}`);
        fetchData();
      } catch (err) {
        console.error('Failed to delete staff:', err);
      }
    } else if (coll === 'holidays') {
      const updatedHolidays = holidays.filter(h => h.id !== id);
      setHolidays(updatedHolidays);
      
      if (settings) {
        try {
          await api.put('/settings', {
            ...settings,
            holidays: updatedHolidays
          });
          fetchData();
        } catch (err) {
          console.error('Failed to delete holiday:', err);
        }
      }
    }
  };

  if (loading || subLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>;

  const renderTabContent = () => {
    switch (activeTab) {
      case 'perfil':
        return (
          <div className="space-y-10">
            <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <LinkIcon size={20} className="text-rose-500" />
                  Link de Agendamento Online
                </h3>
              </div>
              <div className="p-6 space-y-6">
                <div className="p-6 bg-zinc-900 rounded-2xl text-white relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-zinc-400 text-sm mb-2">Seu link exclusivo para clientes:</p>
                    <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                      <code className="text-rose-400 font-mono text-sm flex-1 truncate">
                        {settings?.slug ? `${settings.slug}.dodile.com.br` : `${window.location.protocol}//${window.location.host}/agendar/seu-salao`}
                      </code>
                      <button
                        onClick={() => {
                          const url = settings?.slug 
                            ? `https://${settings.slug}.dodile.com.br` 
                            : `${window.location.protocol}//${window.location.host}/agendar/seu-salao`;
                          navigator.clipboard.writeText(url);
                          setCopied(true);
                          setTimeout(() => setCopied(false), 2000);
                        }}
                        className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                      >
                        {copied ? <CheckIcon size={18} className="text-emerald-500" /> : <CopyIcon size={18} />}
                      </button>
                    </div>
                    <p className="mt-4 text-xs text-zinc-500">
                      Compartilhe este link em sua bio do Instagram ou envie diretamente para seus clientes.
                    </p>
                  </div>
                  <GlobeIcon className="absolute -bottom-4 -right-4 text-zinc-800/50" size={100} />
                </div>
              </div>
            </section>
            <BusinessProfile settings={settings} setSettings={setSettings} />
          </div>
        );

      case 'agenda':
        return (
          <div className="space-y-10">
            <BusinessHours 
              settings={settings} 
              setSettings={setSettings} 
              onSave={handleSaveSettings} 
              timeError={timeError}
            />
            <HolidayManagement 
              holidays={holidays} 
              newHolidayName={newHolidayName} 
              setNewHolidayName={setNewHolidayName} 
              newHolidayDate={newHolidayDate} 
              setNewHolidayDate={setNewHolidayDate} 
              onAdd={handleAddHoliday} 
              onDelete={(id) => handleDelete('holidays', id)}
            />
          </div>
        );

      case 'equipe':
        return (
          <div className="space-y-10">
            <StaffManagement 
              staff={staff} 
              newStaffName={newStaffName} 
              setNewStaffName={setNewStaffName} 
              plan={plan} 
              onAdd={handleAddStaff} 
              onDelete={(id) => handleDelete('staff', id)} 
              onUpdate={handleUpdateStaff}
            />
          </div>
        );

      case 'financeiro':
        return (
          <div className="space-y-10">
            <FidelityProgram 
              settings={settings} 
              setSettings={setSettings} 
              onSave={handleSaveSettings} 
            />
          </div>
        );

      case 'comunicacao':
        return (
          <div className="space-y-10">
            <WhatsAppIntegration 
              settings={settings} 
              setSettings={setSettings} 
              plan={plan} 
              isWhatsAppConnected={isWhatsAppConnected} 
              setIsWhatsAppConnected={setIsWhatsAppConnected} 
              isGeneratingQR={isGeneratingQR} 
              qrCode={qrCode} 
              batteryLevel={batteryLevel} 
              onGenerateQR={handleGenerateQR} 
              onSimulateConnection={handleSimulateConnection} 
              onSave={handleSaveSettings} 
              onNavigate={onNavigate}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="pb-20">
      <div className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm mb-8">
        <div className="flex overflow-x-auto scrollbar-hide">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-4 text-sm font-medium whitespace-nowrap transition-all border-b-2 ${
                activeTab === tab.id
                  ? 'border-rose-500 text-rose-600 bg-rose-50/50'
                  : 'border-transparent text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      {renderTabContent()}
    </div>
  );
}
