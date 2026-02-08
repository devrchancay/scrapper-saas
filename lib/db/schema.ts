import {
  pgTable,
  integer,
  text,
  uuid,
  varchar,
  jsonb,
  timestamp,
  boolean,
} from 'drizzle-orm/pg-core';

// ── Better Auth tables ──────────────────────────────────────────────

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').notNull().default(false),
  image: text('image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const session = pgTable('session', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  token: text('token').notNull().unique(),
  expiresAt: timestamp('expires_at').notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const account = pgTable('account', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  accountId: text('account_id').notNull(),
  providerId: text('provider_id').notNull(),
  accessToken: text('access_token'),
  refreshToken: text('refresh_token'),
  idToken: text('id_token'),
  accessTokenExpiresAt: timestamp('access_token_expires_at'),
  refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
  scope: text('scope'),
  password: text('password'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const verification = pgTable('verification', {
  id: text('id').primaryKey(),
  identifier: text('identifier').notNull(),
  value: text('value').notNull(),
  expiresAt: timestamp('expires_at').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// ── API Keys ────────────────────────────────────────────────────────

export const apiKey = pgTable('api_key', {
  id: text('id').primaryKey(),
  key: varchar('key', { length: 128 }).notNull().unique(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
});

// ── Application tables ──────────────────────────────────────────────

export const scrapingConfigs = pgTable('scraping_configs', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  publicId: uuid('public_id').notNull().unique().defaultRandom(),
  userId: text('user_id')
    .notNull()
    .references(() => user.id, { onDelete: 'cascade' }),
  url: varchar({ length: 2048 }).notNull(),
  selector: varchar({ length: 512 }).notNull(),
  prompt: text('prompt').notNull().default('Extract structured data from the following markdown content. Return valid JSON.'),
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
