import { defineConfig, env } from 'prisma/config'
import dotenv from 'dotenv'

dotenv.config({ path: new URL('./.env', import.meta.url) })

export default defineConfig({
  datasources: {
    db: {
      url: env('DATABASE_URL')
    }
  }
})
