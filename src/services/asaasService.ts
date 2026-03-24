import { apiFetch } from '../lib/api';

export interface AsaasPaymentResponse {
  id: string;
  status: 'PENDING' | 'RECEIVED' | 'CONFIRMED' | 'OVERDUE';
  invoiceUrl: string;
  pixQrCode?: string;
  pixCopyPaste?: string;
}

export const asaasService = {
  async createPixPayment(amount: number, customerInfo: { name: string, cpfCnpj: string, phone: string }, planId: string, billingCycle: string): Promise<AsaasPaymentResponse> {
    return apiFetch('/asaas/pix', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        customerInfo,
        planId,
        billingCycle
      })
    });
  },

  async createCardPayment(amount: number, customerInfo: { name: string, cpfCnpj: string, phone: string }, card: any, holderInfo: any, planId: string, billingCycle: string): Promise<AsaasPaymentResponse> {
    return apiFetch('/asaas/card', {
      method: 'POST',
      body: JSON.stringify({
        amount,
        customerInfo,
        card,
        holderInfo,
        planId,
        billingCycle
      })
    });
  },

  async checkPaymentStatus(paymentId: string): Promise<'PENDING' | 'CONFIRMED'> {
    // This could still be used for polling if needed, but webhooks are better
    const response = await apiFetch(`/subscription`); // Just to refresh state
    return response.subscription ? 'CONFIRMED' : 'PENDING';
  }
};
