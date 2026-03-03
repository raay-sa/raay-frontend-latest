  // src/utils/live.js
  const ANT_BASE = (
    import.meta.env.VITE_MEDIA_URL || "https://media.esol.sa:5443"
  ).replace(/\/+$/, "");
  const ENV_APP = (import.meta.env.VITE_ANT_APP || "").replace(/^\/+|\/+$/g, "");

  // build /<app>/publish.html?name=<id>
  export const buildAntPublishUrl = (appName, streamId, token) => {
    if (!streamId) return "";
    const seg = appName && appName !== "ROOT" ? `/${appName}` : "";
    let url = `${ANT_BASE}${seg}/publish.html?name=${encodeURIComponent(
      streamId
    )}`;
    if (token) url += `&token=${encodeURIComponent(token)}`;
    return url;
  };

  // common app names to try if you don't know it
  export const candidateApps = () => {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))];
    return uniq([
      ENV_APP || null, // from .env if provided
      "LiveApp", // most common
      "WebRTCAppEE", // enterprise default
      "WebRTCApp", // community default
      "ROOT", // some setups serve publish.html at root
    ]);
  };
