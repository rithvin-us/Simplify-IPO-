// Idempotent migration runner: applies database/schema.sql as the base, then
// database/migrations/*.sql in filename order, tracking each in
// schema_migrations. Run via `npm run migrate` or automatically at startup
// when RUN_MIGRATIONS=1.
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/db');

async function runMigrations() {
  await pool.query(
    `CREATE TABLE IF NOT EXISTS schema_migrations (
       name TEXT PRIMARY KEY,
       applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
     )`,
  );

  const dbDir = path.join(__dirname, '..', '..', 'database');
  const files = [['000_base.sql', path.join(dbDir, 'schema.sql')]];
  const migDir = path.join(dbDir, 'migrations');
  if (fs.existsSync(migDir)) {
    for (const f of fs.readdirSync(migDir).sort()) {
      if (f.endsWith('.sql')) files.push([f, path.join(migDir, f)]);
    }
  }

  for (const [name, file] of files) {
    const { rows } = await pool.query('SELECT 1 FROM schema_migrations WHERE name = $1', [name]);
    if (rows.length) continue;
    const sql = fs.readFileSync(file, 'utf8');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations (name) VALUES ($1)', [name]);
      await client.query('COMMIT');
      console.log(`migration applied: ${name}`);
    } catch (e) {
      await client.query('ROLLBACK');
      throw new Error(`migration ${name} failed: ${e.message}`);
    } finally {
      client.release();
    }
  }
}

if (require.main === module) {
  runMigrations()
    .then(() => { console.log('migrations up to date'); process.exit(0); })
    .catch((e) => { console.error(e.message); process.exit(1); });
}

module.exports = { runMigrations };
