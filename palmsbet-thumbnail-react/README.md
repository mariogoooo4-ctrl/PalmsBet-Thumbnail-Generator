# PalmsBet Thumbnail Studio — Free Edition

A free, browser-only React/Vite thumbnail compositor. **No Gemini, Nano Banana, paid API, backend, or environment variables.**

## Usage
1. Upload JPG, PNG, WebP or a PSD with a readable composite.
2. Move/zoom artwork to fit the main design area.
3. In **Logo**, upload the original transparent logo (best), or select a rectangle on the provider thumbnail and click **Use selected area**.
4. The editor locks the logo inside `y=308..428`, always drawing it after the blue gradient.
5. Export PNG or WebP. Everything runs in the local browser.

**Important:** JPG/PNG thumbnails are flat and cannot be perfectly separated into layers without an AI model or external photo editor. Rectangular crop is a manual fallback. Optional uniform-background removal works only on relatively simple backgrounds. The main artwork is clipped at y=308 so any embedded logo in its lower portion is removed from the composition.

## Run locally
```bash
npm install
npm run dev
```

## Vercel
Upload this folder to GitHub and import the repository into Vercel.
- Framework: Vite
- Root directory: folder with `package.json` (if uploading the parent folder choose `palmsbet-thumbnail-react`)
- Build: `npm run build`
- Output: `dist`

No environment variables required; remove old `GEMINI_API_KEY` from Vercel if this is your only use for it.

## Template
328×458 with regions: top 49, main 259, logo 120, ribbon 30. Blue: #0025A3. Horizontal canvas uses proportional downscaling to 324×189 (not a separate horizontal art direction).
