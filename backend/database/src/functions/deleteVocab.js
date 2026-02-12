const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database('VocabDB');
const container = database.container('Words');

app.http('deleteVocab', {
    methods: ['DELETE'],
    authLevel: 'anonymous',
    handler: async (request) => {
        const id = request.query.get('id');
        const userId = 'user_test';

        if (!id) {
            return { status: 400, body: 'Missing id' };
        }

        await container.item(id, userId).delete();

        return {
            status: 200,
            jsonBody: { mesage: 'deleted' }
        };
    }
});