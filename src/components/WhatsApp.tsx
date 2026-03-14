import React, { useState, useEffect } from 'react';
import { 
  MessageSquare, 
  Settings, 
  History, 
  CheckCircle2, 
  AlertCircle, 
  Save,
  Bell,
  UserPlus,
  CalendarCheck,
  Smartphone,
  QrCode,
  Battery,
  Wifi,
  RefreshCw,
  Zap,
  Lock,
  Crown
} from 'lucide-react';
import { whatsappService, WhatsAppSettings } from '../services/whatsappService';
import { apiFetch } from '../lib/api';
import { useSubscription } from '../hooks/useSubscription';
import { motion } from 'motion/react';

interface WhatsAppProps {
  onNavigate?: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

export default function WhatsApp({ onNavigate }: WhatsAppProps) {
  const { plan, loading: subLoading } = useSubscription();
  const [activeTab, setActiveTabInternal] = useState<'config' | 'history'>('config');
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await whatsappService.getSettings('current-user'); // uid is handled by token
        setSettings(data);
        
        if (data.instanceName) {
          checkInstanceStatus(data.instanceName);
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      } finally {
        setLoading(false);
      }
    };

    const loadMessages = async () => {
      try {
        const data = await apiFetch('/whatsapp/messages');
        setMessages(data || []);
      } catch (error) {
        console.error('Failed to load messages:', error);
      }
    };

