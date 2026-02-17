// backend/src/db.Config.js

import sql from 'mssql';
import dotenv from "dotenv";
dotenv.config();

// MSSQL configuration
export const sqlConfig = {
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  server: process.env.DB_SERVER,
  database: process.env.DB_DATABASE,
  port: parseInt(process.env.DB_PORT) || 1433,
  options: {
    encrypt: true,
    trustServerCertificate: false,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool;

// Cosmos DB configuration (optional)
export const cosmosConfig = {
  connectionString: process.env.COSMOS_CONNECTION_STRING,
};

// helper function for connecting
export const connectDB = async () => {
  try {
    if (pool) {
      return pool;
    }

    pool = await sql.connect(sqlConfig);
    console.log("Connected to MSSQL (global pool)");
    return pool;
  } catch (err) {
    console.error("Database connection failed:", err);
    throw err;
  }
};