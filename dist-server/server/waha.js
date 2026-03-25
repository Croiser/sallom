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
            const response = await axios.get(`${this.apiUrl}/sessions/${sessionName}`);
            return response.data;
        }
        catch (error) {
            return { status: 'STOPPED' };
        }
    }
    async getQrCode(sessionName) {
        try {
            // WAHA returns QR code in PNG/Base64 or via specific endpoint
            const response = await axios.get(`${this.apiUrl}/sessions/${sessionName}/qr`, {
                responseType: 'arraybuffer'
            });
            return Buffer.from(response.data, 'binary').toString('base64');
        }
        catch (error) {
            console.error('Error fetching WAHA QR Code:', error);
            return null;
        }
    }
    async startSession(sessionName) {
        try {
            await axios.post(`${this.apiUrl}/sessions/start`, { name: sessionName });
            return true;
        }
        catch (error) {
            console.error('Error starting WAHA session:', error);
            return false;
        }
    }
    async sendTextMessage(sessionName, chatid, text) {
        try {
            // Chat ID usually is 551199999999@c.us
            const formattedChatId = chatid.includes('@') ? chatid : `${chatid}@c.us`;
            const processedText = WAHAService.applySpintax(text);
            const response = await axios.post(`${this.apiUrl}/sessions/${sessionName}/messages/text`, {
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
