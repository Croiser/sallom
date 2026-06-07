import prisma from '../db.js';

export interface EnqueueMessageParams {
  ownerUid: string;
  recipientNumber: string;
  recipientName?: string;
  content: string;
  type?: string;
}

export const whatsappQueueService = {
  /**
   * Enqueue a message to be sent asynchronously by the worker.
   */
  async enqueueMessage(params: EnqueueMessageParams) {
    try {
      const message = await prisma.whatsappMessage.create({
        data: {
          ownerUid: params.ownerUid,
          recipientNumber: params.recipientNumber,
          recipientName: params.recipientName,
          content: params.content,
          type: params.type || 'text',
          status: 'pending',
          direction: 'outbound',
          retryCount: 0
        }
      });
      console.log(`[WhatsApp Queue] Message enqueued for ${params.recipientNumber} (ID: ${message.id})`);
      return message;
    } catch (error) {
      console.error('[WhatsApp Queue] Failed to enqueue message:', error);
      throw error;
    }
  }
};
