export interface AuthUserData {
    providerId: string;
    displayName: string;
    email?: string;
}

export interface IAuthStrategy {
    getUserInfo(requestSource: any): AuthUserData | null;
}