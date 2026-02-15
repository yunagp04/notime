import { app } from '@azure/functions';
import sql from 'mssql';
import sqlConfig from '../db.Config.js';

app.http('getVocabs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const userId = request.headers.get('x-ms-client-principal-id') || 'local-test-user';
            let pool = await sql.connect(sqlConfig);
            const result = await pool.request()
                .input('user_id', sql.NVarChar, userId)
                .query("SELECT learning_item_id as id, title, content FROM dbo.LearningItem WHERE user_id = @user_id ORDER BY created_at DESC");
            return { status: 200, jsonBody: result.recordset };
        } catch (error) {
            return { status: 500, body: error.message };
        } finally { await sql.close(); }
    }
});