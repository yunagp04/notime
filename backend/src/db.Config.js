import sql from 'mssql';

// export const DATABASE_TYPE = process.env.DATABASE_TYPE || 'MSSQL';

export const sqlConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false
    }
};

export const cosmosConfig = {
    connectionString: process.env.COSMOS_CONNECTION_STRING
};

export default sqlConfig;