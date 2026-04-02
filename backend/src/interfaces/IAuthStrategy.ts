export interface AuthUserData {
    providerId: string;
    displayName: string;
    email?: string;
}

export interface IAuthStrategy {
    getUserInfo(headers: any): Promise<AuthUserData | null>;
}