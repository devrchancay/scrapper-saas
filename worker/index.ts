import 'dotenv/config';
import cron from 'node-cron';
import { or, isNull, sql } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scrapingConfigs } from '@/lib/db/schema';
import { scrapeConfig, closeBrowser } from '@/lib/scraper';

console.log('Worker started. Checking for due configs every minute.');

cron.schedule('* * * * *', async () => {
  console.log(`[${new Date().toISOString()}] Tick: checking for due configs...`);

  try {
    const dueConfigs = await db
      .select()
      .from(scrapingConfigs)
      .where(
        or(
          isNull(scrapingConfigs.lastRun),
          sql`${scrapingConfigs.lastRun} <= now() - (${scrapingConfigs.minutes} || ' minutes')::interval`
        )
      );

    console.log(`Found ${dueConfigs.length} due config(s).`);

    for (const config of dueConfigs) {
      console.log(`Scraping config ${config.id}: ${config.url}`);
      await scrapeConfig(config.id);
    }
  } catch (err) {
    console.error('Worker tick error:', err);
  }
});

process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down...');
  await closeBrowser();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down...');
  await closeBrowser();
  process.exit(0);
});
