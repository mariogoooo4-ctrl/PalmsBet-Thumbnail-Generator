# PalmsBet Thumbnail Studio · React

A browser-based thumbnail composition tool built with React, Vite, `ag-psd`, HTML Canvas and a clean Apple-inspired interface.

## Quick start

```bash
npm install
npm run dev
```

Open the local address printed by Vite. Production build: `npm run build` (output in `dist/`).

## GitHub Pages deployment

1. Create a **new GitHub repository** and upload **the contents of this folder** (not the ZIP file itself). Include the `.github/workflows/deploy.yml` directory.
2. Ensure the default branch is `main` and push all files.
3. Under **Settings → Pages → Build and deployment**, select **GitHub Actions** as the source.
4. Wait for the `Deploy to GitHub Pages` workflow to complete. Your app will be available at the repository's Pages URL.

Relative asset paths and `base: './'` make the build work under a GitHub Pages subdirectory.

## Features

- Upload JPG / PNG / WebP files and supported PSD files; choose a PSD raster layer for artwork/logo.
- Upload a separate transparent game logo, or manually crop a flattened original (background is **not** removed automatically).
- Edit artwork scale, x/y position, contrast, brightness, saturation; adjust blue-gradient start/transition, top shade, logo scaling and shadow.
- 328×458 vertical composition with hardcoded 49px top / 259px art / 120px game logo / 30px ribbon zones.
- Hardcoded `#0025A3` blue color at bottom; the game logo is rendered **after** the gradient, constrained within its 120px zone.
- Alternative 324×189 horizontal export is a proportional scaling of the 328×458 composition, **not a separately art-directed crop**.
- Export PNG or WebP directly in browser; visual guidelines excluded from export.
- Preview/sample image from the source set is bundled in `public/`.

## Practical limitations

This app is a layout/compositing editor **not** an AI background-removal or generative retouching tool. A flattened image with its existing baked-in logo cannot magically have that logo removed. For clean professional assets use the provider PSD or a clean background/main character and a separate transparent game logo. Photoshop PSD layers with advanced effects, complex masks and unsupported color formats may not match Photoshop exactly. No server is involved and uploaded files stay in your browser. For responsive outputs, the horizontal preset uses a scaled version of the vertical layout.

## Stack

React 18 · Vite 6 · lucide-react · ag-psd · Canvas API.
