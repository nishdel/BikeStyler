/** Project a wheel plane while retaining its observed outer ellipse.
 * A disk-preserving homography moves the physical axle away from the ellipse
 * centre. The subsequent Canvas affine transform supplies the ellipse axes.
 * This is a single planar fit, not reconstruction of a three-dimensional wheel.
 */
export function projectWheelPoint(x:number,y:number,hubX=0,hubY=0,radius=48){
  let hx=hubX/radius,hy=hubY/radius;
  const length=Math.hypot(hx,hy);
  if(length>0.65){hx*=0.65/length;hy*=0.65/length;}
  const r2=hx*hx+hy*hy,k=Math.sqrt(1-r2),u=(x-50)/radius,v=(y-50)/radius,d=hx*u+hy*v;
  const boost=r2>1e-12?(1-k)*d/r2:0,den=1+d;
  return {x:50+radius*(k*u+boost*hx+hx)/den,y:50+radius*(k*v+boost*hy+hy)/den};
}

/** All local adjustment axes share the attachment origin. */
export function applyLocalFit(ctx:CanvasRenderingContext2D,attachment:{x:number;y:number},width=1,height=1,skew=0){
  ctx.translate(attachment.x,attachment.y);
  ctx.transform(width,0,Math.tan(skew*Math.PI/180)*height,height,0,0);
  ctx.translate(-attachment.x,-attachment.y);
}
