import type {CatalogueEntry} from './types';
import {projectWheelPoint} from './placement';

/** Deterministic rim, lacing and hub detail. Coordinates stay in the wheel plane. */
export function renderDetailedWheel(ctx:CanvasRenderingContext2D,entry:CatalogueEntry,colour:string){
 if(!['wheels','spokes'].includes(entry.renderer))return false;
 const p=entry.parameters,n=(key:string,fallback:number)=>typeof p[key]==='number'?Number(p[key]):fallback;
 const whole=entry.renderer==='wheels',form=String(p.form),radius=whole?48:42,depth=Math.max(.7,Math.min(18,n('rimDepth',n('depth',5))));
 const project=(x:number,y:number)=>projectWheelPoint(x,y,n('hubOffsetX',0),n('hubOffsetY',0),radius);
 const point=(r:number,a:number)=>project(50+Math.cos(a)*r,50+Math.sin(a)*r);
 const trace=(r:number,reverse=false)=>{for(let i=0;i<=192;i++){const a=i/192*Math.PI*2*(reverse?-1:1),v=point(r,a);i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y)}ctx.closePath()};
 const rim=(outer:number,inner:number,fill:string|CanvasGradient)=>{ctx.beginPath();trace(outer);trace(inner,true);ctx.fillStyle=fill;ctx.fill('evenodd')};
 const stroke=(points:{x:number;y:number}[],width:number,paint:string|CanvasGradient)=>{ctx.beginPath();points.forEach((v,i)=>i?ctx.lineTo(v.x,v.y):ctx.moveTo(v.x,v.y));ctx.lineWidth=width;ctx.strokeStyle=paint;ctx.stroke()};
 ctx.save();ctx.lineCap='round';ctx.lineJoin='round';
 const metal=ctx.createLinearGradient(18,5,78,96);metal.addColorStop(0,'#4b504c');metal.addColorStop(.2,'#c7c8bd');metal.addColorStop(.43,colour);metal.addColorStop(.49,'#e2e0d3');metal.addColorStop(.57,colour);metal.addColorStop(1,'#64685f');
 if(whole){rim(48,48-depth,metal);rim(47.8,47.45,'#d4d2c5');rim(48-depth+.32,48-depth,'#4d514a');}
 const count=Math.max(3,Math.min(72,Math.round(n('count',32)))),spokeRadius=whole?48-depth+.18:radius;
 const wire=Math.max(.09,n('spokeWidth',.28)),hubRadius=n('hubRadius',2.1),flange=hubRadius*.78;
 const wireColour=whole?String(p.spokeColour||'#85877b'):colour;
 for(let layer=0;layer<2;layer++)for(let i=layer;i<count;i+=2){
  const a=i*Math.PI*2/count+(form==='paired'?(i%2?-.08:.08):0);
  const crossed=form==='cross'?(Math.floor(i/2)%2?1:-1)*Math.PI*2*3/(count/2):0;
  const start=project(50+Math.cos(a+crossed)*flange,50+Math.sin(a+crossed)*flange+(layer?-.45:.45));
  const end=point(spokeRadius,a);
  if(form==='blade'){
   const c1=point(spokeRadius*.6,a+.26),e2=point(spokeRadius,a+.13),c2=point(spokeRadius*.5,a+.5);
   ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.quadraticCurveTo(c1.x,c1.y,end.x,end.y);ctx.lineTo(e2.x,e2.y);ctx.quadraticCurveTo(c2.x,c2.y,start.x,start.y);ctx.fillStyle=metal;ctx.fill();
  }else{
   // Thin dark edge and warm highlight preserve readability without oversized wires.
   stroke([start,end],wire*(layer?1:.85),layer?wireColour:'#999b8e');
   stroke([{x:start.x-.035,y:start.y-.035},{x:end.x-.035,y:end.y-.035}],wire*.28,'#d9d6c4');
   const nipple=point(spokeRadius-.8,a);stroke([nipple,end],wire*1.8,'#999b90');
  }
 }
 if(whole){const hub=project(50,50),metalHub=ctx.createLinearGradient(hub.x-hubRadius,hub.y-hubRadius,hub.x+hubRadius,hub.y+hubRadius);metalHub.addColorStop(0,'#d0ccbb');metalHub.addColorStop(.35,'#7f8278');metalHub.addColorStop(.48,'#d8d5c8');metalHub.addColorStop(1,'#4b514d');ctx.beginPath();ctx.ellipse(hub.x,hub.y,hubRadius,hubRadius*.86,0,0,Math.PI*2);ctx.fillStyle=metalHub;ctx.fill();ctx.lineWidth=wire*.65;ctx.strokeStyle='#545a51';ctx.stroke();ctx.beginPath();ctx.arc(hub.x,hub.y,hubRadius*.3,0,Math.PI*2);ctx.fillStyle='#3c413a';ctx.fill();
  const valve=point(47.2,.82),valveEnd=point(45.1,.82);stroke([valve,valveEnd],wire*2,'#72766c');
 }
 ctx.restore();return true;
}
