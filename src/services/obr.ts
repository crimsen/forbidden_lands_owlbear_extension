import OBR from "@owlbear-rodeo/sdk";
import { computed, ref } from "vue";

export type ObrState = "unavailable" | "connecting" | "ready" | "timeout";

const READY_TIMEOUT_MS = 5000;
/** Wiederholte Prüfung, bis Owlbear bereit ist (Handshake kann verpasst werden). */
const READY_RETRY_MS = 2000;

const available = Boolean(OBR.isAvailable);
const obrrefOrigin = readObrrefOrigin();
const ready = ref(OBR.isReady);
const readyAt = ref<number | null>(OBR.isReady ? Date.now() : null);
const timedOut = ref(false);
const rawHandshakeOrigin = ref<string | null>(null);
const rawHandshakeAt = ref<number | null>(null);

let timer: ReturnType<typeof setTimeout> | undefined;
let retry: ReturnType<typeof setInterval> | undefined;

const stopRetry = () => {
  if (retry) clearInterval(retry);
  retry = undefined;
};

const markReady = () => {
  ready.value = true;
  readyAt.value = Date.now();
  timedOut.value = false;
  if (timer) clearTimeout(timer);
  stopRetry();
};

// Der Parent schickt OBR_READY oft, bevor der SDK-Listener existiert. Das
// Early-Script in public/ fängt ihn ab; hier wird er nachgespielt.
const replayCapturedHandshake = () => {
  const captured = window.__obrHandshake;
  if (!captured) return;
  rawHandshakeOrigin.value = captured.origin;
  rawHandshakeAt.value = captured.at;
  const originMatches = !obrrefOrigin || captured.origin === obrrefOrigin;
  if (originMatches) {
    window.dispatchEvent(
      new MessageEvent("message", {
        data: captured.data,
        origin: captured.origin,
        source: window.parent
      })
    );
  } else if (import.meta.env.DEV) {
    console.warn("[obr] OBR_READY origin mismatch", {
      expected: obrrefOrigin,
      actual: captured.origin
    });
  }
};

if (available) {
  if (OBR.isReady) {
    markReady();
  } else {
    OBR.onReady(markReady);
    timer = setTimeout(() => {
      if (!ready.value) timedOut.value = true;
    }, READY_TIMEOUT_MS);
    // Immer wieder prüfen, bis Owlbear bereit ist.
    replayCapturedHandshake();
    retry = setInterval(() => {
      if (ready.value) {
        stopRetry();
        return;
      }
      replayCapturedHandshake();
      if (OBR.isReady) markReady();
    }, READY_RETRY_MS);
  }
}

window.addEventListener("message", event => {
  if (event.source !== window.parent) return;
  const data = event.data as { id?: string } | null;
  if (data?.id !== "OBR_READY") return;
  rawHandshakeOrigin.value = event.origin;
  rawHandshakeAt.value = Date.now();
  if (import.meta.env.DEV) {
    console.info("[obr] OBR_READY", {
      origin: event.origin,
      ready: OBR.isReady
    });
  }
});

export const obrState = computed<ObrState>(() => {
  if (!available) return "unavailable";
  if (ready.value) return "ready";
  return timedOut.value ? "timeout" : "connecting";
});

export const obrDetail = computed(() => ({
  href: window.location.href,
  available,
  isReady: ready.value,
  obrrefOrigin,
  rawHandshakeOrigin: rawHandshakeOrigin.value,
  rawHandshakeAt: rawHandshakeAt.value,
  readyAt: readyAt.value,
  timedOut: timedOut.value
}));

export function waitForObrReady(timeout = READY_TIMEOUT_MS): Promise<boolean> {
  if (OBR.isReady) return Promise.resolve(true);
  return new Promise(resolve => {
    const timeoutId = setTimeout(() => resolve(false), timeout);
    OBR.onReady(() => {
      clearTimeout(timeoutId);
      resolve(true);
    });
  });
}

function readObrrefOrigin(): string {
  const ref = new URLSearchParams(window.location.search).get("obrref");
  if (!ref) return "";
  try {
    const [origin = ""] = atob(ref).split(" ");
    return origin;
  } catch {
    return "";
  }
}
