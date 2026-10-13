import React, { useEffect, useRef, useState } from 'react';
import { Upload, Image as ImageIcon, Layers, SlidersHorizontal, Download, RotateCcw, MonitorSmartphone, Smartphone, PanelTop, CheckCircle2, Info, FileImage, Scissors, ShieldCheck, Palette, Github, Move, Sun, Settings2 } from 'lucide-react';
import { readPsd } from 'ag-psd';
import { SPEC, drawThumbnail, loadBitmap, cropImage, downloadCanvas } from './engine.js';

const DEFAULT = { zoom:100,x:0,y:0,contrast:105,saturation:105,brightness:100,gradient:100,gradientStart:53,logoScale:95,logoShadow:true,topShade:0,cleanRibbon:true,guides:false,dpr:1 };
const controls = [
  ['zoom','Artwork zoom','%',70,230], ['x','Horizontal position','',-100,100], ['y','Vertical position','',-100,100],
  ['contrast','Contrast','%',60,160], ['saturation','Saturation','%',0,175], ['brightness','Brightness','%',60,150]
];
function Slider({ name,label,value,min,max,onChange,suffix='' }) {
  return <div className="sliderGroup"><div className="sliderHeader"><label htmlFor={name}>{label}</label><span>{value}{suffix}</span></div><input id={name} aria-label={label} type="range" min={min} max={max} value={value} onChange={e=>onChange(name,Number(e.target.value))}/></div>;
}
function Toggle({ children,checked,onChange }) {
  return <label className="toggleLine"><span>{children}</span><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/><span className={'iosSwitch '+(checked?'on':'')} aria-hidden="true"><span/></span></label>;
}
function Section({ title,icon:Icon,children }) {
  return <section className="section"><h3><Icon size={16}/>{title}</h3><div className="sectionBody">{children}</div></section>;
}
function rasterLayerCanvas(layer) {
  if(layer.canvas) return layer.canvas;
  if(layer.imageData) {const c=document.createElement('canvas');c.width=layer.imageData.width;c.height=layer.imageData.height;c.getContext('2d').putImageData(layer.imageData,0,0);return c;}
  return null;
}
function collectLayers(nodes,prefix='') {
  const result=[];
  for(const layer of nodes||[]) {
    const name=prefix+(layer.name||'Layer');const bitmap=rasterLayerCanvas(layer);
    if(bitmap)result.push({name,bitmap});
    if(layer.children)result.push(...collectLayers(layer.children,name+' / '));
  }
  return result;
}
const bmCache=new WeakMap();
function bitmapUrl(bm) {
  if(bmCache.has(bm))return bmCache.get(bm);
  const c=document.createElement('canvas');c.width=bm.width;c.height=bm.height;c.getContext('2d').drawImage(bm,0,0);
  const url=c.toDataURL();bmCache.set(bm,url);return url;
}
function ArtworkPanel({params,update,openFile,sourceInput,sourceName,setSourceName,layers,setArt}) {
  return <>
    <Section title="Source image" icon={ImageIcon}>
      <div className="dropArea" onClick={()=>sourceInput.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();openFile(e.dataTransfer.files[0],'art');}}>
        <div className="dropIcon"><Upload size={19}/></div><strong>Upload artwork or PSD</strong><small>PNG, JPG, WebP or Photoshop PSD</small><button className="subButton" type="button">Choose file</button>
      </div>
      <input ref={sourceInput} hidden type="file" accept="image/*,.psd" onChange={e=>openFile(e.target.files[0],'art')}/>
      <div className="fieldLabel">Game name</div><input className="textInput" value={sourceName} onChange={e=>setSourceName(e.target.value)}/>
      {layers.length>0 && <><div className="fieldLabel">PSD layers</div><select className="textInput" defaultValue="" onChange={e=>{const l=layers[Number(e.target.value)];if(l)setArt(l.bitmap);}}><option value="">Choose a layer as artwork</option>{layers.map((l,i)=><option value={i} key={i}>{l.name}</option>)}</select></>}
    </Section>
    <Section title="Composition" icon={Move}>{controls.slice(0,3).map(([name,label,suffix,min,max])=><Slider key={name} name={name} label={label} value={params[name]} min={min} max={max} suffix={suffix} onChange={update}/>)}</Section>
    <Section title="Image enhancement" icon={Sun}>{controls.slice(3).map(([name,label,suffix,min,max])=><Slider key={name} name={name} label={label} value={params[name]} min={min} max={max} suffix={suffix} onChange={update}/>)}</Section>
  </>;
}
function LogoPanel({params,update,openFile,logoInput,logo,setLogo,layers,setCropMode,setSelection}) {
  return <>
    <Section title="Original game logo" icon={Layers}>
      <div className="logoRule"><ShieldCheck size={18}/><span>Logo always stays above the blue gradient, centered in the 328 × 120 px logo area.</span></div>
      <div className="dropArea compact" onClick={()=>logoInput.current?.click()} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();openFile(e.dataTransfer.files[0],'logo');}}>
        <Upload size={22}/><strong>{logo?'Replace game logo':'Upload transparent logo'}</strong><small>Transparent PNG or separate PSD layer recommended</small>
      </div>
      <input ref={logoInput} hidden type="file" accept="image/*,.psd" onChange={e=>openFile(e.target.files[0],'logo')}/>
      {layers.length>0 && <><div className="fieldLabel">Use PSD layer as logo</div><select className="textInput" defaultValue="" onChange={e=>{const l=layers[Number(e.target.value)];if(l)setLogo(l.bitmap);}}><option value="">Select logo layer</option>{layers.map((l,i)=><option key={i} value={i}>{l.name}</option>)}</select></>}
      <button className="plainButton" onClick={()=>{setCropMode(true);setSelection(null);}}><Scissors size={16}/> Crop logo from artwork</button>
      {logo && <button className="plainButton danger" onClick={()=>setLogo(null)}>Remove separate logo</button>}
    </Section>
    <Section title="Logo placement" icon={Settings2}>
      <Slider name="logoScale" label="Logo scale" value={params.logoScale} min={25} max={100} suffix="%" onChange={update}/>
      <Toggle checked={params.logoShadow} onChange={v=>update('logoShadow',v)}>Soft shadow</Toggle>
    </Section>
    <div className="note"><Info size={16}/><span>Flat images can have baked-in text behind your logo. For clean output, use separate original artwork and a transparent logo from the provider PSD.</span></div>
  </>;
}
function FinishPanel({params,update}) {
  return <>
    <Section title="PalmsBet gradient" icon={Palette}>
      <div className="colorLine"><span>Brand blue</span><span className="colorValue"><i/>#0025A3</span></div>
      <Slider name="gradientStart" label="Gradient begins at" value={params.gradientStart} min={20} max={82} suffix="%" onChange={update}/>
      <Slider name="gradient" label="Transition intensity" value={params.gradient} min={0} max={100} suffix="%" onChange={update}/>
      <Slider name="topShade" label="Top-area darkening" value={params.topShade} min={0} max={80} suffix="%" onChange={update}/>
    </Section>
    <Section title="Overlays and guides" icon={PanelTop}>
      <Toggle checked={params.cleanRibbon} onChange={v=>update('cleanRibbon',v)}>Reserve solid blue ribbon area</Toggle>
      <Toggle checked={params.guides} onChange={v=>update('guides',v)}>Show safe-area guides</Toggle>
    </Section>
    <div className="note"><Info size={16}/><span>Provider badges and jackpots are external UI overlays; the bottom 30 px is reserved for the ribbon. Guides never appear in exports.</span></div>
  </>;
}
function SourcePreview({art,cropMode,selection,sourceBox,onPointer,applyCrop,cancelCrop}) {
  const src=art ? (typeof art.toDataURL==='function'?art.toDataURL():art instanceof ImageBitmap?bitmapUrl(art):'/sample-roulette.png') : null;
  return <div className="bottomCard"><h3><FileImage size={17}/> Source preview</h3>
    {src ? <>
      <div className={'sourcePreview '+(cropMode?'cropping':'')} ref={sourceBox} onPointerDown={e=>onPointer(e,'start')} onPointerMove={e=>onPointer(e,'move')} onPointerUp={e=>onPointer(e,'end')}>
        <img src={src} alt="Provider artwork" draggable={false}/>
        {cropMode && selection && <span className="selection" style={{left:`${selection.x*100}%`,top:`${selection.y*100}%`,width:`${selection.w*100}%`,height:`${selection.h*100}%`}}/>}
      </div>
      {cropMode && <div className="cropActions"><button onClick={applyCrop}>Use selection</button><button onClick={cancelCrop}>Cancel</button></div>}
    </> : <p className="muted">No artwork loaded</p>}
    <small>{cropMode?'Drag a rectangle over the logo.':'Original artwork is preserved unless edited.'}</small>
  </div>;
}
export default function App() {
  const [params,setParams]=useState(DEFAULT);
  const [art,setArt]=useState(null),[logo,setLogo]=useState(null),[sourceName,setSourceName]=useState('Palms Royale Grand Roulette');
  const [tab,setTab]=useState('artwork'),[format,setFormat]=useState('webp'),[horizontal,setHorizontal]=useState(false),[status,setStatus]=useState('Ready');
  const [layers,setLayers]=useState([]),[error,setError]=useState(''),[cropMode,setCropMode]=useState(false),[selection,setSelection]=useState(null);
  const preview=useRef(null),sourceInput=useRef(null),logoInput=useRef(null),sourceBox=useRef(null),cropStart=useRef(null);
  const update=(key,value)=>setParams(old=>({...old,[key]:value}));
  useEffect(()=>{let mounted=true;fetch('/sample-roulette.png').then(r=>r.blob()).then(loadBitmap).then(img=>{if(mounted)setArt(img);}).catch(()=>{});return ()=>{mounted=false;};},[]);
  useEffect(()=>{if(preview.current)drawThumbnail(preview.current,art,logo,params,horizontal);},[art,logo,params,horizontal]);
  async function openFile(file,which) {
    if(!file)return;
    setError('');setStatus('Processing '+file.name+'…');
    try {
      if(/\.psd$/i.test(file.name)) {
        const psd=readPsd(await file.arrayBuffer(),{skipThumbnail:true,skipLayerImageData:false,useImageData:false});
        const found=collectLayers(psd.children);setLayers(found);
        const image=rasterLayerCanvas(psd)||found[0]?.bitmap;
        if(!image)throw new Error('No raster artwork found. Export a PNG or choose another PSD.');
        if(which==='art'){setArt(image);setSourceName(file.name.replace(/\.psd$/i,''));} else setLogo(image);
      } else {
        const bmp=await loadBitmap(file);
        if(which==='art'){setArt(bmp);setSourceName(file.name.replace(/\.[^.]+$/,''));setLayers([]);}else setLogo(bmp);
      }
      setStatus('Ready');
    }catch(e){setError('Could not open file: '+e.message);setStatus('Error');}
  }
  async function exportFile() {
    try {
      const c=document.createElement('canvas');drawThumbnail(c,art,logo,{...params,guides:false,dpr:1},horizontal);
      const name=sourceName.trim().replace(/[^a-z0-9-]+/gi,'-').replace(/^-|-$/g,'')||'PalmsBet-Thumbnail';
      await downloadCanvas(c,format,name+(horizontal?'_324x189':'_328x458'));
      setStatus('Export downloaded');
    } catch(e){setError('Export failed: '+e.message);}
  }
  function onPointer(e,type) {
    if(!cropMode||!art||!sourceBox.current)return;
    const rect=sourceBox.current.getBoundingClientRect();
    const px=Math.max(0,Math.min(1,(e.clientX-rect.left)/rect.width));
    const py=Math.max(0,Math.min(1,(e.clientY-rect.top)/rect.height));
    if(type==='start'){cropStart.current={x:px,y:py};setSelection({x:px,y:py,w:0,h:0});e.currentTarget.setPointerCapture(e.pointerId);}
    else if(type==='move' && cropStart.current){const x=Math.min(cropStart.current.x,px),y=Math.min(cropStart.current.y,py);setSelection({x,y,w:Math.abs(px-cropStart.current.x),h:Math.abs(py-cropStart.current.y)});}
    else if(type==='end'){cropStart.current=null;}
  }
  function applyCrop() {
    if(!selection||selection.w<.02||selection.h<.02)return;
    const w=art.width||art.naturalWidth,h=art.height||art.naturalHeight;
    setLogo(cropImage(art,{x:selection.x*w,y:selection.y*h,w:selection.w*w,h:selection.h*h}));
    setCropMode(false);setSelection(null);setTab('logo');setStatus('Logo crop made — flat background remains');
  }
  return <div className="appShell">
    <header className="topbar">
      <div className="brand"><span className="brandmark">P<span>✦</span></span><div><strong>Thumbnail Studio</strong><small>by PalmsBet · Creative tools</small></div></div>
      <div className="topRight"><span className="appVersion">V 1.1</span><span className="ready"><span className="dot"/>{status}</span><a className="github" href="https://github.com/new" target="_blank" rel="noreferrer" title="Create GitHub repository"><Github size={17}/></a></div>
    </header>
    <main className="workspace">
      <aside className="sidebar">
        <div className="sidebarTitle"><div><p className="eyebrow">WORKSPACE</p><h1>Design controls</h1></div><button className="iconButton" onClick={()=>setParams(DEFAULT)} title="Reset settings"><RotateCcw size={17}/></button></div>
        <div className="tabs" role="tablist">
          { [['artwork','Artwork',ImageIcon],['logo','Logo',Layers],['finish','Finish',SlidersHorizontal]].map(([key,label,Icon])=><button key={key} className={tab===key?'active':''} onClick={()=>setTab(key)}><Icon size={16}/>{label}</button>) }
        </div>
        {tab==='artwork' && <ArtworkPanel params={params} update={update} openFile={openFile} sourceInput={sourceInput} sourceName={sourceName} setSourceName={setSourceName} layers={layers} setArt={setArt}/>}
        {tab==='logo' && <LogoPanel params={params} update={update} openFile={openFile} logoInput={logoInput} logo={logo} setLogo={setLogo} layers={layers} setCropMode={setCropMode} setSelection={setSelection}/>}
        {tab==='finish' && <FinishPanel params={params} update={update}/>}
      </aside>
      <section className="stage">
        <div className="stageTop"><div><p className="eyebrow">LIVE CANVAS</p><h2>{sourceName}</h2><p className="muted">Brand-aligned game thumbnail preview</p></div>
          <div className="segmented"><button className={!horizontal?'active':''} onClick={()=>setHorizontal(false)}><Smartphone size={16}/> Vertical</button><button className={horizontal?'active':''} onClick={()=>setHorizontal(true)}><MonitorSmartphone size={16}/> Horizontal</button></div>
        </div>
        <div className="stageCanvas"><div className="canvasWrap"><canvas ref={preview} className={'mainCanvas '+(horizontal?'horizontal':'')}/><div className="sizeBubble">{horizontal?'324 × 189':'328 × 458'} px</div></div></div>
        <div className="stageFooter"><span><CheckCircle2 size={15}/> Live preview</span><span><span className="swatch"/> PalmsBet brand blue</span><span><ShieldCheck size={15}/> Logo above gradient</span></div>
      </section>
      <aside className="rightPanel">
        <div className="rightTop"><p className="eyebrow">PRODUCTION</p><h2>Export settings</h2></div>
        <div className="exportGroup"><div className="fieldLabel">OUTPUT FORMAT</div><div className="formatButtons"><button className={format==='webp'?'active':''} onClick={()=>setFormat('webp')}>WebP<small>Recommended</small></button><button className={format==='png'?'active':''} onClick={()=>setFormat('png')}>PNG<small>Lossless</small></button></div></div>
        <div className="specCard"><h3>Layout specification</h3>
          { [['Top overlay area','49 px'],['Main artwork','259 px'],['Game logo','120 px'],['Ribbon reserve','30 px']].map(([label,value],i)=><div className="specLine" key={label}><span><i className={'specDot spec'+i}/>{label}</span><strong>{value}</strong></div>) }
          <div className="miniZones"><div>49</div><div>259</div><div>120</div><div>30</div></div>
        </div>
        <button className="exportButton" onClick={exportFile}><Download size={19}/> Export {format.toUpperCase()}</button>
        <div className="exportHint">Downloads directly to your device<br/>No server · No upload required</div>
        <SourcePreview art={art} cropMode={cropMode} selection={selection} sourceBox={sourceBox} onPointer={onPointer} applyCrop={applyCrop} cancelCrop={()=>{setCropMode(false);setSelection(null);}}/>
      </aside>
    </main>
    {error && <div className="toast" role="alert">{error}<button onClick={()=>setError('')}>×</button></div>}
  </div>;
}
