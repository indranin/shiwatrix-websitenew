# Deployment Guide

This project can be deployed three ways. Pick whichever fits — no code
changes are needed to switch between them.

## Before deploying, on any platform

Set these environment variables on the host (see `.env.example` for the
full list and comments):

- `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`
- `CONTACT_TO_EMAIL` — inbox that should receive contact form submissions
- `CONTACT_FROM_EMAIL` — optional, defaults to `SMTP_USER`
- `ALLOWED_ORIGIN` — set to your production domain (e.g.
  `https://www.shiwatrixlifesciences.com`) once you know it

Never commit a real `.env` file — it's already git-ignored.

---

## Option A — Render / Railway / Fly.io / any Node host

The simplest path: this is a standard Express app.

1. Push this repo to GitHub (see below).
2. Create a new **Web Service** on Render (or equivalent) pointing at the repo.
3. Build command: `npm install`
4. Start command: `npm start`
5. Add the environment variables listed above in the host's dashboard.

The app reads `PORT` from the environment automatically (`server.js`
falls back to 3000 locally), so no extra config is needed.

## Option B — Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Vercel auto-detects `api/contact.js` as a serverless function and uses
   `vercel.json` (`outputDirectory: "public"`) to serve the static site.
3. Add the environment variables in Project Settings → Environment Variables.
4. Deploy — no build command needed (it's static + one function).

## Option C — Netlify

1. Push this repo to GitHub and import it in Netlify.
2. `netlify.toml` already points the build's publish directory at `public`
   and registers `netlify/functions/contact.js` as a function, with a
   redirect so the frontend's `POST /api/contact` reaches it.
3. Add the environment variables in Site Settings → Environment Variables.
4. Deploy — no build command needed.

---

## Pushing this repo to GitHub

This folder has its own git repository (separate from any repo higher up
in your home directory). To publish it:

```bash
git remote add origin https://github.com/<your-username>/<repo-name>.git
git branch -M main
git push -u origin main
```

## Local testing with real email sending

```bash
cp .env.example .env   # then fill in real values
npm install
npm start
```

`server.js` loads `.env` automatically via `dotenv`. In production, set the
same variables directly in your host's dashboard — `.env` is never needed
(or present) there.