    loadSettings();
    loadMessages();
  }, []);

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      await whatsappService.updateSettings('current-user', settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const checkInstanceStatus = async (instanceName: string) => {
    const status = await whatsappService.checkStatus(instanceName);
    if (status && status.instance.state === 'open') {
      setSettings(s => s ? ({ ...s, instanceStatus: 'connected' }) : null);
      setQrCode(null);
    } else {
      setSettings(s => s ? ({ ...s, instanceStatus: 'disconnected' }) : null);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    try {
      let instanceName = settings?.instanceName;
      if (!instanceName) {
        // We need the user ID for the instance name, let's fetch profile
        const profile = await apiFetch('/auth/me');
        if (profile) {
          instanceName = await whatsappService.createInstance(profile.id);
        }
      }
      
      if (instanceName) {
        const base64 = await whatsappService.getQRCode(instanceName);
        setQrCode(base64);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setConnecting(false);
    }
  };

  if (loading || subLoading) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-rose-500"></div></div>;

  if (!plan?.features.whatsapp) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 bg-rose-100 rounded-full flex items-center justify-center mb-6">
          <Lock size={40} className="text-rose-600" />
        </div>
        <h2 className="text-3xl font-bold text-zinc-900 mb-4">Automação WhatsApp Premium</h2>
        <p className="text-zinc-500 max-w-md mb-8">
          A automação de lembretes e mensagens via WhatsApp é exclusiva para assinantes do plano Premium. 
          Reduza o não comparecimento em até 40% com mensagens automáticas.
        </p>
        <button 
          onClick={() => onNavigate?.('subscription', { planId: 'gold' })}
          className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all shadow-lg shadow-zinc-200"
        >
          <Zap size={20} className="text-rose-500" />
          Fazer Upgrade para Premium Agora
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-20">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-zinc-900">Automação de WhatsApp</h2>
          <p className="text-zinc-500 mt-1">Configure mensagens automáticas e acompanhe o histórico de envios.</p>
        </div>

        <div className="flex bg-zinc-100 p-1 rounded-2xl w-fit">
            <button
              onClick={() => setActiveTabInternal('config')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'config' ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Conexão
              {activeTab === 'config' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-full" />}
            </button>
            <button
              onClick={() => setActiveTabInternal('history')}
              className={`pb-4 px-2 text-sm font-bold transition-all relative ${activeTab === 'history' ? 'text-rose-500' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Histórico de Mensagens
              {activeTab === 'history' && <motion.div layoutId="tab" className="absolute bottom-0 left-0 right-0 h-1 bg-rose-500 rounded-full" />}
            </button>
        </div>
      </div>

      {activeTab === 'config' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Connection Section */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-12 h-12 bg-zinc-100 rounded-2xl flex items-center justify-center">
                  <Smartphone className="text-zinc-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Conectar Celular</h3>
                  <p className="text-sm text-zinc-500">Vincule seu WhatsApp para começar a enviar mensagens</p>
                </div>
              </div>

              {settings?.instanceStatus === 'connected' ? (
                <div className="flex items-center justify-between p-6 bg-emerald-50 rounded-3xl border border-emerald-100">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-emerald-500 rounded-2xl flex items-center justify-center text-white">
                      <Wifi size={24} />
                    </div>
                    <div>
                      <p className="font-bold text-emerald-900">WhatsApp Conectado</p>
                      <p className="text-xs text-emerald-700">Sua automação está pronta para uso</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 text-emerald-700 font-bold text-sm">
                    <Battery size={18} />
                    {settings.batteryLevel || 100}%
                  </div>
                </div>
              ) : (
                <div className="space-y-6">
                  {qrCode ? (
                    <div className="flex flex-col items-center gap-6 p-8 bg-zinc-50 rounded-3xl border border-zinc-200">
                      <p className="text-sm font-medium text-zinc-600 text-center">
                        Escaneie o QR Code abaixo com seu WhatsApp para conectar
                      </p>
                      <div className="bg-white p-4 rounded-2xl shadow-sm border border-zinc-100">
                        <img src={qrCode} alt="WhatsApp QR Code" className="w-64 h-64" />
                      </div>
                      <button 
                        onClick={() => settings?.instanceName && checkInstanceStatus(settings.instanceName)}
                        className="flex items-center gap-2 text-zinc-900 font-bold text-sm hover:underline"
                      >
                        <RefreshCw size={16} />
                        Já escaneei, verificar status
                      </button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center gap-4 py-8">
                      <div className="w-20 h-20 bg-zinc-50 rounded-full flex items-center justify-center mb-2">
                        <QrCode size={40} className="text-zinc-300" />
                      </div>
                      <button
                        onClick={handleConnect}
                        disabled={connecting}
                        className="bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center gap-2"
                      >
                        {connecting ? (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        ) : (
                          <QrCode size={20} />
                        )}
                        Gerar QR Code de Conexão
                      </button>
                      <p className="text-xs text-zinc-400">Isso criará uma nova instância segura para seu salão</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-zinc-200 shadow-sm">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-emerald-100 rounded-2xl flex items-center justify-center">
                    <MessageSquare className="text-emerald-600" size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-zinc-900">Status da Automação</h3>
                    <p className="text-sm text-zinc-500">Ative ou desative o envio automático</p>
                  </div>
                </div>
                <button
                  onClick={() => setSettings(s => s ? ({ ...s, enabled: !s.enabled }) : null)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                    settings?.enabled ? 'bg-emerald-500' : 'bg-zinc-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings?.enabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="space-y-8">
                <TemplateEditor 
                  title="Boas-vindas" 
                  description="Enviada após o cadastro de um novo cliente"
                  icon={<UserPlus size={20} className="text-blue-500" />}
                  value={settings?.templates.welcome || ''}
                  onChange={(val) => setSettings(s => s ? ({ ...s, templates: { ...s.templates, welcome: val } }) : null)}
                />
                
                <TemplateEditor 
                  title="Confirmação de Agendamento" 
                  description="Enviada assim que um horário é marcado"
                  icon={<CalendarCheck size={20} className="text-emerald-500" />}
                  value={settings?.templates.confirmation || ''}
                  onChange={(val) => setSettings(s => s ? ({ ...s, templates: { ...s.templates, confirmation: val } }) : null)}
                />

                <TemplateEditor 
                  title="Lembrete de Horário" 
                  description="Enviada 2 horas antes do agendamento"
                  icon={<Bell size={20} className="text-rose-500" />}
                  value={settings?.templates.reminder || ''}
                  onChange={(val) => setSettings(s => s ? ({ ...s, templates: { ...s.templates, reminder: val } }) : null)}
                />
              </div>

              <div className="mt-10 pt-8 border-t border-zinc-100 flex justify-end">
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex items-center gap-2 bg-zinc-900 text-white px-8 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : success ? (
                    <CheckCircle2 size={20} />
                  ) : (
                    <Save size={20} />
                  )}
                  {success ? 'Salvo!' : 'Salvar Configurações'}
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-zinc-900 p-8 rounded-[2.5rem] text-white">
              <h4 className="text-lg font-bold mb-4">Dicas de Personalização</h4>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6">
                Use as variáveis abaixo para que a IA preencha os dados automaticamente para cada cliente:
              </p>
              <div className="space-y-3">
                <VariableTag label="{nome_cliente}" description="Nome do cliente" />
                <VariableTag label="{shop_name}" description="Nome do seu salão" />
                <VariableTag label="{data}" description="Data do agendamento" />
                <VariableTag label="{hora}" description="Hora do agendamento" />
              </div>
            </div>

            <div className="bg-rose-50 p-6 rounded-[2rem] border border-rose-100">
              <div className="flex gap-3">
                <AlertCircle className="text-rose-600 flex-shrink-0" size={20} />
                <div>
                  <p className="text-sm font-bold text-rose-900">Atenção</p>
                  <p className="text-xs text-rose-700 mt-1 leading-relaxed">
                    As mensagens são enviadas através da nossa API oficial. Certifique-se de que o número do cliente está no formato internacional (Ex: 5511999999999).
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-zinc-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-zinc-50 text-zinc-500 text-xs uppercase tracking-wider">
                <tr>
                  <th className="px-8 py-5 font-bold">Data/Hora</th>
                  <th className="px-8 py-5 font-bold">Cliente</th>
                  <th className="px-8 py-5 font-bold">Tipo</th>
                  <th className="px-8 py-5 font-bold">Mensagem</th>
                  <th className="px-8 py-5 font-bold">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {messages.map((msg) => (
                  <tr key={msg.id} className="hover:bg-zinc-50/50 transition-colors">
                    <td className="px-8 py-5 text-sm text-zinc-600">
                      {new Date(msg.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="px-8 py-5">
                      <div className="font-bold text-zinc-900">{msg.recipientName}</div>
                      <div className="text-xs text-zinc-500">{msg.recipientNumber}</div>
                    </td>
                    <td className="px-8 py-5">
                      <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase ${
                        msg.type === 'welcome' ? 'bg-blue-50 text-blue-600' :
                        msg.type === 'confirmation' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                      }`}>
                        {msg.type}
                      </span>
                    </td>
                    <td className="px-8 py-5 text-sm text-zinc-600 max-w-xs truncate">
                      {msg.content}
                    </td>
                    <td className="px-8 py-5">
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-xs">
                        <CheckCircle2 size={14} />
                        Enviada
                      </div>
                    </td>
                  </tr>
                ))}
                {messages.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-8 py-20 text-center text-zinc-500">
                      Nenhuma mensagem enviada ainda.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

function TemplateEditor({ title, description, icon, value, onChange }: { title: string, description: string, icon: React.ReactNode, value: string, onChange: (val: string) => void }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {icon}
        <h4 className="font-bold text-zinc-900">{title}</h4>
      </div>
      <p className="text-xs text-zinc-500">{description}</p>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-24 bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm text-zinc-700 outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all resize-none"
        placeholder="Digite o template da mensagem..."
      />
    </div>
  );
}

function VariableTag({ label, description }: { label: string, description: string }) {
  return (
    <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl border border-white/10">
      <code className="text-rose-400 text-xs font-bold">{label}</code>
      <span className="text-zinc-500 text-[10px] uppercase font-bold">{description}</span>
    </div>
  );
}
