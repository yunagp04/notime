import { app } from '@azure/functions';
import sql from 'mssql';
import sqlConfig from '../db.Config.js';

app.http('updateVocab', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        try {
            const userId = request.headers.get('x-ms-client-principal-id') || 'local-test-user';
            const body = await request.json();
            const { id, title, content } = body;

            if (!id) return { status: 400, body: "Missing id" };

            let pool = await sql.connect(sqlConfig);
            await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('user_id', sql.NVarChar, userId)
                .input('title', sql.NVarChar, title)
                .input('content', sql.NVarChar, content)
                .query(`
                    UPDATE dbo.LearningItem 
                    SET title = @title, 
                        content = @content, 
                        updated_at = GETUTCDATE() 
                    WHERE learning_item_id = @id AND user_id = @user_id
                `);

            return { status: 200, jsonBody: { message: "อัปเดตสำเร็จ!" } };
        } catch (error) {
            return { status: 500, body: error.message };
        } finally {
            await sql.close();
        }
    }
});