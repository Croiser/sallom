import axios from 'axios';
/**
 * WAHA (WhatsApp HTTP API) Service
 * Manages sessions, QR Code retrieval and message sending.
 */
export class WAHAService {
    constructor(apiUrl = process.env.WAHA_API_URL || 'http://waha:3000') {
        this.apiUrl = apiUrl;
    }
    /**
     * Generates a random delay between 15 and 45 seconds to avoid bans.
     */
    static getRandomDelay() {
        return Math.floor(Math.random() * (45000 - 15000 + 1) + 15000);
    }
    /**
     * Applies Spintax to a text. Example: {Olá|Oi|Tudo bem?} {Nome} -> Hello Name
     */
    static applySpintax(text) {
        const spintaxPattern = /\{([^{}]+)\}/g;
        return text.replace(spintaxPattern, (match, choices) => {
            const list = choices.split('|');
            return list[Math.floor(Math.random() * list.length)];
        });
    }
    async getSessionStatus(sessionName) {
        try {
            const response = await axios.get(`${this.apiUrl}/api/sessions/${sessionName}`);
            return response.data;
        }
        catch (error) {
            return { status: 'STOPPED' };
        }
    }
    async getQrCode(sessionName) {
        try {
            const response = await axios.post(`${this.apiUrl}/api/${sessionName}/auth/qr`, {}, {
                headers: { 'Accept': 'application/json' }
            });
            if (response.data && response.data.qr) {
                return response.data.qr;
            }
            return null;
        }
        catch (error) {
            console.error('Error fetching WAHA QR Code:', error.response?.data || error.message);
            return null;
        }
    }
    async startSession(sessionName) {
        try {
            await axios.post(`${this.apiUrl}/api/sessions/${sessionName}/start`);
            return true;
        }
        catch (error) {
            console.error('Error starting WAHA session:', error.response?.data || error.message);
            return false;
        }
    }
    async sendTextMessage(sessionName, chatid, text) {
        try {
            const formattedChatId = chatid.includes('@') ? chatid : `${chatid}@c.us`;
            const processedText = WAHAService.applySpintax(text);
            const response = await axios.post(`${this.apiUrl}/api/sendText`, {
                session: sessionName,
                chatId: formattedChatId,
                text: processedText
            });
            return response.data;
        }
        catch (error) {
            console.error('Error sending WAHA message:', error.response?.data || error.message);
            throw error;
        }
    }
}
