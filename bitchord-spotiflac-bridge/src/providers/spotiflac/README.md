SpotiFLAC `.spotiflac-ext` files run inside the SpotiFLAC extension runtime. This bridge does not execute them directly. ProviderAdapter is the integration boundary for a legitimate server-side provider API.

Expected provider endpoints:
GET /search?q=...&quality=lossless&atmos=auto
GET /stream/:id?quality=lossless&atmos=auto

Keep credentials in .env. Do not bypass DRM, subscriptions, authentication, or protected media controls.