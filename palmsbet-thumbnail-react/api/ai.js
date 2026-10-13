/* Vercel serverless Gemini / Nano Banana proxy. Never expose GEMINI_API_KEY to browser. */
const ENDPOINT = 'https://generativelanguage.googleapis.com/v1beta/models/';
const ANALYSIS_MODEL = process.env.GEMINI_ANALYSIS_MODEL || 'gemini-2.5-flash';
const IMAGE_MODEL = process.env.GEMINI_IMAGE_MODEL || 'gemini-2.5-flash-image';
const allowed = new Set(['analyze', 'remove-logo', 'extract-logo', 'isolate-character']);
function parseImage(dataUrl) {
  if(typeof dataUrl !== 'string') throw new Error('Missing image');
  const m=dataUrl.match(/^data:(image\/(?:jpeg|png|webp));base64,([\s\S]+)$/);
  if(!m) throw new Error('Provide JPEG, PNG or WebP');
  if(m[2].length>8_000_000)throw new Error('Image too large; use an image under ~6 MB');
  return {mime_type:m[1],data:m[2]};
}
function contentParts(prompt, images) {
  return [{text:prompt},...images.map(i=>({inline_data:parseImage(i)}))];
}
async function callGemini(model,parts, generationConfig) {
  const c=new AbortController();const timer=setTimeout(()=>c.abort(),55000);
  try {
    const result=await fetch(`${ENDPOINT}${model}:generateContent`,{
      method:'POST',headers:{'Content-Type':'application/json','x-goog-api-key':process.env.GEMINI_API_KEY},
      body:JSON.stringify({contents:[{role:'user',parts}],generationConfig}),signal:c.signal
    });
    const json=await result.json().catch(()=>({}));
    if(!result.ok)throw new Error(json.error?.message||`Gemini HTTP ${result.status}`);
    const partsOut=(json.candidates||[]).flatMap(c=>c.content?.parts||[]);
    return partsOut;
  } finally {clearTimeout(timer)}
}
function promptFor(mode,box){
  const region=Array.isArray(box)&&box.length===4?`Original logo region [top,left,bottom,right] normalized 0-1000: ${box.join(', ')}.`:'';
  if(mode==='remove-logo')return `Edit this casino game thumbnail. REMOVE ONLY THE PRINTED GAME TITLE / LOGO and its attached badge / text ornament, then reconstruct the natural scene behind it consistently, without adding any new text. ${region} Keep the woman, all characters, roulette wheel, casino props, and overall image style and framing intact. Fill the logo area seamlessly. Return image only.`;
  if(mode==='extract-logo')return `From the input casino game thumbnail, isolate the ORIGINAL GAME TITLE LOGO only (including original badge, lettering and attached decorations). ${region} Preserve exact spelling, original logo layout, logo colors and shape as closely as possible. Exclude ALL surrounding background, people, roulette wheel if not part of the logo, and any provider or jackpot text. Output ONLY the isolated centered logo on a FULLY TRANSPARENT background (PNG alpha). Do not redesign or retype. Return image only.`;
  return `Extract only the principal human character / main gameplay subject of this casino thumbnail. Remove all text, game logos and unrelated background. Keep the subject visually faithful, sharp, entire visible silhouette. Place on transparent background if supported; no fabricated text. Return image only.`;
}
export default async function handler(req,res) {
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Use POST'});
  if(!process.env.GEMINI_API_KEY)return res.status(503).json({error:'Set GEMINI_API_KEY in Vercel → Settings → Environment Variables, then redeploy.'});
  try{
    const {mode,image,box}=req.body||{};
    if(!allowed.has(mode))return res.status(400).json({error:'Unsupported AI operation'});
    parseImage(image);
    if(mode==='analyze'){
      const prompt=`Analyze this casino-game thumbnail for automated layer decomposition. Return JSON ONLY as an object with keys logo,character,background,notes. logo and character each: {box:[ymin,xmin,ymax,xmax],confidence:0..1,description:string}. Coordinates MUST be integers normalized to 0..1000, and point to the original raster image, not a transformed canvas. logo box should enclose ONLY the main game title / emblem, NOT unrelated jackpot multiplier or provider branding, unless permanently part of game title. If absent use null. background is a brief description string; notes can discuss occluded imagery. No code fences.`;
      const parts=await callGemini(ANALYSIS_MODEL,contentParts(prompt,[image]),{responseMimeType:'application/json',temperature:0.1});
      const txt=parts.map(p=>p.text||'').join('');
      let parsed;try{parsed=JSON.parse(txt)}catch{throw new Error('Gemini did not return valid JSON')}
      const bbox=v=>Array.isArray(v?.box)&&v.box.length===4&&v.box.every(n=>Number.isFinite(n))?{...v,box:v.box.map(n=>Math.max(0,Math.min(1000,Math.round(n))))}:null;
      return res.status(200).json({logo:bbox(parsed.logo),character:bbox(parsed.character),background:parsed.background||'',notes:parsed.notes||'',model:ANALYSIS_MODEL});
    }
    const parts=await callGemini(IMAGE_MODEL,contentParts(promptFor(mode,box),[image]),{responseModalities:['TEXT','IMAGE']});
    const imagePart=parts.find(p=>p.inlineData||p.inline_data);
    const payload=imagePart?.inlineData||imagePart?.inline_data;
    if(!payload?.data)throw new Error('Image model returned no image. Try again or use an original transparent asset.');
    res.status(200).json({image:`data:${payload.mimeType||payload.mime_type||'image/png'};base64,${payload.data}`,message:parts.filter(p=>p.text).map(p=>p.text).join(' '),model:IMAGE_MODEL});
  }catch(e){res.status(502).json({error:e.name==='AbortError'?'Gemini request exceeded 55 seconds':e.message||String(e)})}
}
