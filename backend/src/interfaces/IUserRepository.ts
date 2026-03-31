export interface IUserRepository {
    getUserByAuthProviderID(providerId: string): Promise<any | null>;
    registerNewUser(authData: any): Promise<any>;
    saveSubscription(userId: string, sub: any): Promise<void>;
}