export interface INotificationRepository {
    saveSubscription(userId: string, subscription: any): Promise<void>;
    getSubscriptions(userId: string): Promise<any[]>;
    addToQueue(userId: string, itemId: string | null, scheduledAt: Date, message?: string): Promise<void>;
    getPendingQueue(): Promise<any[]>;
    updateQueueStatus(queueId: string, status: string): Promise<void>;
    getUsersWithDueItems(): Promise<any[]>;
    getDueCountForUser(userId: string): Promise<number>;

    getAllActiveSubscribers(): Promise<any[]>;
    getWordsForNotification(userId: string, mode: string, listId?: string, limit?: number): Promise<any[]>;
    updateNotificationSettings(userId: string, settings: any): Promise<void>;
}