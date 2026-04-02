export interface IUserRepository {
    getUserByAuthProviderID(userId: string): Promise<any | null>; // 🚩 ใช้ ID ตัวใหญ่
    registerNewUser(userData: { 
        email: string; 
        name: string; 
        provider: string; 
        providerUserId: string 
    }): Promise<any>;
    saveSubscription(userId: string, sub: any): Promise<void>;
}