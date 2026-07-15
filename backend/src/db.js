// PostgreSQL connection pool. Replaces the Phase 1 in-memory store as the
// single source of truth; database/schema.sql + database/migrations define
// the shapes.
const { Pool } = require('pg');

const DATABASE_URL = process.env.DATABASE_URL
  || 'postgres://ipow:ipow@127.0.0.1:5432/ipow';

const pool = new Pool({
  connectionString: DATABASE_URL,
  max: Number(process.env.PG_POOL_MAX || 10),
  idleTimeoutMillis: 30_000,
});

pool.on('error', (err) => {
  console.error('unexpected postgres pool error:', err.message);
});

const query = (text, params) => pool.query(text, params);

// Run fn(client) inside a transaction; rolls back on throw.
async function tx(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (e) {
    await client.query('ROLLBACK');
    throw e;
  } finally {
    client.release();
  }
}

module.exports = { pool, query, tx, DATABASE_URL };
