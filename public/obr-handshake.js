// Fängt OBR_READY ab, bevor das App-Bundle den SDK-Listener registriert.
// src/services/obr.ts spielt das Event danach erneut ein.
window.addEventListener("message", event => {
  const data = event.data;
  if (data && data.id === "OBR_READY" && event.source === window.parent) {
    window.__obrHandshake = { data, origin: event.origin, at: Date.now() };
  }
});
