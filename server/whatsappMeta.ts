import axios from 'axios';

export interface MetaTemplateComponent {
  type: string;
  parameters: Array<{
    type: string;
    text?: string;
    [key: string]: any;
  }>;
}

export class WhatsAppMetaService {
  private accessToken: string;
  private phoneNumberId: string;
  private version: string;

  constructor(accessToken: string, phoneNumberId: string, version: string = 'v21.0') {
    this.accessToken = accessToken;
    this.phoneNumberId = phoneNumberId;
    this.version = version;
  }

  private get baseUrl() {
    return `https://graph.facebook.com/${this.version}/${this.phoneNumberId}`;
  }

  async sendTemplateMessage(to: string, templateName: string, languageCode: string = 'pt_BR', components: MetaTemplateComponent[] = []) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
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
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Meta WhatsApp API Error:', error.response?.data || error.message);
      throw error;
    }
  }

  async sendTextMessage(to: string, text: string) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to.replace(/\D/g, ''),
          type: 'text',
          text: {
            preview_url: false,
            body: text
          }
        },
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
            'Content-Type': 'application/json'
          }
        }
      );
      return response.data;
    } catch (error: any) {
      console.error('Meta WhatsApp API Error:', error.response?.data || error.message);
      throw error;
    }
  }
}
