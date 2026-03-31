import axios from 'axios';

/**
 * WAHA (WhatsApp HTTP API) Service
 * Manages sessions, QR Code retrieval and message sending.
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
      'X-Api-Key': this.apiKey,
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
      const response = await axios.get(`${this.apiUrl}/api/sessions/${sessionName}`, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error) {
      return { status: 'STOPPED' };
    }
  }

  async getQrCode(sessionName: string = 'default') {
    try {
      const response = await axios.get(`${this.apiUrl}/api/${sessionName}/auth/qr`, {
        headers: { 
          'X-Api-Key': this.apiKey
        },
        responseType: 'arraybuffer'
      });
      return Buffer.from(response.data, 'binary').toString('base64');
    } catch (error: any) {
      console.error('Error fetching WAHA QR Code:', error.response?.data || error.message);
      return null;
    }
  }

  async startSession(sessionName: string = 'default') {
    try {
      await axios.post(`${this.apiUrl}/api/sessions/${sessionName}/start`, {}, {
        headers: this.getHeaders()
      });
      return true;
    } catch (error: any) {
      console.error('Error starting WAHA session:', error.response?.data || error.message);
      return false;
    }
  }

  async sendTextMessage(sessionName: string = 'default', chatid: string, text: string) {
    try {
      const formattedChatId = chatid.includes('@') ? chatid : `${chatid}@c.us`;
      const processedText = WAHAService.applySpintax(text);

      const response = await axios.post(`${this.apiUrl}/api/sendText`, {
        session: sessionName,
        chatId: formattedChatId,
        text: processedText
      }, {
        headers: this.getHeaders()
      });
      return response.data;
    } catch (error: any) {
      console.error('Error sending WAHA message:', error.response?.data || error.message);
      throw error;
    }
  }
}
