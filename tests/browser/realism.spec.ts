import { test, expect } from "@playwright/test";
import fs from "node:fs/promises";

test("fit pivots, independent crank pose and portable style validation", async ({ page }) => {
  await page.goto("/");
  const result = await page.evaluate(async () => {
    const { applyLocalFit } = await import("/src/placement.ts");
    const { renderComponent } = await import("/src/componentRenderers.ts");
    const { CATALOGUE } = await import("/src/catalogue.ts");
    const { practiceProject } = await import("/src/fixture.ts");
    const { parseProject } = await import("/src/validation.ts");
    const { compose } = await import("/src/compositor.ts");
    const c = document.createElement("canvas"); c.width = c.height = 180;
    const ctx = c.getContext("2d")!;
    const pivots = [{x:50,y:71}, {x:43,y:43}, {x:50,y:50}];
    const pivotErrors = pivots.map(p => {
      ctx.resetTransform(); ctx.translate(230, 180); ctx.rotate(-0.7); ctx.scale(2.4,1.8);
      const before = ctx.getTransform().transformPoint(p);
      applyLocalFit(ctx,p,1.34,.61,28);
      const after = ctx.getTransform().transformPoint(p);
      return Math.hypot(before.x-after.x,before.y-after.y);
    });
    const entry = CATALOGUE.find(e=>e.id==="expanded-cranksets-classic-five-arm-crankset")!;
    const renders = [0,90,180,-90].map(angle=> {
      ctx.resetTransform();ctx.clearRect(0,0,180,180);ctx.translate(40,40);
      renderComponent(ctx,{...entry,parameters:{...entry.parameters,crankAngle:angle,crankLength:58}},"#a8aaa3");
      return ctx.getImageData(0,0,180,180).data;
    });
    const alpha=(pixels:Uint8ClampedArray,x:number,y:number)=>pixels[(Math.round(y)*180+Math.round(x))*4+3];
    const endpoints = [0,90,180,-90].map((angle,i)=> {
      const a=angle*Math.PI/180;
      return alpha(renders[i],83+58*Math.cos(a),83+58*Math.sin(a))>100 && alpha(renders[i],83-58*Math.cos(a),83-58*Math.sin(a))===0;
    });
    let ringDifferences=0;
    for(const angle of [45,135,225,315])for(let r=30;r<35;r+=.5){
      const a=angle*Math.PI/180,index=(Math.round(83+r*Math.sin(a))*180+Math.round(83+r*Math.cos(a)))*4;
      for(const pixels of renders.slice(1))for(let k=0;k<4;k++)if(pixels[index+k]!==renders[0][index+k])ringDifferences++;
    }
    const p=practiceProject();p.parts.find(t=>t.id==='saddle')!.locked=false;p.styles.saddle={entryId:"saddles-slim-race-saddle",approvedApproximation:true};
    const original=await compose(p),originalPixels=original.getContext("2d")!.getImageData(0,0,p.width,p.height).data;
    p.styles.saddle={...p.styles.saddle,widthScale:1,heightScale:1,skew:0};
    const neutral=await compose(p),neutralPixels=neutral.getContext("2d")!.getImageData(0,0,p.width,p.height).data;
    const defaultsUnchanged=originalPixels.every((v,i)=>v===neutralPixels[i]);
    p.styles.saddle={...p.styles.saddle,widthScale:1.3,heightScale:.7,skew:12};
    const changed=await compose(p),changedPixels=changed.getContext("2d")!.getImageData(0,0,p.width,p.height).data;
    const cacheUpdated=originalPixels.some((v,i)=>v!==changedPixels[i]);
    const fields={widthScale:1.3,heightScale:.7,skew:12,crankAngle:-53,crankReach:.61};
    p.styles.saddle={...p.styles.saddle,...fields};
    const parsed=parseProject(JSON.stringify(p));
    const invalid=[['widthScale',0],['heightScale',3],['skew',46],['crankAngle',181],['crankReach',.1]].map(([key,value])=>{
      try {parseProject(JSON.stringify({...p,styles:{saddle:{...p.styles.saddle,[key]:value}}}));return false;}catch{return true;}
    });
    return {pivotErrors,endpoints,ringDifferences,defaultsUnchanged,cacheUpdated,fields:parsed.styles.saddle,invalid};
  });
  // Firefox stores Canvas transforms with float32 precision. A thousandth of
  // a canvas pixel is well below a visible shift, without requiring doubles.
  expect(Math.max(...result.pivotErrors),JSON.stringify(result.pivotErrors)).toBeLessThan(.001);
  expect(result.endpoints).toEqual([true,true,true,true]);
  expect(result.ringDifferences).toBe(0);
  expect(result.defaultsUnchanged).toBe(true);
  expect(result.cacheUpdated).toBe(true);
  expect(result.fields).toMatchObject({widthScale:1.3,heightScale:.7,skew:12,crankAngle:-53,crankReach:.61});
  expect(result.invalid).toEqual([true,true,true,true,true]);
});

test("placement controls undo, reload and export without losing photo geometry", async ({ page }, testInfo) => {
  await page.goto("/");
  const input=await page.evaluate(async()=>{
    const {practiceProject}=await import("/src/fixture.ts");
    const p=practiceProject(),pedal=p.parts.find(t=>t.id==='pedals')!;
    p.parts.push({...pedal,id:'crank-test',name:'Test crankset',category:'cranksets',locked:false,anchor:{x:485,y:435,width:105,height:100,rotation:-25}});
    p.styles['crank-test']={entryId:'expanded-cranksets-classic-five-arm-crankset',approvedApproximation:true};
    return p;
  });
  await page.getByLabel("Import portable project").setInputFiles({name:'fit-test.bike.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(input))});
  await expect(page.locator('.garage')).toBeVisible();
  await page.getByRole('button',{name:/Test crankset/}).click();
  await page.getByText('Placement & overlap',{exact:true}).click();
  for(const [label,value] of [['Width / foreshortening','1.2'],['Height / foreshortening','0.72'],['Viewing angle / shear','13'],['Crank arm angle','-53'],['Crank arm reach','0.61']]) {
    await page.getByLabel(label,{exact:true}).fill(value);
  }
  await page.getByRole('button',{name:'Reset placement',exact:true}).click();
  await expect(page.getByLabel('Crank arm angle',{exact:true})).toHaveValue('48');
  await page.getByRole('button',{name:'Undo',exact:true}).click();
  await expect(page.getByLabel('Crank arm angle',{exact:true})).toHaveValue('-53');
  await expect(page.locator('.save-status')).toHaveText('Saved locally');
  await page.reload();
  await expect(page.locator('.garage')).toBeVisible();
  await page.getByRole('button',{name:/Test crankset/}).click();
  await page.getByText('Placement & overlap',{exact:true}).click();
  await expect(page.getByLabel('Crank arm reach',{exact:true})).toHaveValue('0.61');
  const download=page.waitForEvent('download');
  await page.getByRole('button',{name:'Save editable project ↓'}).click();
  const path=testInfo.outputPath('fit.bike.json');await (await download).saveAs(path);
  const saved=JSON.parse(await fs.readFile(path,'utf8'));
  expect(saved.styles['crank-test']).toMatchObject({widthScale:1.2,heightScale:.72,skew:13,crankAngle:-53,crankReach:.61});
  expect(saved.parts.find((t:{id:string})=>t.id==='crank-test').anchor).toEqual(input.parts.find(t=>t.id==='crank-test')!.anchor);
  await page.setViewportSize({width:390,height:844});
  expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
