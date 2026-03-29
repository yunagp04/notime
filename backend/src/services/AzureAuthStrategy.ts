import { IAuthStrategy, AuthUserData } from "../interfaces/IAuthStrategy";

export class AzureAuthStrategy implements IAuthStrategy {
    getUserInfo(headers: any): AuthUserData | null {
        const principleId = headers['x-ms-client-principle-id'];
        if (!principleId) return null;

        return {
            providerId: principleId,
            displayName: headers['x-ms-client-principle-name'] || 'Azure User',
            email: headers['x-ms-client-principle-idp']
        };
    }
}