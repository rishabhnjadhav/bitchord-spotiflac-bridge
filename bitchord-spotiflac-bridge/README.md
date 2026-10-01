# BitChord ↔ SpotiFLAC Bridge

Ready-to-deploy BitChord HTTP addon scaffold.

BitChord calls:
- GET /manifest.json
- GET /search?q=...
- GET /stream/:id

SpotiFLAC extensions use `registerExtension()` inside the SpotiFLAC runtime, so a `.spotiflac-ext` package cannot simply be dropped into an Express server. This project keeps a clean adapter boundary instead.

## Local
cp .env.example .env
npm install
npm start

## Docker
cp .env.example .env
# edit .env
docker compose up -d --build

## Provider
Set PROVIDER_BASE_URL to a service you control/are authorized to use. It must expose `/search` and `/stream/:id` as documented in `src/providers/spotiflac/README.md`.

Without a provider, the bridge returns one demo search result and deliberately no playable URL.

## HTTPS
Put Caddy/Nginx/Cloudflare Tunnel in front of port 3000. Then add:
https://YOUR-DOMAIN/manifest.json
to BitChord → Settings → Sources → Add an addon.

Do not commit passwords, cookies, private tokens, or app secrets.
