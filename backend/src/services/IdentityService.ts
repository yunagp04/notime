import { IVocabRepository } from "../interfaces/IVocabRepository";
import { IAuthStrategy } from "../interfaces/IAuthStrategy";

export class IdentityService {
    constructor(
        private repo: IVocabRepository,
        private authStrategy: IAuthStrategy
    ) {}

    async verifyAndSyncUser(requestSource: any) {
        const authData = this.authStrategy.getUserInfo(requestSource);

        if (!authData) throw new Error("Unauthorized");

        let user = await this.repo.getUserByAuthProviderID(authData.providerId);

        if (!user) {
            user = await this.repo.registerNewUser({
                providerId: authData.providerId,
                name: authData.displayName
            });
        }
        return user;
    }
}