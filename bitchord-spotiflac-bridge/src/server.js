import express from "express";
import { manifest } from "./manifest.js";
import { ProviderAdapter } from "./providers/spotiflac/adapter.js";

const app = express();
const provider = new ProviderAdapter();

const port = Number(process.env.PORT || 3000);

app.disable("x-powered-by");

app.get("/manifest.json", (_req, res) => {
  res.json(manifest);
});

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    providerConfigured: provider.configured
  });
});

app.get("/search", async (req, res) => {
  const q = String(req.query.q || "").trim();

  const quality = String(
    req.query.quality || "lossless"
  );

  const atmos = String(
    req.query.atmos || "auto"
  );

  if (!q) {
    return res.json({ tracks: [] });
  }

  try {
    const tracks = await provider.search(q, {
      quality,
      atmos
    });

    res
      .set("Cache-Control", "no-store")
      .json({ tracks });

  } catch (error) {
    console.error(error);

    res.status(Number(error.statusCode) || 502).json({
      tracks: [],
      error: "provider_unavailable"
    });
  }
});

app.get("/stream/:id", async (req, res) => {
  try {
    const result = await provider.stream(
      decodeURIComponent(req.params.id),
      {
        quality: String(req.query.quality || "lossless"),
        atmos: String(req.query.atmos || "auto")
      }
    );

    if (!result) {
      return res.status(404).json({
        error: "stream_not_found"
      });
    }

    res
      .set("Cache-Control", "no-store")
      .json(result);

  } catch (error) {
    console.error(error);

    res.status(Number(error.statusCode) || 502).json({
      error: "provider_unavailable"
    });
  }
});

app.listen(port, () => {
  console.log(
    `BitChord bridge listening on :${port}`
  );
});
