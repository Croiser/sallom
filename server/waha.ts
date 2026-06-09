import axios from 'axios';

/**
 * WAHA / Evolution API Service
 * Manages sessions, QR Code retrieval and message sending.
 * Now using Evolution API under the hood for multi-tenancy.
 */
export class WAHAService {
  private apiUrl: string;
  private apiKey: string;

  constructor(apiUrl: string = process.env.WAHA_API_URL || 'http://waha:3000') {
    this.apiUrl = apiUrl;
    this.apiKey = process.env.WAHA_API_KEY || 'waha_secret_key_2024';
  }

  private getHeaders() {
    return {
      'apikey': this.apiKey,
      'Accept': 'application/json'
    };
  }

  /**
   * Generates a random delay between 15 and 45 seconds to avoid bans.
   */
  static getRandomDelay(): number {
    return Math.floor(Math.random() * (45000 - 15000 + 1) + 15000);
  }

  /**
   * Applies Spintax to a text. Example: {Olá|Oi|Tudo bem?} {Nome} -> Hello Name
   */
  static applySpintax(text: string): string {
    const spintaxPattern = /\{([^{}]+)\}/g;
    return text.replace(spintaxPattern, (match, choices) => {
      const list = choices.split('|');
      return list[Math.floor(Math.random() * list.length)];
    });
  }

  async getSessionStatus(sessionName: string = 'default') {
    try {
      const response = await axios.get(`${this.apiUrl}/instance/connectionState/${sessionName}`, {
        headers: this.getHeaders()
      });
      // Evolution returns: { instance: { state: "open" } }
      const state = response.data?.instance?.state || response.data?.state;
      if (state === 'open') return { status: 'WORKING' };
      if (state === 'connecting') return { status: 'STARTING' };
      return { status: 'SCAN_QR_CODE' };
    } catch (error) {
      return { status: 'STOPPED' };
    }
  }

  async getQrCode(sessionName: string = 'default') {
    try {
      const response = await axios.get(`${this.apiUrl}/instance/connect/${sessionName}`, {
        headers: this.getHeaders()
      });
      // Evolution returns { base64: "data:image/png;base64,iVBORw0..." }
      if (response.data?.base64) {
        // Strip the data:image/png;base64, prefix if we want raw base64, but the frontend might expect it or not
        // Current WAHA implementation returned raw base64. Let's strip prefix if it exists.
        const base64Str = response.data.base64;
        return base64Str.replace(/^data:image\/(png|jpeg);base64,/, '');
      }
      return null;
    } catch (error: any) {
      console.error('Error fetching QR Code:', error.response?.data || error.message);
      return null;
    }
  }

  async startSession(sessionName: string = 'default') {
    try {
      // First, check if session exists by trying to create it
      await axios.post(`${this.apiUrl}/instance/create`, {
        instanceName: sessionName,
        qrcode: true,
        integration: "WHATSAPP-BAILEYS"
      }, {
        headers: this.getHeaders()
      });
      return true;
    } catch (error: any) {
      // If it already exists, Evolution throws an error, which is fine, it means it's started
      console.error('Info: Session might already exist, proceeding...', error.response?.data || error.message);
      return true;
    }
  }

  async logout(sessionName: string = 'default') {
    try {
      await axios.delete(`${this.apiUrl}/instance/logout/${sessionName}`, {
        headers: this.getHeaders()
      });
      return true;
    } catch (error: any) {
      console.error('Error logging out session:', error.response?.data || error.message);
      return false;
    }
  }

  async sendTextMessage(sessionName: string = 'default', chatid: string, text: string) {
    try {
      // Clean chatid to only numbers
      const formattedChatId = chatid.replace(/\D/g, '');
      const processedText = WAHAService.applySpintax(text);

      const response = await axios.post(`${this.apiUrl}/message/sendText/${sessionName}`, {
        number: formattedChatId,
        textMessage: {
          text: processedText
        }
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending message:', error.response?.data || error.message);
      throw error;
    }
  }

  async getChats(sessionName: string = 'default') {
    return []; // Optional for Evolution, mostly used for Webhooks
  }

  async getChatMessages(sessionName: string = 'default', chatId: string) {
    return [];
  }
}
