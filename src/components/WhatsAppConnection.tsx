import React, { useState, useEffect } from 'react';
import { QrCode, RefreshCw, CheckCircle2, XCircle, AlertCircle, Info } from 'lucide-react';
import { api } from '../services/api';
import { motion } from 'motion/react';

export default function WhatsAppConnection() {
  const [status, setStatus] = useState<any>(null);
  const [qr, setQr] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchStatus = async () => {
    try {
      const data = await api.get('/whatsapp/waha/status');
      setStatus(data);
      if (data.status === 'SCAN_QR_CODE' || !data.status) {
        fetchQr();
      }
    } catch (err) {
      console.error('Error fetching WAHA status:', err);
      setError('Não foi possível carregar o status do WhatsApp.');
    } finally {
      setLoading(false);
    }
  };

  const fetchQr = async () => {
    try {
      const data = await api.get('/whatsapp/waha/qr');
      if (data.qr) {
        setQr(data.qr);
      }
    } catch (err) {
      console.error('Error fetching QR Code:', err);
    }
  };

  const startSession = async () => {
    setRefreshing(true);
    try {
      await api.post('/whatsapp/waha/session/start', {});
      await new Promise(resolve => setTimeout(resolve, 2000));
      await fetchStatus();
    } catch (err) {
      setError('Falha ao iniciar a sessão.');
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchStatus();
    const interval = setInterval(fetchStatus, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, []);

  const isConnected = status?.status === 'CONNECTED';
  const needsScan = status?.status === 'SCAN_QR_CODE' || (!isConnected && qr);

  return (
    <div className="p-6 max-w-4xl mx-auto space-y-6">
      <header className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-zinc-900 tracking-tight">Conexão WhatsApp</h1>
          <p className="text-zinc-500">Conecte seu celular para habilitar automações e lembretes.</p>
        </div>
        <button 
          onClick={startSession}
          disabled={refreshing}
          className="flex items-center gap-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <RefreshCw size={18} className={refreshing ? 'animate-spin' : ''} />
          Sincronizar
        </button>
      </header>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Connection Status Card */}
        <section className="bg-white p-8 rounded-3xl border border-zinc-200 shadow-sm space-y-6">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isConnected ? 'bg-emerald-100 text-emerald-600' : 'bg-zinc-100 text-zinc-500'}`}>
              <QrCode size={32} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Status da Instância</h2>
              <p className={`text-sm font-medium ${isConnected ? 'text-emerald-600' : 'text-zinc-500'}`}>
                {isConnected ? 'Conectado e Ativo' : 'Aguardando Conexão'}
              </p>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t border-zinc-100">
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-500">Motor de Envio</span>
              <span className="font-semibold text-zinc-900 bg-zinc-100 px-3 py-1 rounded-lg text-xs">WAHA (HTTP API)</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-500">Sessão</span>
              <span className="text-zinc-900">{status?.name || 'Sessão Padrão'}</span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-zinc-500">Dispositivo</span>
              <span className="text-zinc-900">{status?.device || 'N/A'}</span>
            </div>
          </div>

          {isConnected ? (
            <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-3">
              <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
              <p className="text-sm text-emerald-700">Tudo pronto! Sua barbearia já pode enviar agendamentos via WhatsApp.</p>
            </div>
          ) : (
            <div className="bg-amber-50 border border-amber-100 p-4 rounded-2xl flex gap-3">
              <AlertCircle className="text-amber-500 shrink-0" size={20} />
              <p className="text-sm text-amber-700">Seu número não está conectado. Escaneie o QR Code ao lado para ativar.</p>
            </div>
          )}
        </section>

        {/* QR Code Card */}
        <section className="bg-zinc-900 p-8 rounded-3xl shadow-xl flex flex-col items-center justify-center text-center space-y-6 relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 blur-3xl -mr-16 -mt-16"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-indigo-500/10 blur-3xl -ml-16 -mb-16"></div>

          <h3 className="text-white font-bold text-lg relative z-10">Escaneie para Conectar</h3>
          
          <div className="bg-white p-4 rounded-3xl shadow-2xl relative z-10">
            {loading ? (
              <div className="w-64 h-64 flex items-center justify-center">
                <RefreshCw className="animate-spin text-zinc-300" size={40} />
              </div>
            ) : qr && !isConnected ? (
              <img 
                src={`data:image/png;base64,${qr}`} 
                alt="WhatsApp QR Code" 
                className="w-64 h-64"
              />
            ) : isConnected ? (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-4 text-emerald-500">
                <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center">
                  <CheckCircle2 size={48} />
                </div>
                <p className="font-bold">Conexão Estabelecida</p>
              </div>
            ) : (
              <div className="w-64 h-64 flex flex-col items-center justify-center gap-4 text-zinc-400">
                <XCircle size={48} />
                <p className="text-sm px-4">QR Code indisponível. Tente sincronizar.</p>
              </div>
            )}
          </div>

          <p className="text-zinc-400 text-xs px-8 leading-relaxed relative z-10">
            Abra o WhatsApp no seu celular {'>'} Configurações {'>'} Aparelhos Conectados {'>'} Conectar um Aparelho.
          </p>
        </section>
      </div>

      {/* Anti-Ban Tips */}
      <section className="bg-white p-6 rounded-3xl border border-zinc-200 shadow-sm flex gap-4 items-start">
        <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
          <Info size={24} />
        </div>
        <div className="space-y-1">
          <h4 className="font-bold text-zinc-900">Dicas para evitar banimentos</h4>
          <ul className="text-sm text-zinc-600 list-disc list-inside space-y-1">
            <li>Mantenha um fluxo natural de conversas com seus clientes.</li>
            <li>Evite disparar mensagens para números que não têm você nos contatos.</li>
            <li>Use o recurso de <strong>Confirmação Ativa</strong> para que o cliente inicie a conversa.</li>
            <li>O sistema já aplica <strong>Spintax</strong> e <strong>Delay</strong> automaticamente para sua segurança.</li>
          </ul>
        </div>
      </section>
    </div>
  );
}
