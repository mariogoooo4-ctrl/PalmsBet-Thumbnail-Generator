export const SPEC={w:328,h:458,top:49,main:259,logo:120,ribbon:30,blue:'#0025A3'};
export const defaults={zoom:100,x:0,y:0,logoScale:94,gradientStart:53,showGuides:false,cleanRibbon:true,logoShadow:true,logoBackgroundRemoval:false,tolerance:35};
export async function loadBitmap(file){
  if(file.name?.toLowerCase().endsWith('.psd')){
    const {readPsd}=await import('ag-psd');
    const psd=readPsd(await file.arrayBuffer(),{useImageData:true,skipLayerImageData:false});
    const data=psd.imageData || psd.canvas?.getContext('2d')?.getImageData(0,0,psd.width,psd.height);
    if(!data)throw new Error('This PSD has no readable composite. Export it as PNG, or upload a flattened preview.');
    const c=document.createElement('canvas');c.width=psd.width;c.height=psd.height;c.getContext('2d').putImageData(data,0,0);return c;
  }
  return await createImageBitmap(file);
}
export function cropImage(source,rectangle){
  const w=source.width||source.naturalWidth,h=source.height||source.naturalHeight;
  const x=Math.max(0,Math.round(rectangle.x*w)),y=Math.max(0,Math.round(rectangle.y*h));
  const cw=Math.max(1,Math.min(w-x,Math.round(rectangle.w*w))),ch=Math.max(1,Math.min(h-y,Math.round(rectangle.h*h)));
  const c=document.createElement('canvas');c.width=cw;c.height=ch;c.getContext('2d').drawImage(source,x,y,cw,ch,0,0,cw,ch);return c;
}
export function knockOutBackground(input,tolerance=35){
 const c=document.createElement('canvas');c.width=input.width;c.height=input.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(input,0,0);const image=ctx.getImageData(0,0,c.width,c.height);const {data}=image;
 // Only remove colors connected to the border, preserving enclosed features.
 const w=c.width,h=c.height,seen=new Uint8Array(w*h),q=new Int32Array(w*h);let tail=0,head=0;
 const samples=[[0,0],[w-1,0],[0,h-1],[w-1,h-1]].map(([x,y])=>{let k=(y*w+x)*4;return [data[k],data[k+1],data[k+2]]});
 const bg=[0,1,2].map(i=>samples.reduce((a,s)=>a+s[i],0)/4);
 const match=k=>{const j=k*4;const d=Math.sqrt((data[j]-bg[0])**2+(data[j+1]-bg[1])**2+(data[j+2]-bg[2])**2);return d<tolerance*2.25};
 const add=k=>{if(!seen[k]&&match(k)){seen[k]=1;q[tail++]=k}};
 for(let x=0;x<w;x++){add(x);add((h-1)*w+x)}for(let y=0;y<h;y++){add(y*w);add(y*w+w-1)}
 while(head<tail){const k=q[head++],x=k%w,y=Math.floor(k/w);if(x>0)add(k-1);if(x<w-1)add(k+1);if(y>0)add(k-w);if(y<h-1)add(k+w)}
 for(let i=0;i<seen.length;i++)if(seen[i])data[i*4+3]=0;
 ctx.putImageData(image,0,0);return c;
}
export function drawThumbnail(canvas,source,logo,p=defaults, horizontal=false){
 const {w,h,top,main,logo:logoH,ribbon,blue}=SPEC;
 const ow=horizontal?324:w,oh=horizontal?189:h;canvas.width=ow;canvas.height=oh;
 const ctx=canvas.getContext('2d');ctx.setTransform(ow/w,0,0,oh/h,0,0);ctx.clearRect(0,0,w,h);ctx.fillStyle=blue;ctx.fillRect(0,0,w,h);
 if(source){
  const iw=source.width,ih=source.height,s=Math.max(w/iw,h/ih)*Math.max(.5,p.zoom/100);
  const tw=iw*s,th=ih*s,dx=(w-tw)/2+(p.x/100)*w,dy=(h-th)/2+(p.y/100)*h;
  ctx.save();ctx.beginPath();ctx.rect(0,0,w,top+main);ctx.clip();ctx.drawImage(source,dx,dy,tw,th);ctx.restore();
 }
 const start=Math.max(0,Math.min(.98,p.gradientStart/100));
 const g=ctx.createLinearGradient(0,h*start,0,h);
 g.addColorStop(0,'rgba(0,37,163,0)');g.addColorStop(.6,'rgba(0,37,163,.66)');g.addColorStop(1,'rgba(0,37,163,1)');ctx.fillStyle=g;ctx.fillRect(0,0,w,h);
 if(p.cleanRibbon){ctx.fillStyle=blue;ctx.fillRect(0,h-ribbon,w,ribbon)}
 // Fixed compositing order: background -> artwork -> gradient -> original logo.
 if(logo){const iw=logo.width,ih=logo.height;const maxW=w-16,maxH=logoH-12;const s=Math.min(maxW/iw,maxH/ih)*Math.min(1,Math.max(.3,p.logoScale/100));const dw=iw*s,dh=ih*s,px=(w-dw)/2,py=top+main+(logoH-dh)/2;
  ctx.save();ctx.beginPath();ctx.rect(0,top+main,w,logoH);ctx.clip();if(p.logoShadow){ctx.shadowColor='rgba(0,0,0,.6)';ctx.shadowBlur=8;ctx.shadowOffsetY=3;}ctx.drawImage(logo,px,py,dw,dh);ctx.restore();
 }
 if(p.showGuides){ctx.save();ctx.setLineDash([5,4]);ctx.lineWidth=1.4;for(const [y,color] of [[top,'#f8cc62'],[top+main,'#fb8888'],[top+main+logoH,'#7ee0ed']]){ctx.beginPath();ctx.strokeStyle=color;ctx.moveTo(0,y);ctx.lineTo(w,y);ctx.stroke()}ctx.strokeStyle='#b6edf9';ctx.strokeRect(.5,.5,w-1,h-1);ctx.restore();}
}
export async function downloadCanvas(canvas,format='webp',name='PalmsBet-thumbnail'){
 const mime=format==='png'?'image/png':'image/webp';const blob=await new Promise(r=>canvas.toBlob(r,mime,.96));if(!blob)throw new Error('Export failed');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=`${name}.${format}`;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
