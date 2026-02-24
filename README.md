# Test — The Gazette (newspaper-style)

This repository is a minimal static newspaper/newsletter site. Newsletters are plain `.txt` files stored under `newsletters/`. A small manifest tells the site which files to load.

Newsletter .txt format
- Begin the file with a header block delimited by `---` on its own line.
- Inside the header use `Key: Value` lines. Supported keys:
  - `Title` (required-ish) — article headline
  - `Subtitle` — small lead text
  - `Author` — author name
  - `Thumbnail` — relative path to an image to use as the article thumbnail (e.g. `thumbnails/my-shot.jpg`)
  - `Date` — YYYY-MM-DD, used for sorting
- After the closing `---` add the article body as plain text. Blank lines are treated as paragraph breaks.

Example header:
---
Title: My Headline
Subtitle: A short subtitle
Author: Jane Reporter
Thumbnail: thumbnails/example.jpg
Date: 2026-01-20
---

How to add a new newsletter
1. Add a `.txt` file to `newsletters/` following the format above.
2. Add the filename to `newsletters/index.json` (append to the array).
3. Add any images to `thumbnails/`.
4. Commit and push to `main`. The site will pick the article up when reloaded.

Notes & next steps
- Because static sites cannot list directories via fetch, the manifest (`newsletters/index.json`) is used to tell the site what to load. If you later add a build step you can auto-generate this manifest.
- You can improve rendering by supporting Markdown in the body (e.g., using a small Markdown parser) or by adding pagination, tags, or categories.
