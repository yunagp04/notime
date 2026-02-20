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

  if (result.recordset.length === 0) {
    throw new Error("User not found");
  }

  return result.recordset[0].user_id;
}

export default getUserIdFromProvider;