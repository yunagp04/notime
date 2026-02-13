import { app } from '@azure/functions';
import sql from 'mssql';
import sqlConfig from '../db.Config.js';

app.http('deleteVocab', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const id = request.query.get('id');
        if (!id) {
            return { status: 400, body: 'Missing id' };
        }

        try {
            const userId = request.headers.get('x-ms-client-principal-id') || 'local-test-user';
            const id = request.query.get('id');

            let pool = await sql.connect(sqlConfig);
            await pool.request()
                .input('id', sql.UniqueIdentifier, id)
                .input('user_id', sql.NVarChar, userId)
                .query(`DELETE FROM dbo.LearningItem WHERE learning_item_id = @id AND user_id = @user_id`);

            return { status: 200, jsonBody: { message: 'ลบข้อมูลสำเร็จ!' } };
        } catch (error) {
            return { status: 500, body: error.message };
        } finally {
            await sql.close();
        }
    }
});