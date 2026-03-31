export interface INotificationRepository {
    saveSubscription(userId: string, subscription: any): Promise<void>;
    getSubscriptions(userId: string): Promise<any[]>;
    addToQueue(userId: string, itemId: string, scheduledAt: Date): Promise<void>;
    getPendingQueue(): Promise<any[]>;
    updateQueueStatus(queueId: string, status: string): Promise<void>;
}