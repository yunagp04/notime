import sql from "mssql";

async function getUserIdFromProvider(pool, providerUserId) {
  const result = await pool
    .request()
    .input("provider_user_id", sql.NVarChar, providerUserId)
    .query(`
      SELECT user_id
      FROM dbo.UserAuthProvider
      WHERE provider_user_id = @provider_user_id
    `);

  if (result.recordset.length > 0) {
      return result.recordset[0].user_id;
  }

  const newUserId = crypto.randomUUID();

  await pool.request()
    .input("user_id", sql.UniqueIdentifier, newUserId)
    .input("providerId", sql.NVarChar, providerId)
    .query(`
      INSERT INTO UserAuth (user_id, provider_user_id, created_at)
      VALUES (@user_id, @providerId, GETUTCDATE())
    `);

  return newUserId;
  
}

export default getUserIdFromProvider;