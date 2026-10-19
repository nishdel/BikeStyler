import { loadImage, canvas } from "./images";
import { projectWheelPoint } from "./placement";
import type { CatalogueEntry, PartStyle } from "./types";

const cache = new Map<string,Promise<HTMLCanvasElement>>();

/** Prepare a local transparent bitmap. Lighting changes never change alpha. */
export function rasterPart(entry:CatalogueEntry,style:PartStyle,parameters=entry.parameters) {
  const key=JSON.stringify([entry.asset,entry.parameters,style.brightness,style.contrast,style.warmth,parameters.hubOffsetX,parameters.hubOffsetY]);
  if(!cache.has(key)) {
    const task=(async()=>{
      const im=await loadImage(entry.asset!);
      const limit=entry.parameters.rasterResolution===1000?1000:1600;
      const size=entry.parameters.wheelPlane?768:Math.min(limit,Math.max(im.width,im.height));
      const c=canvas(size,size),ctx=c.getContext('2d')!;
      const n=(key:string,fallback:number)=>typeof entry.parameters[key]==='number'?Number(entry.parameters[key]):fallback;
      const sx=n('cropX',0)/100*im.width,sy=n('cropY',0)/100*im.height;
      const sw=n('cropWidth',100)/100*im.width,sh=n('cropHeight',100)/100*im.height;
      const attachment=entry.anchors.find(a=>a.name==='attachment')||{x:50,y:50};
      ctx.save();ctx.translate(attachment.x/100*size,attachment.y/100*size);ctx.rotate(n('imageRotation',0)*Math.PI/180);ctx.translate(-attachment.x/100*size,-attachment.y/100*size);
      ctx.drawImage(im,sx,sy,sw,sh,n('imageX',0)/100*size,n('imageY',0)/100*size,n('imageWidth',100)/100*size,n('imageHeight',100)/100*size);
      ctx.restore();
      const pixels=ctx.getImageData(0,0,size,size),brightness=style.brightness??1,contrast=style.contrast??1,warmth=style.warmth??0;
      if(brightness!==1||contrast!==1||warmth!==0)for(let i=0;i<pixels.data.length;i+=4) {
        if(!pixels.data[i+3])continue;
        for(let channel=0;channel<3;channel++)pixels.data[i+channel]=(pixels.data[i+channel]*brightness-128)*contrast+128+[20,5,-22][channel]*warmth;
      }
      if(entry.parameters.wheelPlane) {
        // Inverse-map one wheel plane. Bilinear premultiplied-alpha sampling
        // keeps wire edges clean and the rim on its confirmed outer ellipse.
        const out=ctx.createImageData(size,size),src=pixels.data;
        for(let y=0;y<size;y++)for(let x=0;x<size;x++) {
          const flat=projectWheelPoint((x+.5)*100/size,(y+.5)*100/size,-Number(parameters.hubOffsetX||0),-Number(parameters.hubOffsetY||0));
          const p=projectWheelPoint(flat.x,flat.y,n('sourceHubOffsetX',0),n('sourceHubOffsetY',0));
          const sx=p.x*size/100-.5,sy=p.y*size/100-.5,x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0;
          if(x0<0||y0<0||x0>=size-1||y0>=size-1)continue;
          const indices=[(y0*size+x0)*4,(y0*size+x0+1)*4,((y0+1)*size+x0)*4,((y0+1)*size+x0+1)*4];
          const weights=[(1-fx)*(1-fy),fx*(1-fy),(1-fx)*fy,fx*fy];
          const alpha=indices.reduce((sum,i,k)=>sum+src[i+3]*weights[k],0),dest=(y*size+x)*4;
          if(!alpha)continue;
          out.data[dest+3]=alpha;
          for(let channel=0;channel<3;channel++)out.data[dest+channel]=indices.reduce((sum,i,k)=>sum+src[i+channel]*src[i+3]*weights[k],0)/alpha;
        }
        ctx.putImageData(out,0,0);
      }else ctx.putImageData(pixels,0,0);
      return c;
    })();
    cache.set(key,task);void task.catch(()=>cache.delete(key));
    if(cache.size>12)cache.delete(cache.keys().next().value!);
  }
  return cache.get(key)!;
}

export function clearRasterPartCache(){cache.clear()}
