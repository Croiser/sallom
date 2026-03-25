import axios from 'axios';
export class WhatsAppMetaService {
    constructor(accessToken, phoneNumberId, version = 'v21.0') {
        this.accessToken = accessToken;
        this.phoneNumberId = phoneNumberId;
        this.version = version;
    }
    get baseUrl() {
        return `https://graph.facebook.com/${this.version}/${this.phoneNumberId}`;
    }
    async sendTemplateMessage(to, templateName, languageCode = 'pt_BR', components = []) {
        try {
            const response = await axios.post(`${this.baseUrl}/messages`, {
                messaging_product: 'whatsapp',
                to: to.replace(/\D/g, ''),
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode
                    },
                    components
                }
            }, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Meta WhatsApp API Error:', error.response?.data || error.message);
            throw error;
        }
    }
    async sendTextMessage(to, text) {
        try {
            const response = await axios.post(`${this.baseUrl}/messages`, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to.replace(/\D/g, ''),
                type: 'text',
                text: {
                    preview_url: false,
                    body: text
                }
            }, {
                headers: {
                    Authorization: `Bearer ${this.accessToken}`,
                    'Content-Type': 'application/json'
                }
            });
            return response.data;
        }
        catch (error) {
            console.error('Meta WhatsApp API Error:', error.response?.data || error.message);
            throw error;
        }
    }
}
