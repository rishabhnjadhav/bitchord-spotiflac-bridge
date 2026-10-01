function normalizeTracks(items) {
  return (Array.isArray(items) ? items : [])
    .map((t) => ({
      id: String(t.id ?? ""),

      title: String(
        t.title ??
        t.name ??
        ""
      ),

      artist:
        t.artist ??
        t.artists,

      album:
        t.album ??
        t.album_name,

      duration:
        t.duration ??
        (Number(t.duration_ms) / 1000 || undefined),

      artworkURL:
        t.artworkURL ??
        t.artwork_url ??
        t.cover_url ??
        t.images?.[0],

      format:
        t.format ??
        "flac",

      audioQuality:
        t.audioQuality ??
        t.quality ??
        "LOSSLESS",

      ...(t.atmos
        ? {
            atmos: true,
            audioModes: ["DOLBY_ATMOS"]
          }
        : {}),

      ...(Array.isArray(t.audioModes)
        ? {
            audioModes: t.audioModes
          }
        : {})
    }))
    .filter(
      (track) =>
        track.id &&
        track.title
    );
}


function normalizeStream(value) {
  if (!value?.url) {
    return null;
  }

  const url = new URL(value.url);

  if (
    !["http:", "https:"].includes(
      url.protocol
    )
  ) {
    throw new Error(
      "Provider returned a non-HTTP media URL"
    );
  }

  return {
    url: url.toString(),

    format:
      value.format ??
      value.container,

    quality:
      value.quality,

    codec:
      value.codec,

    container:
      value.container,

    manifest:
      value.manifest ??
      "none",

    encrypted:
      Boolean(value.encrypted),

    sampleRate:
      value.sampleRate,

    bitDepth:
      value.bitDepth,

    bitrate:
      value.bitrate,

    ...(value.audioMode
      ? {
          audioMode:
            value.audioMode
        }
      : {})
  };
}


async function getJSON(url) {
  const headers = {
    Accept: "application/json"
  };

  const key =
    process.env.PROVIDER_API_KEY;

  if (key) {
    headers[
      process.env.PROVIDER_AUTH_HEADER ||
      "X-Provider-Key"
    ] = key;
  }

  const controller =
    new AbortController();

  const timeout = setTimeout(
    () =>
      controller.abort(),

    Number(
      process.env.PROVIDER_TIMEOUT_MS ||
      15000
    )
  );

  try {
    const response =
      await fetch(url, {
        headers,
        signal: controller.signal
      });

    if (!response.ok) {
      const error = new Error(
        `Provider HTTP ${response.status}`
      );

      error.statusCode =
        response.status === 404
          ? 404
          : 502;

      throw error;
    }

    return await response.json();

  } finally {
    clearTimeout(timeout);
  }
}


export class ProviderAdapter {
  constructor() {
    this.base =
      process.env.PROVIDER_BASE_URL
        ?.trim()
        .replace(/\/$/, "") ||
      "";

    this.configured =
      Boolean(this.base);
  }


  async search(query, options) {
    if (!this.base) {
      return [];
    }

    const url =
      new URL(
        "/search",
        this.base
      );

    url.searchParams.set(
      "q",
      query
    );

    url.searchParams.set(
      "quality",
      options.quality
    );

    url.searchParams.set(
      "atmos",
      options.atmos
    );

    const payload =
      await getJSON(url);

    return normalizeTracks(
      payload?.tracks ??
      payload?.results
    );
  }


  async stream(id, options) {
    if (!this.base) {
      return null;
    }

    const url =
      new URL(
        `/stream/${encodeURIComponent(id)}`,
        this.base
      );

    url.searchParams.set(
      "quality",
      options.quality
    );

    url.searchParams.set(
      "atmos",
      options.atmos
    );

    return normalizeStream(
      await getJSON(url)
    );
  }
}
