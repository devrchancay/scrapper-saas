import {
  pgTable,
  integer,
  text,
  varchar,
  jsonb,
  timestamp,
} from 'drizzle-orm/pg-core';

export const scrapingConfigs = pgTable('scraping_configs', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  url: varchar({ length: 2048 }).notNull(),
  selector: varchar({ length: 512 }).notNull(),
  minutes: integer().notNull().default(5),
  lastRun: timestamp('last_run'),
  error: text(),
});

export const scrapingResults = pgTable('scraping_results', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  configId: integer('config_id')
    .notNull()
    .references(() => scrapingConfigs.id, { onDelete: 'cascade' }),
  content: jsonb().notNull(),
  hash: varchar({ length: 64 }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});
