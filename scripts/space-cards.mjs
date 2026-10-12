import { chromium } from 'playwright';
import { mkdir, copyFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { staticPreview } from './space-public-preview.mjs';
export async function buildSpaceCards(directory = resolve('output/space-public')) {
  const preview = await staticPreview(directory),
    browser = await chromium.launch({ headless: true });
  await mkdir(resolve(directory, 'space-cards'), { recursive: true });
  try {
    const page = await browser.newPage();
    for (const locale of ['fr', 'en', 'es'])
      for (const kind of ['benchmark', 'market', 'citizen']) {
        await page.goto(`${preview.origin}/${locale}/space/commons/${kind}/?lang=${locale}`);
        await page.locator('#commons-replay').click();
        await page.locator('#commons-card:not([disabled])').waitFor();
        const download = page.waitForEvent('download');
        await page.locator('#commons-card').click();
        const card = await download;
        await copyFile(
          await card.path(),
          resolve(directory, 'space-cards', `${kind}-${locale}.png`),
        );
      }
  } finally {
    await browser.close();
    await preview.close();
  }
}
