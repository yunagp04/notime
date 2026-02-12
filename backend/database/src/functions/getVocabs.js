const { app } = require('@azure/functions');
const { CosmosClient } = require('@azure/cosmos');

const client = new CosmosClient(process.env.COSMOS_CONNECTION_STRING);
const database = client.database('VocabDB');
const container = database.container('Words');

app.http('getVocabs', {
    methods: ['GET'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        const query = {
            query: 'SELECT * FROM c WHERE c.userId = @userId ORDER BY c.timestamp DESC',
            parameters: [
                { name: '@userId', value: 'user_test' }
            ]
        };

        const { resources } = await container.items.query(query).fetchAll();

        return {
            status: 200,
            jsonBody: resources
        };
    }
});