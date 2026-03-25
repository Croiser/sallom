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
import { useSubscription } from '../hooks/useSubscription';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';

interface WhatsAppProps {
  onNavigate?: (tab: string, data?: { planId?: string, cycle?: 'monthly' | 'yearly' }) => void;
}

export default function WhatsApp({ onNavigate }: WhatsAppProps) {
  const { user } = useAuth();
  const { plan, loading: subLoading } = useSubscription();
  const [activeTab, setActiveTabInternal] = useState<'config' | 'history'>('config');
  const [settings, setSettings] = useState<WhatsAppSettings | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        const [settingsData, messagesData] = await Promise.all([
          whatsappService.getSettings(user.uid),
          api.get('/whatsapp-messages')
        ]);
        
        setSettings(settingsData);
        setMessages(messagesData);
      } catch (error) {
        console.error('Failed to load WhatsApp data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  const handleSave = async () => {
    if (!settings || !user?.uid) return;
    setSaving(true);
    try {
      await whatsappService.updateSettings(user.uid, settings);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error(error);
    } finally {
      setSaving(false);
    }
  };


  const handleTest = async () => {
    if (!user?.uid) return;
    const testNumber = prompt('Digite o número para teste (formato 55119...):');
    if (!testNumber) return;
    
    setConnecting(true);
    try {
      // For testing, we use a generic hello_world template if available, 
      // or the user can specify. For now, let's try to send a template.
      await whatsappService.testMessage(testNumber, 'hello_world', 'en_US');
      alert('Mensagem de teste enviada! Verifique o WhatsApp.');
    } catch (error: any) {
      alert('Erro no teste: ' + (error.response?.data?.error?.message || error.message));
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
                  <Lock className="text-zinc-600" size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-zinc-900">Configuração Meta API</h3>
                  <p className="text-sm text-zinc-500">Insira suas credenciais do WhatsApp Business Platform</p>
                </div>
              </div>

              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-zinc-700">Token de Acesso Temporário ou Permanente</label>
                  <input 
                    type="password"
                    value={settings?.apiKey || ''}
                    onChange={(e) => setSettings(s => s ? ({ ...s, apiKey: e.target.value }) : null)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all font-mono"
                    placeholder="EAAG..."
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">Phone Number ID</label>
                    <input 
                      type="text"
                      value={settings?.phoneNumberId || ''}
                      onChange={(e) => setSettings(s => s ? ({ ...s, phoneNumberId: e.target.value }) : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      placeholder="1234567890..."
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-zinc-700">WhatsApp Business Account ID</label>
                    <input 
                      type="text"
                      value={settings?.wabaId || ''}
                      onChange={(e) => setSettings(s => s ? ({ ...s, wabaId: e.target.value }) : null)}
                      className="w-full bg-zinc-50 border border-zinc-200 rounded-2xl p-4 text-sm outline-none focus:ring-2 focus:ring-zinc-900/5 focus:border-zinc-900 transition-all"
                      placeholder="9876543210..."
                    />
                  </div>
                </div>

                <div className="flex gap-4">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex-1 bg-zinc-900 text-white px-6 py-4 rounded-2xl font-bold hover:bg-zinc-800 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {saving ? <RefreshCw className="animate-spin" size={20} /> : <Save size={20} />}
                    Salvar Credenciais
                  </button>
                  <button
                    onClick={handleTest}
                    disabled={connecting || !settings?.phoneNumberId}
                    className="px-6 py-4 rounded-2xl font-bold border border-zinc-900 text-zinc-900 hover:bg-zinc-50 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Zap size={20} />
                    Testar Envio
                  </button>
                </div>

                <div className="p-6 bg-rose-50 rounded-3xl border border-rose-100 space-y-3">
                  <h4 className="text-sm font-bold text-rose-900 flex items-center gap-2">
                    <LifeBuoy size={16} /> Como conectar sem QR Code?
                  </h4>
                  <p className="text-xs text-rose-800 leading-relaxed">
                    A API Oficial da Meta é mais segura e estável. Para conectar o WhatsApp do salão:
                  </p>
                  <ul className="text-[11px] text-rose-700 space-y-2">
                    <li className="flex gap-2"><span>1.</span> <span>Crie um App (Business) no <a href="https://developers.facebook.com" target="_blank" className="underline font-bold">Meta Developers</a>.</span></li>
                    <li className="flex gap-2"><span>2.</span> <span>Adicione o produto <strong>WhatsApp</strong> ao seu App.</span></li>
                    <li className="flex gap-2"><span>3.</span> <span>Copie o <strong>Token Permanente</strong>, <strong>Phone ID</strong> e <strong>WABA ID</strong>.</span></li>
                    <li className="flex gap-2"><span>4.</span> <span>Cole os códigos acima e clique em <strong>Salvar Credenciais</strong>.</span></li>
                  </ul>
                  <p className="text-[10px] text-rose-400 italic">
                    *Não é mais necessário escanear QR Code. A conexão é direta via API.
                  </p>
                </div>
              </div>
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
