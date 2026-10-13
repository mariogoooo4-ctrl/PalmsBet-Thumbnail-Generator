# PalmsBet Thumbnail Studio v2 — Gemini + Nano Banana

React + Vite editor with an Apple-inspired UI and Vercel AI backend. All code is included. Fixed canvas 328×458: 49 px provider, 259 artwork, 120 logo, 30 ribbon. Blue base `#0025A3`.

## Start locally

```bash
npm install
npm run dev
```

The visual editor works offline. **Gemini / Nano Banana actions need the Vercel function**; for local AI API development use `npx vercel dev` with configured environment variables.

## Deploy to Vercel

1. Upload this project folder contents into a GitHub repository.
2. In Vercel import repository, select Vite preset, and root directory that contains `package.json` (repo root if you uploaded contents directly).
3. Settings → Environment Variables → create **GEMINI_API_KEY** from Google AI Studio. Do not use `VITE_` prefix; never commit secrets.
4. Optional `GEMINI_ANALYSIS_MODEL` default `gemini-2.5-flash` and `GEMINI_IMAGE_MODEL` default `gemini-2.5-flash-image`. For Nano Banana 2.1, set image model to `gemini-nano-banana-2.1` if your API key has access. Redeploy after settings change.
5. Vercel settings: build command `npm run build`; output `dist`; API runs as serverless function `api/ai.js`.

## Workflow

1. Artwork → Upload JPG, PNG, WebP or PSD.
2. AI Studio → **Analyze thumbnail**: Gemini identifies title/logo and character bounding boxes, normalized 0–1000.
3. **Move detected logo** is a deterministic crop of ORIGINAL pixels (background may remain).
4. **Isolate game logo (AI)** asks Nano Banana for a transparent logo image. Check visually for text distortion or opacity; a raster image model cannot guarantee exact transparent original vectors.
5. **Remove baked-in logo** reconstructs missing background; inspect AI changes and any modified characters.
6. **Extract character** generates downloadable character image, which might need transparency cleanup.
7. The final Canvas renderer places **blue gradient BEFORE the logo**, locks logo inside y=308–428 and horizontally centers it. Export PNG/WebP.

## Limitations

- Flat images do not provide genuine editable PSD layers. Generated isolated layers may be imperfect.
- Nano Banana can change lettering or faces and may return opaque images. Always verify original logo, alpha and output with a designer before publishing.
- For pixel-exact branding, use the official transparent logo from the supplier PSD.
- Serverless function accepts up to ~6 MB image input and can time out on intensive generations; costs and model access depend on your Google account and Vercel plan.
- AI outputs should be reviewed, not silently published.
