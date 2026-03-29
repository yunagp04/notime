import mssql from 'mssql';
import dotenv from 'dotenv';
dotenv.config();

export const dbConfig: mssql.config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER!,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true,
        trustServerCertificate: false,
        connectTimeout: 30000,
        requestTimeout: 30000
    },
    pool: {
        max: 10,
        min: 0,
        idleTimeoutMillis: 30000
    }
};

export const poolPromise = new mssql.ConnectionPool(dbConfig)
    .connect()
    .then(pool => {
        console.log('Connect to SQL Server');
        return pool;
    })
    .catch(err => {
        console.error('Database Coneection Failed!', err);
        throw err;
    });