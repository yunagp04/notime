const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database('VocabDB');
const container = database.container('Words');

app.http('saveVocab', {
    methods: ['POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {

        //log
        context.log("saveVocab called");

        try {
            const body = await request.json();

            //log
            context.log("body: ", body);

            const { word, meaning, sentence } = body;

            const newItem = {
                id: Date.now().toString(),
                userId: "user_test",
                word,
                meaning,
                sentence,
                timestamp: new Date().toISOString()
            };

            const { resource } = await container.items.create(newItem);
            return {
                status: 201,
                jsonBody: { message: "สำเร็จ!", id: createdItem.id }
            };
        } catch (error) {
            context.log("ERROR:", error);
            return { status: 500, body: error.message };
        }
    }
});