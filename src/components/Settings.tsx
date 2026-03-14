import React, { useState, useEffect } from 'react';
import { 
  Building2, 
  MapPin, 
  Globe, 
  Clock, 
  MessageSquare, 
  Plus, 
  Trash2, 
  Save,
  UserPlus,
  Calendar as CalendarIcon,
  Copy,
  ExternalLink,
  Check,
  Crown,
  Lock,
  Settings as SettingsIcon,
  Zap,
  Star,
  Battery,
  Loader2,
  QrCode,
  ShieldCheck,
  Smartphone,
  Facebook,
  Music2
} from 'lucide-react';
import { Staff, ShopSettings, Holiday, Plan } from '../types';
import { useSubscription } from '../hooks/useSubscription';
import { motion } from 'motion/react';
import { apiFetch } from '../lib/api';

interface SettingsProps {
  onNavigate?: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

export default function Settings({ onNavigate }: SettingsProps) {
  const { plan, loading: subLoading } = useSubscription();
  const [settings, setSettings] = useState<ShopSettings | null>(null);
  const [staff, setStaff] = useState<Staff[]>([]);
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [loading, setLoading] = useState(true);

  // We can get user info from localStorage if needed, or from a context.
  // For now, let's assume we can check if they are super admin from the profile.
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
      const [settingsData, staffData, profileData] = await Promise.all([
        apiFetch('/settings'),
        apiFetch('/staff'),
        apiFetch('/auth/me')
      ]);

      if (profileData.email === 'renatadouglas739@gmail.com') {
        setIsSuperAdmin(true);
      }

      if (settingsData) {
        if (!settingsData.businessHours) {
          settingsData.businessHours = daysOfWeek.map(day => ({
            day: day.label,
            open: '09:00',
            close: '18:00',
            closed: day.id === 'sunday'
          }));
        }
        setSettings(settingsData);
        setHolidays(settingsData.holidays || []);
      } else {
        const initialSettings: ShopSettings = {
          uid: profileData.id,
          timezone: 'America/Sao_Paulo',
          whatsappConfig: { enabled: false, reminders: true, confirmations: true },
          businessHours: daysOfWeek.map(day => ({
            day: day.label,
            open: '09:00',
            close: '18:00',
            closed: day.id === 'sunday'
          })),
          holidays: []
        };
        setSettings(initialSettings);
        setHolidays([]);
      }

      setStaff(staffData);
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch settings data:', err);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleGenerateQR = async () => {
    setIsGeneratingQR(true);
    setQrCode(null);
    
    // Simulate API call delay
    setTimeout(() => {
      // Placeholder base64 QR code (a simple black square for demo)
      setQrCode('iVBORw0KGgoAAAANSUhEUgAAAQAAAAEAAQMAAABmvDolAAAAA1BMVEUAAACnej3aAAAAAXRSTlMAQObYZgAAADBJREFUGBntwTEBAAAAwiD7p14HB2AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAI8B8LAAAR77938AAAAASUVORK5CYII=');
      setIsGeneratingQR(false);
    }, 2000);
  };

