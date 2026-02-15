const sqlConfig = {
    user: process.env.SQL_USER,
    password: process.env.SQL_PASSWORD,
    database: process.env.SQL_DATABASE,
    server: process.env.SQL_SERVER,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

const cosmosConfig = {
    endpoint: process.env.COSMOS_ENDPOINT,
    key: process.env.COSMOS_KEY,
    databaseId: process.env.COSMOS_DATABASE,
    containerId: process.env.COSMOS_CONTAINER
};


export default sqlConfig;

// export { cosmosConfig };