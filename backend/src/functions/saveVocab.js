import { app } from '@azure/functions';
import sql from 'mssql';
import sqlConfig from '../db.Config.js';


app.http('saveVocab', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log("saveVocab (SQL Version) started");

        try {
            const userId = request.headers.get('x-ms-client-principal-id') || 'local-test-user';
            
            const body = await request.json();
            const { title, content, language, metadata } = body;

            let pool = await sql.connect(sqlConfig);  

            const result = await pool.request()
                .input('user_id', sql.NVarChar, userId)
                .input('item_type', sql.NVarChar, 'vocabulary')
                .input('title', sql.NVarChar, title)
                .input('content', sql.NVarChar, content)
                .input('language', sql.NVarChar, language || 'en')
                .input('metadata', sql.NVarChar, metadata || null)
                .query(`
                    DECLARE @newId UNIQUEIDENTIFIER = NEWID();

                    INSERT INTO dbo.LearningItem (
                        learning_item_id, item_type, title, content,
                        language, metadata, created_at, updated_at
                    )
                    VALUES (
                        @newId, @item_type, @title, @content,
                        @language, @metadata, GETUTCDATE(), GETUTCDATE()
                    );

                    SELECT @newId AS id;
                `);
            return {
                status: 201,
                jsonBody: {
                    message: "บันทึกสำเร็จ!",
                    id: result.recordset[0].id,
                    user: userId
                }
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