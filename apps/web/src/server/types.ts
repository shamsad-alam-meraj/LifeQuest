import type { PgDatabase } from 'drizzle-orm/pg-core';
import type * as schema from '../db/schema';

/** Any Drizzle Postgres database or transaction (postgres-js in production, PGlite in tests). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DB = PgDatabase<any, typeof schema>;
