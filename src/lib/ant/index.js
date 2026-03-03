// src/lib/ant/index.js
import { WebRTCAdaptor } from "@antmedia/webrtc_adaptor";

/** Build AMS websocket URL; must end with /websocket */
export function buildAntWsUrl() {
  const host =
    import.meta.env.VITE_MEDIA_HOST ||
    window.ANT_MEDIA_HOST ||
    location.hostname;
  const app = import.meta.env.VITE_ANT_APP || window.ANT_MEDIA_APP || "LiveApp";
  const portRaw =
    import.meta.env.VITE_MEDIA_PORT || window.ANT_MEDIA_PORT || "";

  const hasPort = !!portRaw;
  const secure = location.protocol === "https:" || String(portRaw) === "5443";
  const scheme = secure ? "wss" : "ws";
  const port = hasPort ? String(portRaw) : secure ? "5443" : "5080";

  return `${scheme}://${host}:${port}/${app}/websocket`;
}

/** Tiny WS probe so we fail fast if the URL/proxy/origin is wrong */
export function pingWebSocket(url, timeoutMs = 5000) {
  return new Promise((resolve) => {
    let done = false;
    let timer = setTimeout(() => {
      if (done) return;
      done = true;
      try {
        ws?.close();
      } catch {}
      resolve({ ok: false, reason: "timeout" });
    }, timeoutMs);

    let ws;
    try {
      ws = new WebSocket(url);
    } catch (e) {
      clearTimeout(timer);
      return resolve({ ok: false, reason: "bad-url", error: String(e) });
    }

    ws.onopen = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      try {
        ws.close();
      } catch {}
      resolve({ ok: true });
    };
    ws.onerror = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      resolve({ ok: false, reason: "onerror" });
    };
    ws.onclose = (e) => {
      // If it closed before onopen, treat as failure
      if (!done) {
        done = true;
        clearTimeout(timer);
        resolve({ ok: false, reason: `closed(${e?.code || "?"})` });
      }
    };
  });
}

/** Create the WebRTC adaptor per Ant Media docs */
export function createAdaptor({
  websocket_url = buildAntWsUrl(),
  localVideoId, // required for publisher; omit for pure player
  mediaConstraints = { video: true, audio: true },
  peerconnection_config = {
    iceServers: [{ urls: "stun:stun1.l.google.com:19302" }],
  },
  debug = false,
  dataChannelEnabled = true,
  dataChannelLabel = "dataChannel",
  onInfo,
  onError,
}) {
  const adaptor = new WebRTCAdaptor({
    websocket_url,
    localVideoId,
    mediaConstraints,
    peerconnection_config,
    debug,
    dataChannelEnabled,
    dataChannelLabel,
    callback: (info, obj) => onInfo?.(info, obj),
    callbackError: (err, msg) => onError?.(err, msg),
  });

  // QoL helpers
  adaptor.waitWsOpen = () =>
    new Promise((resolve) => {
      const iv = setInterval(() => {
        if (adaptor?.websocket?.readyState === 1) {
          clearInterval(iv);
          resolve(true);
        }
      }, 50);
    });
  adaptor.safePublish = async (id) => {
    try {
      await adaptor.publish(id);
    } catch {}
  };
  adaptor.safePlay = async (id) => {
    try {
      await adaptor.play(id);
    } catch {}
  };
  adaptor.safeStop = (id) => {
    try {
      adaptor.stop(id);
    } catch {}
  };
  adaptor.safeClose = () => {
    try {
      adaptor.closeWebSocket?.();
    } catch {}
  };
  adaptor.sendDataSafe = (id, data) => {
    try {
      adaptor.sendData(
        id,
        typeof data === "string" ? data : JSON.stringify(data)
      );
      return true;
    } catch {
      return false;
    }
  };

  return adaptor;
}
