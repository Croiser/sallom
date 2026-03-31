import { api } from './api';

export interface SendMessagePayload {
  chatId: string;
  text: string;
  session?: string;
}

export interface SendMessageResponse {
  id?: string;
  status?: string;
  error?: string;
}

export const whatsappChatService = {
  async sendMessage(payload: SendMessagePayload): Promise<SendMessageResponse> {
    try {
      const response = await api.post('/whatsapp/waha/send', {
        chatId: payload.chatId,
        text: payload.text,
        session: payload.session || 'default'
      });
      return response;
    } catch (error: any) {
      console.error('Error sending WhatsApp message:', error);
      return { 
        error: error.response?.data?.message || error.message || 'Failed to send message' 
      };
    }
  },

  async getChatHistory(chatId: string): Promise<any[]> {
    try {
      const response = await api.get(`/whatsapp/messages/${chatId}`);
      return response;
    } catch (error) {
      console.error('Error fetching chat history:', error);
      return [];
    }
  },

  async getChats(): Promise<any[]> {
    try {
      const response = await api.get('/whatsapp/chats');
      return response;
    } catch (error) {
      console.error('Error fetching chats:', error);
      return [];
    }
  }
};