  const handleSimulateConnection = () => {
    setIsWhatsAppConnected(true);
    setQrCode(null);
    setBatteryLevel(85); // Simulate 85% battery
  };

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;

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
      await apiFetch('/settings', {
        method: 'PUT',
        body: JSON.stringify({
          ...settings,
          holidays
        })
      });
      alert('Configurações salvas com sucesso!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Erro ao salvar configurações.');
    }
  };

  const handleAddStaff = async () => {
    if (!newStaffName) return;
    
    // Check barber limit
    const staffLimit = plan?.features?.staffLimit;
    if (staffLimit !== undefined && staffLimit !== null && staff.length >= staffLimit) {
      alert(`Seu plano atual permite apenas ${staffLimit} profissional(is). Faça o upgrade para adicionar mais.`);
      return;
    }

    try {
      await apiFetch('/staff', {
        method: 'POST',
        body: JSON.stringify({
          name: newStaffName,
          active: true,
          commissionPercentage: 0,
          portfolio: []
        })
      });
      setNewStaffName('');
      await fetchData();
      alert('Profissional adicionado com sucesso!');
    } catch (err: any) {
      console.error('Failed to add staff:', err);
      alert(`Erro ao adicionar profissional: ${err.message}`);
    }
  };

  const handleUpdateStaff = async (id: string, updates: Partial<Staff>) => {
    try {
      await apiFetch(`/staff/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updates)
      });
      fetchData();
    } catch (err) {
      console.error('Failed to update staff:', err);
    }
  };

  const handleAddHoliday = async () => {
    if (!newHolidayName || !newHolidayDate) return;
    
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
        await apiFetch('/settings', {
          method: 'PUT',
          body: JSON.stringify({
            ...settings,
            holidays: updatedHolidays
          })
        });
      } catch (err) {
        console.error('Failed to save holiday:', err);
      }
    }
  };

  const handleDelete = async (coll: string, id: string) => {
    if (coll === 'staff') {
      try {
        await apiFetch(`/staff/${id}`, { method: 'DELETE' });
        fetchData();
      } catch (err) {
        console.error('Failed to delete staff:', err);
      }
    } else if (coll === 'holidays') {
      const updatedHolidays = holidays.filter(h => h.id !== id);
      setHolidays(updatedHolidays);
      
      if (settings) {
        try {
          await apiFetch('/settings', {
            method: 'PUT',
            body: JSON.stringify({
              ...settings,
              holidays: updatedHolidays
            })
          });
        } catch (err) {
          console.error('Failed to delete holiday:', err);
        }
      }
    }
  };

  if (loading || subLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>;

  return (
    <div className="space-y-10 pb-20">
      {/* Booking Link */}
      <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <ExternalLink size={20} className="text-rose-500" />
            Link de Agendamento Online
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="p-6 bg-zinc-900 rounded-2xl text-white relative overflow-hidden">
            <div className="relative z-10">
              <p className="text-zinc-400 text-sm mb-2">Seu link exclusivo para clientes:</p>
              <div className="flex items-center gap-3 bg-zinc-800 p-3 rounded-xl border border-zinc-700">
                <code className="text-rose-400 font-mono text-sm flex-1 truncate">
                  {window.location.origin}/book/{settings?.slug || 'seu-salao'}
                </code>
                <button
                  onClick={() => {
                    const url = `${window.location.origin}/book/${settings?.slug || 'seu-salao'}`;
                    navigator.clipboard.writeText(url);
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  className="p-2 hover:bg-zinc-700 rounded-lg transition-colors text-zinc-400 hover:text-white"
                >
                  {copied ? <Check size={18} className="text-emerald-500" /> : <Copy size={18} />}
                </button>
              </div>
              <p className="mt-4 text-xs text-zinc-500">
                Compartilhe este link em sua bio do Instagram ou envie diretamente para seus clientes.
              </p>
            </div>
            <Globe className="absolute -bottom-4 -right-4 text-zinc-800/50" size={100} />
          </div>
        </div>
      </section>

      {/* Shop Info */}
      <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Building2 size={20} className="text-rose-500" />
            Informações do Salão
          </h3>
        </div>
        <form onSubmit={handleSaveSettings} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Nome/Slug do Salão</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.slug || ''}
                  onChange={e => setSettings(s => s ? {...s, slug: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="ex: salao-da-maria"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">CNPJ (Opcional)</label>
              <div className="relative">
                <ShieldCheck className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.cnpj || ''}
                  onChange={e => setSettings(s => s ? {...s, cnpj: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="00.000.000/0001-00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">CEP</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.zipCode || ''}
                  onChange={e => setSettings(s => s ? {...s, zipCode: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="00000-000"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-700">Logradouro / Endereço</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.address || ''}
                  onChange={e => setSettings(s => s ? {...s, address: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="Rua Exemplo"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Número</label>
              <input
                type="text"
                value={settings?.addressNumber || ''}
                onChange={e => setSettings(s => s ? {...s, addressNumber: e.target.value} : null)}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Bairro</label>
              <input
                type="text"
                value={settings?.neighborhood || ''}
                onChange={e => setSettings(s => s ? {...s, neighborhood: e.target.value} : null)}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="Centro"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Cidade</label>
              <input
                type="text"
                value={settings?.city || ''}
                onChange={e => setSettings(s => s ? {...s, city: e.target.value} : null)}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="Sua Cidade"
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Estado (UF)</label>
              <input
                type="text"
                value={settings?.state || ''}
                onChange={e => setSettings(s => s ? {...s, state: e.target.value} : null)}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                placeholder="SP"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">WhatsApp (Contato Público)</label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.phone || ''}
                  onChange={e => setSettings(s => s ? {...s, phone: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="55 11 99999-9999"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Instagram</label>
              <div className="relative">
                <Star className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.instagram || ''}
                  onChange={e => setSettings(s => s ? {...s, instagram: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="@seu.salao"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">Facebook</label>
              <div className="relative">
                <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.facebook || ''}
                  onChange={e => setSettings(s => s ? {...s, facebook: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="facebook.com/seusalaopro"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-700">TikTok</label>
              <div className="relative">
                <Music2 className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={18} />
                <input
                  type="text"
                  value={settings?.tiktok || ''}
                  onChange={e => setSettings(s => s ? {...s, tiktok: e.target.value} : null)}
                  className="w-full pl-10 pr-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                  placeholder="@seusalaopro"
                />
              </div>
            </div>
            <div className="space-y-2 md:col-span-2">
              <label className="text-sm font-medium text-zinc-700">Descrição</label>
              <textarea
                value={settings?.description || ''}
                onChange={e => setSettings(s => s ? {...s, description: e.target.value} : null)}
                className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none h-24"
                placeholder="Conte um pouco sobre seu salão..."
              />
            </div>

          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors font-medium"
            >
              <Save size={18} />
              Salvar Alterações
            </button>
          </div>
        </form>
      </section>

      {/* Business Hours */}
      <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Clock size={20} className="text-rose-500" />
            Horário de Funcionamento
          </h3>
        </div>
        <div className="p-6 space-y-4">
          {settings?.businessHours?.map((hour, index) => (
            <div key={hour.day} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 border border-zinc-100 rounded-xl bg-zinc-50/30">
              <div className="flex items-center gap-4 min-w-[150px]">
                <div className={`w-3 h-3 rounded-full ${hour.closed ? 'bg-rose-500' : 'bg-emerald-500'}`} />
                <span className="font-bold text-zinc-900">{hour.day}</span>
              </div>
              
              <div className="flex items-center gap-4">
                {!hour.closed ? (
                  <>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Abre</span>
                      <input
                        type="time"
                        value={hour.open}
                        onChange={(e) => {
                          const newHours = [...(settings.businessHours || [])];
                          newHours[index].open = e.target.value;
                          setSettings({ ...settings, businessHours: newHours });
                        }}
                        className="px-3 py-1.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-400 uppercase">Fecha</span>
                      <input
                        type="time"
                        value={hour.close}
                        onChange={(e) => {
                          const newHours = [...(settings.businessHours || [])];
                          newHours[index].close = e.target.value;
                          setSettings({ ...settings, businessHours: newHours });
                        }}
                        className="px-3 py-1.5 border border-zinc-200 rounded-lg focus:ring-2 focus:ring-rose-500 outline-none text-sm"
                      />
                    </div>
                  </>
                ) : (
                  <span className="text-sm font-bold text-rose-600 uppercase tracking-wider">Fechado</span>
                )}
                
                <button
                  onClick={() => {
                    const newHours = [...(settings.businessHours || [])];
                    newHours[index].closed = !newHours[index].closed;
                    setSettings({ ...settings, businessHours: newHours });
                  }}
                  className={`px-4 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                    hour.closed 
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' 
                      : 'bg-rose-100 text-rose-700 hover:bg-rose-200'
                  }`}
                >
                  {hour.closed ? 'Abrir' : 'Fechar'}
                </button>
              </div>
            </div>
          ))}
          <div className="flex justify-end pt-4">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 bg-zinc-900 text-white px-6 py-2.5 rounded-xl hover:bg-zinc-800 transition-colors font-medium"
            >
              <Save size={18} />
              Salvar Horários
            </button>
          </div>
          {timeError && (
            <div className="px-6 pb-6">
              <div className="p-4 bg-rose-50 border border-rose-100 rounded-xl flex items-center gap-3 text-rose-600 text-sm font-medium">
                <div className="w-2 h-2 bg-rose-500 rounded-full animate-pulse" />
                {timeError}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Staff Management */}
      <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50 flex justify-between items-center">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <UserPlus size={20} className="text-rose-500" />
            Profissionais
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={newStaffName}
              onChange={e => setNewStaffName(e.target.value)}
              className="flex-1 px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              placeholder="Nome do profissional"
            />
            <button
              onClick={handleAddStaff}
              className="bg-rose-500 text-white px-4 py-2 rounded-xl border-2 border-zinc-900 hover:bg-rose-400 transition-colors font-bold flex items-center gap-2 shadow-[2px_2px_0px_#18181b]"
            >
              <Plus size={18} strokeWidth={3} />
              Adicionar
            </button>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {staff.map(member => (
              <div key={member.id} className="p-6 border border-zinc-100 rounded-2xl bg-zinc-50/30 space-y-4">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-rose-100 rounded-xl flex items-center justify-center text-rose-600 font-bold">
                      {member.name.charAt(0)}
                    </div>
                    <span className="font-bold text-zinc-900">{member.name}</span>
                  </div>
                  <button
                    onClick={() => handleDelete('staff', member.id)}
                    className="p-2 text-zinc-400 hover:text-rose-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Comissão (%)</label>
                    <input
                      type="number"
                      value={member.commissionPercentage || 0}
                      onChange={(e) => handleUpdateStaff(member.id, { commissionPercentage: Number(e.target.value) })}
                      className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="0"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-zinc-500 uppercase">Portfólio (URLs separadas por vírgula)</label>
                    <input
                      type="text"
                      value={member.portfolio?.join(', ') || ''}
                      onChange={(e) => handleUpdateStaff(member.id, { portfolio: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                      className="w-full px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
                      placeholder="https://imagem1.jpg, https://imagem2.jpg"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Holidays */}
      <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CalendarIcon size={20} className="text-rose-500" />
            Feriados e Datas Especiais
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input
              type="text"
              value={newHolidayName}
              onChange={e => setNewHolidayName(e.target.value)}
              className="sm:col-span-1 px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
              placeholder="Nome do feriado"
            />
            <input
              type="date"
              value={newHolidayDate}
              onChange={e => setNewHolidayDate(e.target.value)}
              className="sm:col-span-1 px-4 py-2 border border-zinc-200 rounded-xl focus:ring-2 focus:ring-rose-500 outline-none"
            />
            <button
              onClick={handleAddHoliday}
              className="bg-rose-500 text-white px-4 py-2 rounded-xl hover:bg-rose-600 transition-colors font-medium flex items-center gap-2 justify-center"
            >
              <Plus size={18} />
              Adicionar
            </button>
          </div>
          <div className="space-y-2">
            {holidays.map(holiday => (
              <div key={holiday.id} className="p-4 border border-zinc-100 rounded-xl flex justify-between items-center bg-zinc-50/30">
                <div>
                  <p className="font-medium">{holiday.name}</p>
                  <p className="text-sm text-zinc-500">{new Date(holiday.date).toLocaleDateString('pt-BR')}</p>
                </div>
                <button
                  onClick={() => handleDelete('holidays', holiday.id)}
                  className="p-2 text-zinc-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WhatsApp Integration */}
      <section className="bg-white rounded-2xl border border-zinc-200 overflow-hidden shadow-sm relative">
        {!plan?.features.whatsapp && (
          <div className="absolute inset-0 z-10 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center mb-4">
              <Lock size={24} className="text-amber-600" />
            </div>
            <h4 className="text-xl font-bold text-zinc-900 mb-2">WhatsApp Automático</h4>
            <p className="text-zinc-500 text-sm max-w-xs mb-4">
              Disponível apenas no plano Gold. Automatize seus lembretes e reduza faltas em até 40%.
            </p>
            <button 
              onClick={() => onNavigate?.('subscription', { planId: 'gold' })}
              className="bg-zinc-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-zinc-800 transition-all text-sm flex items-center gap-2"
            >
              <Zap size={16} className="text-amber-500 shadow-sm" />
              Upgrade para Gold Agora
            </button>
          </div>
        )}
        <div className="p-6 border-b border-zinc-100 bg-zinc-50/50">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <MessageSquare size={20} className="text-amber-500" />
            Integração WhatsApp
          </h3>
        </div>
        <div className="p-6 space-y-6">
          <div className={`p-6 rounded-2xl border transition-all ${isWhatsAppConnected ? 'bg-emerald-50 border-emerald-100' : 'bg-zinc-50 border-zinc-100'}`}>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-xl ${isWhatsAppConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-400'}`}>
                  <Smartphone size={24} />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <p className={`font-bold ${isWhatsAppConnected ? 'text-emerald-900' : 'text-zinc-900'}`}>
                      {isWhatsAppConnected ? 'WhatsApp Conectado' : 'Status da Conexão'}
                    </p>
                    {isWhatsAppConnected && (
                      <span className="flex items-center gap-1 px-2 py-0.5 bg-emerald-100 text-emerald-700 text-[10px] font-bold uppercase tracking-wider rounded-full">
                        <ShieldCheck size={10} />
                        Ativo
                      </span>
                    )}
                  </div>
                  <p className={`text-sm ${isWhatsAppConnected ? 'text-emerald-700' : 'text-zinc-500'}`}>
                    {isWhatsAppConnected 
                      ? 'Seu sistema está pronto para enviar notificações automáticas.' 
                      : 'Conecte seu WhatsApp para enviar lembretes automáticos.'}
                  </p>
                  
                  {isWhatsAppConnected && batteryLevel !== null && (
                    <div className="flex items-center gap-2 mt-2 text-xs font-medium text-emerald-600">
                      <Battery size={14} className={batteryLevel < 20 ? 'text-red-500' : ''} />
                      Bateria do Dispositivo: {batteryLevel}%
                    </div>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap gap-3">
                {!isWhatsAppConnected ? (
                  <>
                    <button 
                      onClick={handleGenerateQR}
                      disabled={isGeneratingQR}
                      className="flex items-center gap-2 bg-amber-500 text-zinc-900 px-6 py-3 rounded-xl font-bold hover:bg-amber-600 transition-all shadow-sm disabled:opacity-50"
                    >
                      {isGeneratingQR ? (
                        <>
                          <Loader2 size={18} className="animate-spin" />
                          Gerando...
                        </>
                      ) : (
                        <>
                          <QrCode size={18} />
                          Gerar QR Code
                        </>
                      )}
                    </button>
                  </>
                ) : (
                  <button 
                    onClick={() => {
                      setIsWhatsAppConnected(false);
                      setBatteryLevel(null);
                    }}
                    className="bg-white text-zinc-600 border border-zinc-200 px-6 py-3 rounded-xl font-bold hover:bg-zinc-50 transition-all"
                  >
                    Desconectar
                  </button>
                )}
              </div>
            </div>

            {/* QR Code Display Area */}
            {qrCode && !isWhatsAppConnected && (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="mt-8 flex flex-col items-center p-8 bg-white rounded-3xl border-2 border-dashed border-zinc-200"
              >
                <div className="bg-zinc-50 p-4 rounded-2xl mb-4">
                  <img 
                    src={`data:image/png;base64,${qrCode}`} 
                    alt="WhatsApp QR Code" 
                    className="w-48 h-48"
                  />
                </div>
                <p className="text-sm font-medium text-zinc-900 mb-1">Escaneie o código acima</p>
                <p className="text-xs text-zinc-500 text-center max-w-xs mb-6">
                  Abra o WhatsApp no seu celular, vá em Aparelhos Conectados e aponte a câmera para esta tela.
                </p>
                <button 
                  onClick={handleSimulateConnection}
                  className="text-xs font-bold text-amber-600 hover:underline"
                >
                  Simular Conexão (Demo)
                </button>
              </motion.div>
            )}
          </div>
          
          <div className="space-y-6">
            <div className="flex items-center justify-between p-2">
              <div>
                <p className="font-bold text-zinc-900">Lembretes Automáticos</p>
                <p className="text-sm text-zinc-500">Enviar mensagem 2 horas antes do agendamento.</p>
              </div>
              <button
                onClick={() => {
                  if (!settings) return;
                  setSettings({
                    ...settings,
                    whatsappConfig: {
                      ...settings.whatsappConfig!,
                      reminders: !settings.whatsappConfig?.reminders
                    }
                  });
                }}
                className={`w-14 h-7 rounded-full transition-all relative ${settings?.whatsappConfig?.reminders ? 'bg-amber-500' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${settings?.whatsappConfig?.reminders ? 'right-1' : 'left-1'}`} />
              </button>
            </div>

            <div className="flex items-center justify-between p-2">
              <div>
                <p className="font-bold text-zinc-900">Confirmação de Agendamento</p>
                <p className="text-sm text-zinc-500">Enviar mensagem assim que o cliente agendar.</p>
              </div>
              <button
                onClick={() => {
                  if (!settings) return;
                  setSettings({
                    ...settings,
                    whatsappConfig: {
                      ...settings.whatsappConfig!,
                      confirmations: !settings.whatsappConfig?.confirmations
                    }
                  });
                }}
                className={`w-14 h-7 rounded-full transition-all relative ${settings?.whatsappConfig?.confirmations ? 'bg-amber-500' : 'bg-zinc-200'}`}
              >
                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full shadow-sm transition-all ${settings?.whatsappConfig?.confirmations ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button
              onClick={handleSaveSettings}
              className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-3 rounded-2xl hover:bg-zinc-800 transition-colors font-bold shadow-lg shadow-zinc-200"
            >
              <Save size={20} />
              Salvar Configurações
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
