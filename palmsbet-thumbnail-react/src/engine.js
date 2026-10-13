export const SPEC={w:328,h:458,top:49,main:259,logo:120,ribbon:30,blue:'#0025A3'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function drawThumbnail(canvas, source, logo, p, horizontal=false){
  const {w,h,top,main,logo:logoH,ribbon,blue}=SPEC;
  const ratio=p.dpr||1;
  const targetW=horizontal?324:w,targetH=horizontal?189:h;
  canvas.width=Math.round(targetW*ratio);canvas.height=Math.round(targetH*ratio);
  const ctx=canvas.getContext('2d'); ctx.setTransform(canvas.width/w,0,0,canvas.height/h,0,0);
  ctx.clearRect(0,0,w,h);ctx.fillStyle=blue;ctx.fillRect(0,0,w,h);
  if(source){
    const iw=source.width||source.naturalWidth, ih=source.height||source.naturalHeight;
    const s=Math.max(w/iw,h/ih)*(p.zoom/100);
    const tw=iw*s,th=ih*s;
    const dx=(w-tw)/2+(p.x/100)*w,dy=(h-th)/2+(p.y/100)*h;
    ctx.save();ctx.filter=`contrast(${p.contrast}%) saturate(${p.saturation}%) brightness(${p.brightness}%)`;
    ctx.drawImage(source,dx,dy,tw,th);ctx.restore();
  }
  if(p.topShade>0){ctx.fillStyle=`rgba(4,18,66,${p.topShade/100})`;ctx.fillRect(0,0,w,top);}
  // Mandatory gradient: blue reaches fully opaque at bottom; applied BEFORE game logo.
  const g=ctx.createLinearGradient(0,h*p.gradientStart/100,0,h);
  g.addColorStop(0,'rgba(0,37,163,0)');
  g.addColorStop(.62,`rgba(0,37,163,${.63*p.gradient/100})`);
  g.addColorStop(1,'rgba(0,37,163,1)');
  ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
  if(p.cleanRibbon){ctx.fillStyle=blue;ctx.fillRect(0,h-ribbon,w,ribbon);}
  // Logo is ALWAYS above gradient, centered inside 328 × 120 logo zone, never clipped by ribbons.
  if(logo){
    const iw=logo.width||logo.naturalWidth,ih=logo.height||logo.naturalHeight;
    const safeW=w-16,safeH=logoH-12;
    const scale=Math.min(safeW/iw,safeH/ih)*(p.logoScale/100);
    const lw=iw*scale,lh=ih*scale;
    const lx=(w-lw)/2,ly=top+main+(logoH-lh)/2;
    if(p.logoShadow){ctx.save();ctx.shadowColor='rgba(0,0,0,.75)';ctx.shadowBlur=9;ctx.shadowOffsetY=4;ctx.drawImage(logo,lx,ly,lw,lh);ctx.restore();}
    ctx.drawImage(logo,lx,ly,lw,lh);
  }
  if(p.guides){
    ctx.save();ctx.setLineDash([6,5]);ctx.lineWidth=1.6;
    for(const [y,c] of [[0,'#7bded9'],[top,'#f4bf64'],[top+main,'#ff7777'],[h-ribbon,'#8bd5ff'],[h,'#8bd5ff']]){ctx.strokeStyle=c;ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke();}
    ctx.strokeStyle='#9de9f2';ctx.strokeRect(.5,.5,w-1,h-1);ctx.restore();
  }
}
export async function loadBitmap(file){return createImageBitmap(file);}
export function cropImage(image, rect){
 const c=document.createElement('canvas');c.width=Math.round(rect.w);c.height=Math.round(rect.h);
 c.getContext('2d').drawImage(image,rect.x,rect.y,rect.w,rect.h,0,0,c.width,c.height);return c;
}
export async function downloadCanvas(canvas,fmt='webp',name='PalmsBet-Thumbnail'){
 const mime=fmt==='png'?'image/png':'image/webp';
 const blob=await new Promise(r=>canvas.toBlob(r,mime,.96));
 if(!blob)throw new Error('Export failed');
 const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${name}.${fmt}`;document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1200);
}
