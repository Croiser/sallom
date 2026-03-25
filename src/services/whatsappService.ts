import { api } from './api';

export type WhatsAppMessageType = 'welcome' | 'reminder' | 'confirmation';

export interface WhatsAppSettings {
  enabled: boolean;
  templates: {
    welcome: string;
    reminder: string;
    confirmation: string;
  };
  apiKey?: string; // This will be the Meta Access Token
  phoneNumberId?: string;
  wabaId?: string;
}

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

  async testMessage(number: string, templateName: string, languageCode: string = 'pt_BR', components: any[] = []) {
    try {
      return await api.post('/whatsapp/test', {
        number,
        templateName,
        languageCode,
        components
      });
    } catch (error) {
      console.error('Error testing whatsapp message:', error);
      throw error;
    }
  },

  async triggerMessage(
    recipientNumber: string,
    recipientName: string,
    type: string,
    variables: Record<string, any>
  ) {
    try {
      return await api.post('/whatsapp/trigger', {
        recipientNumber,
        recipientName,
        type,
        variables
      });
    } catch (error) {
      console.error('Error triggering whatsapp message:', error);
      throw error;
    }
  }
};
