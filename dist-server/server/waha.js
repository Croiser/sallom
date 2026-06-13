import axios from 'axios';
/**
 * WAHA / Evolution API Service
 * Manages sessions, QR Code retrieval and message sending.
 * Now using Evolution API under the hood for multi-tenancy.
 */
export class WAHAService {
    constructor(apiUrl = process.env.WAHA_API_URL || 'http://waha:3000') {
        this.apiUrl = apiUrl;
        this.apiKey = process.env.WAHA_API_KEY || 'waha_secret_key_2024';
    }
    getHeaders() {
        return {
            'apikey': this.apiKey,
            'Accept': 'application/json'
        };
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
    async getSessionStatus(sessionName = 'default') {
        try {
            const response = await axios.get(`${this.apiUrl}/instance/connectionState/${sessionName}`, {
                headers: this.getHeaders()
            });
            // Evolution returns: { instance: { state: "open" } }
            const state = response.data?.instance?.state || response.data?.state;
            if (state === 'open')
                return { status: 'WORKING' };
            if (state === 'connecting')
                return { status: 'STARTING' };
            return { status: 'SCAN_QR_CODE' };
        }
        catch (error) {
            return { status: 'STOPPED' };
        }
    }
    async getQrCode(sessionName = 'default') {
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
        }
        catch (error) {
            console.error('Error fetching QR Code:', error.response?.data || error.message);
            return null;
        }
    }
    async startSession(sessionName = 'default') {
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
        }
        catch (error) {
            // If it already exists, Evolution throws an error, which is fine, it means it's started
            console.error('Info: Session might already exist, proceeding...', error.response?.data || error.message);
            return true;
        }
    }
    async logout(sessionName = 'default') {
        try {
            await axios.delete(`${this.apiUrl}/instance/logout/${sessionName}`, {
                headers: this.getHeaders()
            });
            return true;
        }
        catch (error) {
            console.error('Error logging out session:', error.response?.data || error.message);
            return false;
        }
    }
    async sendTextMessage(sessionName = 'default', chatid, text) {
        try {
            // Clean chatid to only numbers
            let formattedChatId = chatid.replace(/\D/g, '');
            if (formattedChatId.length === 10 || formattedChatId.length === 11) {
                formattedChatId = `55${formattedChatId}`;
            }
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
        }
        catch (error) {
            console.error('Error sending message:', error.response?.data || error.message);
            throw error;
        }
    }
    async getChats(sessionName = 'default') {
        return []; // Optional for Evolution, mostly used for Webhooks
    }
    async getChatMessages(sessionName = 'default', chatId) {
        return [];
    }
}
