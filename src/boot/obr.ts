import OBR from "@owlbear-rodeo/sdk";

console.log("[dice+] OBR SDK booted", {
  href: window.location.href,
  isReady: OBR.isReady,
  isAvailable: OBR.isAvailable
});

// Diagnose: kommt OBR_READY an und mit welchem Origin?
window.addEventListener("message", event => {
  const data = event.data as { id?: string } | null;
  if (data?.id === "OBR_READY") {
    console.log("[dice+] raw OBR_READY", { origin: event.origin });
  }
});
