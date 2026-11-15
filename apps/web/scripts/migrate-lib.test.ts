import { describe, expect, it } from 'vitest';
import { decide } from './migrate-lib.mjs';

const URL = 'postgresql://u:p@host:6543/db';

describe('deploy-time migration decision', () => {
  it('migrates on production deploys', () => {
    expect(decide({ DATABASE_URL: URL, VERCEL_ENV: 'production' })).toMatchObject({ run: true });
  });
  it('never migrates previews unless explicitly opted in', () => {
    expect(decide({ DATABASE_URL: URL, VERCEL_ENV: 'preview' }).run).toBe(false);
    expect(decide({ DATABASE_URL: URL, VERCEL_ENV: 'preview', MIGRATE_ON_PREVIEW: 'true' }).run).toBe(true);
  });
  it('does nothing locally or in CI (no VERCEL_ENV), so tests and builds never touch a database', () => {
    expect(decide({ DATABASE_URL: URL }).run).toBe(false);
  });
  it('skips with a warning, without failing, when the database is not configured', () => {
    expect(decide({ VERCEL_ENV: 'production' })).toMatchObject({ run: false, warn: true });
    expect(decide({ VERCEL_ENV: 'production', DATABASE_URL: 'postgresql://u:[YOUR-PASSWORD]@h/db' })).toMatchObject({ run: false, warn: true });
  });
  it('has an escape hatch', () => {
    expect(decide({ DATABASE_URL: URL, VERCEL_ENV: 'production', SKIP_MIGRATIONS: '1' }).run).toBe(false);
  });
});
