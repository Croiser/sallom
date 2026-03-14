/**
 * Mock service for Asaas integration
 */

export interface AsaasPaymentResponse {
  id: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE';
  invoiceUrl: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
}

export const asaasService = {
  async createPixPayment(amount: number, customer: { name: string, cpfCnpj: string, phone: string }): Promise<AsaasPaymentResponse> {
    console.log('Creating Pix payment for:', customer.name, 'Amount:', amount);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    return {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      status: 'PENDING',
      invoiceUrl: 'https://www.asaas.com/i/123456789',
      pixQrCode: '00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5925NOME_DO_RECEBEDOR6009SAO_PAULO62070503***6304ABCD',
      pixCopyPaste: '00020126360014br.gov.bcb.pix0114+5511999999999520400005303986540510.005802BR5925NOME_DO_RECEBEDOR6009SAO_PAULO62070503***6304ABCD'
    };
  },

  async createCardPayment(amount: number, customer: { name: string, cpfCnpj: string, phone: string }, card: any): Promise<AsaasPaymentResponse> {
    console.log('Creating Card payment for:', customer.name, 'Amount:', amount);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      id: 'pay_' + Math.random().toString(36).substr(2, 9),
      status: 'CONFIRMED',
      invoiceUrl: 'https://www.asaas.com/i/123456789'
    };
  },

  async checkPaymentStatus(paymentId: string): Promise<'PENDING' | 'CONFIRMED'> {
    // In a real app, this would poll the Asaas API or wait for a webhook
    return 'CONFIRMED';
  }
};
