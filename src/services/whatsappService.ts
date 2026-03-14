import { apiFetch } from '../lib/api';

export type WhatsAppMessageType = 'welcome' | 'reminder' | 'confirmation';

export interface WhatsAppSettings {
  enabled: boolean;
  templates: {
    welcome: string;
    reminder: string;
    confirmation: string;
  };
  apiKey?: string;
  instanceName?: string;
  instanceStatus?: 'connected' | 'disconnected' | 'connecting';
  batteryLevel?: number;
}

const EVOLUTION_API_URL = (import.meta as any).env.VITE_EVOLUTION_API_URL || 'http://localhost:8080';
const EVOLUTION_API_KEY = (import.meta as any).env.VITE_EVOLUTION_API_KEY || 'global_api_key_here';

const DEFAULT_TEMPLATES = {
  welcome: "Olá {nome_cliente}, bem-vindo à {shop_name}! É um prazer ter você conosco.",
  reminder: "Lembrete: Você tem um agendamento na {shop_name} dia {data} às {hora}. Até logo!",
  confirmation: "Confirmado! Seu agendamento na {shop_name} foi marcado para {data} às {hora}. Obrigado!"
};

export const whatsappService = {
  async getSettings(uid: string): Promise<WhatsAppSettings> {
    try {
      const settings = await apiFetch('/whatsapp/settings');
      if (settings) {
        return settings as WhatsAppSettings;
      } else {
        const defaultSettings: WhatsAppSettings = {
          enabled: false,
          templates: DEFAULT_TEMPLATES
        };
        await this.updateSettings(uid, defaultSettings);
        return defaultSettings;
      }
    } catch (error) {
      console.error('Error getting whatsapp settings:', error);
      throw error;
    }
  },

  async updateSettings(uid: string, settings: Partial<WhatsAppSettings>) {
    try {
      await apiFetch('/whatsapp/settings', {
        method: 'PUT',
        body: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Error updating whatsapp settings:', error);
      throw error;
    }
  },

  async triggerMessage(
    type: WhatsAppMessageType,
    recipientNumber: string,
    recipientName: string,
    variables: Record<string, string>
  ) {
    // Note: uid is not strictly needed here since apiFetch uses the token
    try {
      const settings = await apiFetch('/whatsapp/settings');
      if (!settings || !settings.enabled || !settings.instanceName) return;

      let content = settings.templates[type];
      
      // Replace variables
      Object.entries(variables).forEach(([key, value]) => {
        content = content.replace(new RegExp(`{${key}}`, 'g'), value);
      });

      // Send via Evolution API
      const response = await fetch(`${EVOLUTION_API_URL}/message/sendText/${settings.instanceName}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          number: recipientNumber.replace(/\D/g, ''),
          text: content
        })
      });

      let messageId = null;
      if (response.ok) {
        const data = await response.json();
        messageId = data?.key?.id || data?.messageId || null;
      }

      const status = response.ok ? 'Enviada' : 'Falha';

      // Log the message
      await apiFetch('/whatsapp/messages', {
        method: 'POST',
        body: JSON.stringify({
          recipientNumber,
          recipientName,
          content,
          type,
          status,
          externalId: messageId
        })
      });

      console.log(`WhatsApp Message Triggered (${type}):`, content);
    } catch (error) {
      console.error('Error triggering whatsapp message:', error);
    }
  },

  async createInstance(uid: string) {
    const instanceName = `salao_${uid.substring(0, 8)}`;
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': EVOLUTION_API_KEY
        },
        body: JSON.stringify({
          instanceName,
          token: uid,
          qrcode: true
        })
      });

      if (!response.ok) throw new Error('Failed to create instance');
      
      await this.updateSettings(uid, { 
        instanceName,
        instanceStatus: 'connecting'
      });
      
      return instanceName;
    } catch (error) {
      console.error('Error creating instance:', error);
      throw error;
    }
  },

  async getQRCode(instanceName: string) {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connect/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });

      if (!response.ok) throw new Error('Failed to get QR Code');
      const data = await response.json();
      return data.base64; // Evolution API returns base64 in the response
    } catch (error) {
      console.error('Error fetching QR Code:', error);
      throw error;
    }
  },

  async checkStatus(instanceName: string) {
    try {
      const response = await fetch(`${EVOLUTION_API_URL}/instance/connectionStatus/${instanceName}`, {
        method: 'GET',
        headers: {
          'apikey': EVOLUTION_API_KEY
        }
      });

      if (!response.ok) return null;
      const data = await response.json();
      return data; // Returns { instance: { state: 'open' | 'close', ... } }
    } catch (error) {
      console.error('Error checking status:', error);
      return null;
    }
  }
};
