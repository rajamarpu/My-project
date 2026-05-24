import { ensureAuthSchema } from './authSql.js'
import { pool } from './postgres.js'

try {
  await ensureAuthSchema()
  console.log('PostgreSQL connection OK. Database schema is ready.')
} catch (error) {
  if (error?.code === 'ECONNREFUSED') {
    console.error('PostgreSQL is not running on localhost:5432.')
    console.error('Install/start PostgreSQL, then run: npm run db:check')
  } else {
    console.error(error?.message || error)
  }
  process.exitCode = 1
} finally {
  await pool.end().catch(() => {})
}
