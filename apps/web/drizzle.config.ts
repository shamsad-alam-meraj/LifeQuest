import { defineConfig } from 'drizzle-kit';

// drizzle-kit does not read Next.js env files by default
for (const f of ['.env.local', '.env']) {
  try { process.loadEnvFile(f); } catch { /* file not present */ }
}

export default defineConfig({
  schema: './src/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  schemaFilter: ['public'], // never touch Supabase's auth/storage schemas
  dbCredentials: { url: process.env.DATABASE_URL ?? '' },
});
