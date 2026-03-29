import { Request, Response, NextFunction } from 'express';
import { SqlVocabRepository } from '../repositories/SqlVocabRepository';

const repo = new SqlVocabRepository();

/**
 * Middleware to handle Azure Easy Auth and automatic user registration.
 * This ensures any user logged in via Azure can use the app immediately.
 */
export const azureAuthMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    // Extract unique principal ID provided by Azure App Service Authentication
    const providerId = req.header('x-ms-client-principal-id');
    const principalName = req.header('x-ms-client-principal-name'); // Usually email or username

    if (!providerId) {
        return res.status(401).json({ error: "Unauthorized: Azure Authentication header missing." });
    }

    try {
        // Step 1: Check if the user is already registered in our system
        let user = await repo.getUserByAuthProviderID(providerId);

        // Step 2: If the user is new, perform automatic registration
        if (!user) {
            console.info(`Registering new Azure user: ${principalName}`);
            user = await repo.registerNewUser({
                providerUserId: providerId,
                provider: 'AzureAd',
                name: principalName || 'New User',
                email: principalName || '' 
            });
        }

        // Step 3: Attach the internal UUID to the request body for downstream controllers
        // Note: Using the correct property name 'user_id' returned from the Repository
        req.body.userId = user.user_id || user.userID; 
        
        next();
    } catch (error) {
        console.error("Authentication Middleware Error:", error);
        res.status(500).json({ error: "Internal Server Error during user identity resolution." });
    }
};