const ASAAS_API_KEY = process.env.ASAAS_API_KEY;
const ASAAS_API_URL = process.env.ASAAS_API_URL || 'https://sandbox.asaas.com/api/v3';
async function asaasFetch(endpoint, options = {}) {
    if (!ASAAS_API_KEY) {
        throw new Error('ASAAS_API_KEY is not configured');
    }
    const response = await fetch(`${ASAAS_API_URL}${endpoint}`, {
        ...options,
        headers: {
            'access_token': ASAAS_API_KEY,
            'Content-Type': 'application/json',
            ...options.headers,
        },
    });
    const data = await response.json();
    if (!response.ok) {
        console.error('Asaas API Error:', data);
        throw new Error(data.errors?.[0]?.description || 'Error calling Asaas API');
    }
    return data;
}
export const asaas = {
    async getOrCreateCustomer(name, cpfCnpj, email, phone) {
        // Search for existing customer in Asaas by CPF/CNPJ
        const search = await asaasFetch(`/customers?cpfCnpj=${cpfCnpj.replace(/\D/g, '')}`);
        if (search.data && search.data.length > 0) {
            return search.data[0].id;
        }
        // Create new customer
        const customer = await asaasFetch('/customers', {
            method: 'POST',
            body: JSON.stringify({
                name,
                email,
                phone,
                cpfCnpj: cpfCnpj.replace(/\D/g, ''),
                notificationDisabled: true,
            }),
        });
        return customer.id;
    },
    async createPixPayment(customerId, amount, externalReference) {
        const payment = await asaasFetch('/payments', {
            method: 'POST',
            body: JSON.stringify({
                customer: customerId,
                billingType: 'PIX',
                value: amount,
                dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 24h from now
                externalReference,
            }),
        });
        // Get Pix QR Code
        const pixData = await asaasFetch(`/payments/${payment.id}/pixQrCode`);
        return {
            id: payment.id,
            status: payment.status,
            invoiceUrl: payment.invoiceUrl,
            pixQrCode: pixData.encodedImage,
            pixCopyPaste: pixData.payload,
        };
    },
    async createCardPayment(customerId, amount, externalReference, card, creditCardHolderInfo) {
        const payment = await asaasFetch('/payments', {
            method: 'POST',
            body: JSON.stringify({
                customer: customerId,
                billingType: 'CREDIT_CARD',
                value: amount,
                dueDate: new Date().toISOString().split('T')[0],
                externalReference,
                creditCard: card,
                creditCardHolderInfo,
            }),
        });
        return {
            id: payment.id,
            status: payment.status,
            invoiceUrl: payment.invoiceUrl,
        };
    }
};
