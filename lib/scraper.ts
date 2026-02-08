import fs from 'fs';

// Docker/Railway: browsers are installed at /ms-playwright during build
if (fs.existsSync('/ms-playwright')) {
  process.env.PLAYWRIGHT_BROWSERS_PATH = '/ms-playwright';
}

import { chromium, type Browser } from 'playwright';
import TurndownService from 'turndown';
import OpenAI from 'openai';
import { eq, desc } from 'drizzle-orm';
import { db } from '@/lib/db';
import { scrapingConfigs, scrapingResults } from '@/lib/db/schema';
import { sha256 } from '@/lib/hash';

const turndown = new TurndownService();

let browserInstance: Browser | null = null;

async function getBrowser(): Promise<Browser> {
  if (!browserInstance || !browserInstance.isConnected()) {
    browserInstance = await chromium.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
  }
  return browserInstance;
}

export async function scrapeConfig(configId: number): Promise<void> {
  const config = await db.query.scrapingConfigs.findFirst({
    where: eq(scrapingConfigs.id, configId),
  });
  if (!config) throw new Error(`Config ${configId} not found`);

  try {
    const browser = await getBrowser();
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
    });

    await page.goto(config.url, { waitUntil: 'domcontentloaded', timeout: 30_000 });

    const html = await page.$eval(config.selector, (el) => el.innerHTML);
    await page.close();

    const markdown = turndown.turndown(html);
    const newHash = sha256(markdown);

    // Check if content changed since last scrape
    const lastResult = await db.query.scrapingResults.findFirst({
      where: eq(scrapingResults.configId, configId),
      orderBy: [desc(scrapingResults.createdAt)],
    });

    if (lastResult && lastResult.hash === newHash) {
      // Content unchanged — skip OpenAI call, just update lastRun
      await db
        .update(scrapingConfigs)
        .set({ lastRun: new Date(), error: null })
        .where(eq(scrapingConfigs.id, configId));
      return;
    }

    // Content changed — extract structured data with OpenAI
    const openai = new OpenAI();
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: config.prompt,
        },
        { role: 'user', content: markdown },
      ],
      response_format: { type: 'json_object' },
    });

    const extracted = JSON.parse(
      completion.choices[0].message.content ?? '{}'
    );

    await db.insert(scrapingResults).values({
      configId,
      content: extracted,
      hash: newHash,
    });

    await db
      .update(scrapingConfigs)
      .set({ lastRun: new Date(), error: null })
      .where(eq(scrapingConfigs.id, configId));
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    await db
      .update(scrapingConfigs)
      .set({ error: message, lastRun: new Date() })
      .where(eq(scrapingConfigs.id, configId));
    console.error(`Scrape failed for config ${configId}:`, message);
  }
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}
