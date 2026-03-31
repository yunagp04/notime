import sql from 'mssql';
import { poolPromise } from '../config/db';
import { v4 as uuidv4 } from 'uuid';

export class SqlUserRepository {
    
    constructor() {
        console.log("👤 SqlUserRepository Ready");
    }

    /**
     * Getter สำหรับดึง Request (Clean & No Stutter)
     */
    private get request() {
        return (async () => {
            const pool = await poolPromise;
            return pool.request();
        })();
    }

    // ==========================================
    // 🔐 SECTION: AUTHENTICATION & IDENTITY
    // ==========================================

    /**
     * หา User จาก Provider ID (เช่น Google ID จาก Azure Header)
     */
    async getUserByAuthProviderID(providerUserId: string): Promise<any | null> {
        const req = await this.request;
            const result = await req
                .input('providerUserId', sql.NVarChar, providerUserId)
                .query(`
                    SELECT u.* FROM [User] u
                    LEFT JOIN UserAuthProvider ap ON u.user_id = ap.user_id
                    WHERE ap.provider_user_id = @providerUserId
                `);
            return result.recordset[0];
    }

    /**
                        u.*, 
                        ap.provider_user_name
                    FROM [User] u
                    LEFT JOIN UserAuthProvider ap ON u.user_id = ap.user_id
                    WHERE u.email = @email
                `);
            return result.recordset[0];
    }

    /**
     * ลงทะเบียน User ใหม่ (ใช้ Transaction เพื่อความปลอดภัย)
     */
    async registerNewUser(authData: any): Promise<any> {
        const pool = await poolPromise;
        const userId = uuidv4();
        const transaction = new sql.Transaction(pool);

        try {
            await transaction.begin();

            // 1. สร้าง User Profile
            await transaction.request()
                .input("id", sql.UniqueIdentifier, userId)
                .input("email", sql.NVarChar, authData.email)
                .input("name", sql.NVarChar, authData.name)
                .query(`INSERT INTO [User] (user_id, email, display_name, created_at) 
                        VALUES (@id, @email, @name, GETDATE())`);

            // 2. ผูกข้อมูลการ Login (Auth Provider)
            await transaction.request()
                .input("authId", sql.UniqueIdentifier, uuidv4())
                .input("userId", sql.UniqueIdentifier, userId)
                .input("pname", sql.NVarChar, authData.provider || 'google')
                .input("puid", sql.NVarChar, authData.providerUserId)
                .query(`INSERT INTO UserAuthProvider (user_auth_id, user_id, provider_name, provider_user_id, created_at) 
                        VALUES (@authId, @userId, @pname, @puid, GETDATE())`);

            await transaction.commit();
            return { user_id: userId, ...authData };

        } catch (err) {
            await transaction.rollback();
            console.error("❌ Register User Failed:", err);
            throw err;
        }
    }

    // ==========================================
    // 🔔 SECTION: NOTIFICATIONS & SUBSCRIPTIONS
    // ==========================================

    /**
     * บันทึกข้อมูล Push Subscription สำหรับแจ้งเตือน
     */
    async saveSubscription(userId: string, sub: any): Promise<void> {
        const req = await this.request;
        await req
            .input('userId', sql.UniqueIdentifier, userId)
            .input('endpoint', sql.NVarChar, sub.endpoint)
            .input('p256dh', sql.NVarChar, sub.keys.p256dh)
            .input('auth', sql.NVarChar, sub.keys.auth)
            .query(`
                IF EXISTS (SELECT 1 FROM PushSubscription WHERE endpoint = @endpoint)
                    UPDATE PushSubscription SET user_id = @userId WHERE endpoint = @endpoint
                ELSE
                    INSERT INTO PushSubscription (user_id, endpoint, p256dh_key, auth_key, created_at)
                    VALUES (@userId, @endpoint, @p256dh, @auth, GETDATE())
            `);
    }
}