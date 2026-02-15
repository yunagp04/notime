import { app } from '@azure/functions';
import sql from 'mssql';
import sqlConfig from '../db.Config.js';

app.http('updateVocab', {
    methods: ['PUT'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log("updateVocab (SQL Version with Auth) started");

        try {
            
            const userId = request.headers.get('x-ms-client-principal-id') || 'local-test-user';
            
            const body = await request.json();
            const { id, title, content } = body;

            if (!id) {
                return { status: 400, body: "Missing vocabulary ID" };
            }

            let pool = await sql.connect(sqlConfig);

           
            const result = await pool.request()
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

            
            if (result.rowsAffected[0] === 0) {
                return { 
                    status: 404, 
                    jsonBody: { message: "ไม่พบข้อมูล หรือคุณไม่มีสิทธิ์แก้ไขคำศัพท์นี้" } 
                };
            }

            return {
                status: 200,
                jsonBody: { message: "อัปเดตคำศัพท์สำเร็จ!" }
            };

        } catch (error) {
            context.log("SQL ERROR:", error);
            return {
                status: 500,
                body: "Error: " + error.message
            };
        } finally {
            await sql.close();
        }
    }
});