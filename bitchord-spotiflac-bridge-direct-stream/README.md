# BitChord ↔ SpotiFLAC Bridge

Ready-to-deploy BitChord HTTP addon. The bridge resolves the source URL with the configured provider, then proxies audio bytes directly to BitChord without saving or caching the audio on the server.

BitChord calls:
- GET /manifest.json
- GET /search?q=...
- GET or HEAD /stream/:id (audio response; supports Range and If-Range)

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

The provider's `GET /stream/:id` must return JSON containing an authorized HTTP(S) audio `url`. It may also return `headers` for source authorization (for example, a short-lived bearer token), plus format metadata. The bridge forwards those provider-supplied headers and the client's Range/If-Range headers, then relays the source status, content type, length, range, validators, and body. Range responses such as `206 Partial Content` and unsatisfied ranges (`416`) are passed through. Audio is streamed in memory with backpressure and is never written to disk.

Without a provider, the bridge returns one demo search result and `/stream/:id` returns 404; there is no playable demo audio.

Run `npm run check` to validate JavaScript syntax. `npm start` launches the HTTP service.

## HTTPS
Put Caddy/Nginx/Cloudflare Tunnel in front of port 3000. Then add:
https://YOUR-DOMAIN/manifest.json
to BitChord → Settings → Sources → Add an addon.

Do not commit passwords, cookies, private tokens, or app secrets.
