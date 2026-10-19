import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

test('source listings apply, keep explicit variants, save and reopen without compatibility claims',async({page},info)=>{
  await page.goto('/');await page.getByLabel('Import portable project').setInputFiles('public/sample/champagne.bike.json');
  await page.locator('.component-strip button').filter({hasText:'Saddle'}).click();
  await page.getByRole('button',{name:'Real parts',exact:true}).click();
  await page.getByLabel('Find real parts').fill('Silverado');
  const card=page.locator('.source-listing-card').first();await expect(card).toBeVisible();
  await card.getByRole('button',{name:/Choose variant/}).click();
  const select=card.getByRole('combobox');await expect(select.locator('option')).not.toHaveCount(1);await select.selectOption({index:1});
  await card.getByRole('button',{name:'Preview on bicycle'}).click();await expect(card).toHaveClass(/active/);
  await expect(page.locator('.save-status')).toHaveText('Saved locally');
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Save editable project ↓'}).click();
  const path=info.outputPath('listing.bike.json');await(await downloading).saveAs(path);const p=JSON.parse(await fs.readFile(path,'utf8'));
  expect(p.styles.saddle.listing.compatibility).toBe('unknown');expect(p.styles.saddle.listing.variant.id).toBeTruthy();expect(p.styles.saddle.product).toBeUndefined();
  await page.getByLabel('Import portable project').setInputFiles(path);await expect(page.locator('.save-status')).toHaveText('Saved locally');await page.reload();
  await page.locator('.component-strip button').filter({hasText:'Saddle'}).click();await page.getByRole('button',{name:'Compatible real parts',exact:true}).click();
  await expect(page.locator('.source-listing-card')).toHaveCount(0);
});

test('expanded catalogue paginates, preserves filters and handles unsupported parts',async({page})=>{
  await page.goto('/');await page.getByRole('button',{name:'Catalogue',exact:true}).click();
  await page.getByRole('button',{name:'Expanded source catalogue'}).click();
  await expect(page.locator('.research-results > article')).toHaveCount(24);
  const first=await page.locator('.research-results > article').first().getAttribute('data-listing-id');
  await page.getByRole('button',{name:'Next page',exact:true}).click();await expect(page.locator('.research-results > article')).toHaveCount(24);
  expect(await page.locator('.research-results > article').first().getAttribute('data-listing-id')).not.toBe(first);
  await page.getByLabel('Search listings').fill('Cinelli Kask Protone Icon Blu');await expect(page.locator('.research-results > article')).toHaveCount(1);
  await expect(page.locator('.research-results')).toContainText('Preview unavailable');await expect(page.locator('.research-results .apply-product')).toHaveCount(0);
  await page.getByRole('button',{name:'Reviewed products & fit',exact:true}).click();await page.getByRole('button',{name:'Expanded source catalogue'}).click();
  await expect(page.getByLabel('Search listings')).toHaveValue('Cinelli Kask Protone Icon Blu');
});

for(const width of [360,390,430])test(`phone ${width}px supports styling, sheet states, compare and export`,async({page},info)=>{
  await page.setViewportSize({width,height:844});await page.goto('/');await page.getByLabel('Import portable project').setInputFiles('public/sample/champagne.bike.json');
  await expect(page.locator('.save-status')).toHaveText('Saved locally');
  await page.locator('.component-strip button').filter({hasText:'Saddle'}).click();await page.getByRole('button',{name:'Real parts',exact:true}).click();
  await page.getByRole('button',{name:'Browse full screen'}).click();await expect(page.getByRole('button',{name:'Back to bicycle'})).toBeVisible();
  const searchStarted=Date.now();await page.getByLabel('Find real parts').fill('Silverado');const card=page.locator('.source-listing-card').first();await expect(card).toBeVisible();
  info.annotations.push({type:'catalogue-search-ms',description:String(Date.now()-searchStarted)});
  await page.setViewportSize({width,height:480});await page.getByLabel('Find real parts').focus();
  const inputBox=await page.getByLabel('Find real parts').boundingBox();expect(inputBox!.y+inputBox!.height).toBeLessThanOrEqual(480);
  await page.setViewportSize({width,height:844});
  await card.getByRole('button',{name:'Preview on bicycle'}).click();await expect(page.getByRole('button',{name:'Browse full screen'})).toBeVisible();
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const button=page.getByRole('button',{name:'Browse full screen'});const box=await button.boundingBox();expect(box!.height).toBeGreaterThanOrEqual(44);
  await page.getByRole('button',{name:'Collapse component panel'}).click();await expect(page.getByRole('button',{name:'Expand component panel'})).toBeVisible();
  await page.getByRole('button',{name:/Compare/}).click();await expect(page.getByLabel('Comparison divider')).toBeVisible();
  await page.setViewportSize({width:844,height:390});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  await page.setViewportSize({width:768,height:1024});expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:/Export PNG/}).click();await(await downloading).saveAs(info.outputPath('mobile-white.png'));
});

test('full research catalogue and uncached variant category work after production goes offline',async({page,context,browserName})=>{
  test.skip(browserName==='webkit','WebKit offline interception cannot fetch service-worker-cached catalogue files; same engine limitation as portable reload.');
  test.setTimeout(120000);
  const external:string[]=[];page.on('request',r=>{if(!new URL(r.url()).hostname.match(/^(127\.0\.0\.1|localhost)$/))external.push(r.url())});
  await page.goto(`http://127.0.0.1:${process.env.BIKESTYLER_PREVIEW_PORT||'4173'}/`);
  await expect(page.locator('.app-footer')).toContainText('Ready offline',{timeout:60000});await context.setOffline(true);
  await page.reload();
  await page.getByRole('button',{name:'Catalogue',exact:true}).click();await page.getByRole('button',{name:'Expanded source catalogue'}).click();
  await page.getByLabel('Listing category').selectOption('saddle');const card=page.locator('.source-listing-card').first();await card.getByRole('button',{name:/Choose variant/}).click();
  await expect(card.getByRole('combobox')).toBeVisible();expect(external).toEqual([]);await context.setOffline(false);
});
