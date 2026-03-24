import { api } from './api';

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

export const whatsappService = {
  async getSettings(uid: string): Promise<WhatsAppSettings> {
    try {
      return await api.get('/whatsapp-settings');
    } catch (error) {
      console.error('Error getting whatsapp settings:', error);
      throw error;
    }
  },

  async updateSettings(uid: string, settings: Partial<WhatsAppSettings>) {
    try {
      await api.put('/whatsapp-settings', settings);
    } catch (error) {
      console.error('Error updating whatsapp settings:', error);
      throw error;
    }
  },

  async triggerMessage(
    uid: string,
    type: WhatsAppMessageType,
    recipientNumber: string,
    recipientName: string,
    variables: Record<string, string>
  ) {
    try {
      const settings = await this.getSettings(uid);
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

      // Log the message in Backend
      await api.post('/whatsapp-messages', {
        recipientNumber,
        recipientName,
        content,
        type,
        status,
        externalId: messageId
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
