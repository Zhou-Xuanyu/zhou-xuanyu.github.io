# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```sh
npm install          # install dependencies
npm start            # dev server at http://localhost:8080 with live reload
npm run build        # build to _site/
```

No linting or tests are configured.

## Architecture

Personal site built with [Eleventy (11ty)](https://www.11ty.dev/).

- `src/` — all source content and templates; Eleventy's input dir
- `_site/` — build output (gitignored)
- `.eleventy.js` — config (ESM); passes `src/css`, `src/fonts`, `src/images`, `src/js` through verbatim

### Content types

Two post types, both Markdown with frontmatter:

**Noise** (`src/noise/*.md`) — monthly personal journal/microblog. One file per month (e.g. `2026-05.md`). New entries are added as `## <timestamp>` headings within the month file. Frontmatter:
```yaml
title: 2026年5月 May 2026
layout: layouts/noise.html
tags: noise
extra_css: css/noise.css
```

**Thoughts** (`src/thoughts/*.md`) — longer-form articles. One file per post. Frontmatter:
```yaml
title: Post Title
layout: layouts/thought.html
tags: thoughts
extra_css: css/thoughts.css
post_date: "May 19, 2026"
```

### Templates

Home page is `src/index.liquid`. Layouts in `src/_includes/layouts/`:

- `base.html` — root layout; links `style.css` + `hljs.css` globally, injects `extra_css` if set, sets `noindex` meta, loads `/js/code-lines.js`
- `noise.html` / `thought.html` — extend `base.html`; add a back-nav link; `thought.html` also renders `title` and `post_date`
- `page.html` — generic page layout

### Collections

Two collections built from `tags` frontmatter, both rendered on the home page:

- `collections.thoughts` — sorted by `post_date` descending (parsed as `Date`)
- `collections.noise` — sorted by `inputPath` descending (so newer `YYYY-MM.md` files come first)

Both sorts are defined explicitly in `.eleventy.js` via `addCollection` — don't rely on Eleventy's default tag-based order.

### Markdown pipeline

`.eleventy.js` configures `markdown-it` with:

- `typographer: true` for smart quotes/dashes
- `markdown-it-anchor` with a custom slugify that lowercases and hyphenates ASCII, and falls back to `encodeURIComponent` for pure-CJK headings
- `markdown-it-pangu-pro` for automatic CJK/Latin spacing
- `highlight.js` for fenced code blocks (uses declared language, else autodetect)

### Link transforms

Two Eleventy transforms run on `.md` outputs:

- `resolve-relative-paths` — rewrites `href`/`src` attributes that start with `..` to absolute site paths, stripping the leading `src/`. So `../images/photo.jpg` inside `src/thoughts/post.md` becomes `/images/photo.jpg`.
- `rewrite-md-hrefs` — rewrites `href="…/foo.md"` to `href="…/foo/"` so cross-post links match Eleventy's pretty-URL output.

When writing posts, prefer `../images/x.jpg` and `../thoughts/x.md`-style relative links; the transforms will normalize them at build time.

## Migration Plan: GitHub Pages → Self-Hosted

### Goal
Move off GitHub Pages onto own Debian server. Add dynamic features (reading counts, comments) over time.

### Repo Structure (target)
This repo (`pages`) gets split into two:

```
content-repo/          ← markdown + images only (current src/noise, src/thoughts, src/images)
site-repo/
  frontend/            ← eleventy config, templates, CSS/JS/fonts (moved from here)
  backend/             ← Python FastAPI server
    main.py
    static/            ← _site/ deployed here (gitignored)
    requirements.txt
```

Current repo (`pages`) is the basis for `site-repo/frontend/`.

### Build Pipeline
On push to content-repo → GitHub Actions:
1. Clone content-repo + site-repo/frontend
2. Merge content into frontend/src/
3. `npm run build` → `_site/`
4. Copy `_site/` to `backend/static/`
5. Deploy to server

### Backend (Python FastAPI)
```python
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

app = FastAPI()
app.mount("/", StaticFiles(directory="static", html=True), name="static")

# Phase 2: @app.get("/api/views/{slug}")
# Phase 3: @app.get("/api/comments/{slug}"), @app.post("/api/comments/{slug}")
```

Run with `uvicorn backend.main:app`. Database: SQLite.

### Dynamic Features Architecture
Static HTML + JS that fetches from backend API on page load:
- Reading counts: JS calls `GET /api/views/{slug}` on load → backend increments SQLite counter → JS shows count
- Comments: JS calls `GET /api/comments/{slug}` on load → renders list; form POST to `POST /api/comments/{slug}` → backend saves → JS appends
- Eleventy templates need empty placeholder divs + `/js/comments.js` script tag
- No user registration for now — anonymous comments (name + body only)

### Build Phases
1. Scaffold repos + local build pipeline (content → Eleventy → static/)
2. FastAPI serves static files locally
3. Add reading counts (SQLite: slug, count)
4. Add anonymous comments (SQLite: slug, name, body, created_at)
5. GitHub Actions deploy to Debian server
