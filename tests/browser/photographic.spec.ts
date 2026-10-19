import {test,expect} from '@playwright/test';
import fs from 'node:fs/promises';

test('main-page real cutouts, lighting and product identity survive portable export',async({page},testInfo)=>{
 await page.goto('/');
 await page.getByRole('button',{name:/Try the practice illustration/}).click();
 await page.locator('.component-strip button').filter({hasText:'Saddle'}).click();
 const unlock=page.getByRole('button',{name:'Unlock Saddle',exact:true});if(await unlock.count())await unlock.click();
 await page.getByRole('button',{name:'Real parts',exact:true}).click();
 const card=page.locator('.product-visual-card').filter({hasText:'B17'});
 await expect(card).toContainText('Reference-based cutout');
 await card.getByRole('button',{name:'Preview on bicycle'}).click();
 await expect(card).toHaveClass(/active/);
 await page.getByText('Placement & overlap',{exact:true}).click();
 await page.getByLabel('Brightness',{exact:true}).fill('0.8');
 await page.getByLabel('Warmth',{exact:true}).fill('0.2');
 await expect(page.locator('.save-status')).toHaveText('Saved locally');
 await page.reload();await expect(page.locator('.garage')).toBeVisible();
 const download=page.waitForEvent('download');await page.getByRole('button',{name:'Save editable project ↓'}).click();
 const path=testInfo.outputPath('cutout.bike.json');await(await download).saveAs(path);
 const saved=JSON.parse(await fs.readFile(path,'utf8'));
 expect(saved.styles.saddle).toMatchObject({entryId:'photo-brooks-b17',brightness:.8,warmth:.2,product:{product:{id:'vintage-brooks-england-b17'}}});
 expect(saved.customEntries.find((e:{id:string})=>e.id==='photo-brooks-b17').asset).toMatch(/^data:image\/webp;base64,/);
 await page.setViewportSize({width:390,height:844});
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});

test('known measurements filter both the catalogue and the main visual picker',async({page})=>{
 await page.goto('/');await page.getByRole('button',{name:/Try the practice illustration/}).click();
 await page.locator('.component-strip button').filter({hasText:'Seatpost'}).click();
 await page.getByRole('button',{name:'Compatible real parts',exact:true}).click();
 await expect(page.locator('.product-visual-card')).toHaveCount(0);
 await page.getByRole('button',{name:'Edit measurements in the catalogue ↗'}).click();
 await page.getByRole('combobox',{name:'Measurement',exact:true}).selectOption('seatpostDiameter');
 await page.getByLabel('Value (mm)',{exact:true}).fill('27.2');
 await page.getByRole('button',{name:'Save known value'}).click();
 await page.locator('.product-filters select').first().selectOption('seatposts');
 await page.getByLabel('Only compatible with my recorded measurements').check();
 await expect(page.locator('.product-card')).toHaveCount(2);
 await page.locator('.product-card').first().click();
 await expect(page.locator('.product-detail')).toContainText('Matches recorded requirements');
 await expect(page.getByLabel('Documented variant').locator('option')).toHaveCount(1);
 await page.getByLabel('Value (mm)',{exact:true}).fill('26');await page.getByRole('button',{name:'Save known value'}).click();
 await expect(page.locator('.product-card')).toHaveCount(0);
 await expect(page.locator('.product-detail')).toHaveCount(0);
 await page.getByLabel('Value (mm)',{exact:true}).fill('27.2');await page.getByRole('button',{name:'Save known value'}).click();
 await page.getByRole('button',{name:'Close catalogue'}).click();
 await expect(page.locator('.product-visual-card')).toHaveCount(2);
 await expect(page.locator('.product-visual-card select').first().locator('option')).toHaveCount(1);
 await expect(page.locator('.compatibility')).toContainText('should not be your sole basis for a purchase');
});

test('transparent cutout lighting preserves alpha and wheel projection pins the measured hub',async({page})=>{
 await page.goto('/');
 const result=await page.evaluate(async()=>{
  const {rasterPart}=await import('/src/rasterParts.ts'),{CATALOGUE}=await import('/src/catalogue.ts');
  const saddle=CATALOGUE.find(e=>e.id==='photo-brooks-b17')!;
  const a=await rasterPart(saddle,{}),b=await rasterPart(saddle,{brightness:.7,contrast:.9,warmth:.3});
  const pixels=(c:HTMLCanvasElement)=>c.getContext('2d')!.getImageData(0,0,c.width,c.height).data;
  const ap=pixels(a),bp=pixels(b);let alphaChanges=0,colourChanges=0,holes=0;
  for(let i=0;i<ap.length;i+=4){if(ap[i+3]!==bp[i+3])alphaChanges++;if(ap[i+3]>200&&ap[i]!==bp[i])colourChanges++;if(ap[i+3]===0)holes++;}
  const c=document.createElement('canvas');c.width=c.height=200;const ctx=c.getContext('2d')!;
  ctx.strokeStyle='#999';ctx.lineWidth=2;ctx.beginPath();ctx.arc(100,100,96,0,Math.PI*2);ctx.stroke();ctx.fillStyle='#ff0000';ctx.beginPath();ctx.arc(100,100,5,0,Math.PI*2);ctx.fill();
  const wheel={...saddle,asset:c.toDataURL(),anchors:[{name:'attachment',x:50,y:50}],parameters:{wheelPlane:true}};
  const projected=await rasterPart(wheel,{}, {wheelPlane:true,hubOffsetX:9,hubOffsetY:-7}),wp=pixels(projected),size=projected.width;
  let redX=0,redY=0,count=0,edgeHits=0;
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const i=(y*size+x)*4;if(wp[i]>200&&wp[i+1]<50&&wp[i+3]>200){redX+=x;redY+=y;count++;}}
  for(let deg=0;deg<360;deg+=10){const angle=deg*Math.PI/180,x=Math.round((50+48*Math.cos(angle))/100*size),y=Math.round((50+48*Math.sin(angle))/100*size);if(wp[(y*size+x)*4+3]>100)edgeHits++;}
  return{alphaChanges,colourChanges,holes,hub:[redX/count/size*100,redY/count/size*100],edgeHits};
 });
 expect(result.alphaChanges).toBe(0);expect(result.colourChanges).toBeGreaterThan(10000);expect(result.holes).toBeGreaterThan(10000);
 expect(result.hub[0]).toBeCloseTo(59,0);expect(result.hub[1]).toBeCloseTo(43,0);expect(result.edgeHits).toBe(36);
});
