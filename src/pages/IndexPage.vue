<template>
  <q-page class="flex flex-center">
    <q-btn
      color="primary"
      label="W6 würfeln"
      :loading="rolling"
      @click="rollW6"
    />
  </q-page>
</template>

<script setup lang="ts">
import OBR from "@owlbear-rodeo/sdk";
import { Notify } from "quasar";
import { onUnmounted, ref } from "vue";

const SOURCE = "forbidden-lands-owlbear-extension";
const ROLL_REQUEST = "dice-plus/roll-request";
const READY = "dice-plus/isReady";
const VALIDATE = "dice-plus/validate-notation";
const RESULT = `${SOURCE}/roll-result`;
const ERROR = `${SOURCE}/roll-error`;
const NOTATION = "1d6";

const rolling = ref(false);

let unsubResult: (() => void) | undefined;
let unsubError: (() => void) | undefined;

function checkDicePlusReady(timeout = 1000): Promise<boolean> {
  const requestId = crypto.randomUUID();
  console.log("[dice+] isReady request", { requestId });
  return new Promise(resolve => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = OBR.broadcast.onMessage(READY, event => {
      console.log("[dice+] isReady message", event.data);
      const data = event.data as Record<string, unknown>;
      if ("ready" in data && data.requestId === requestId) {
        clearTimeout(timer);
        off();
        console.log("[dice+] isReady OK");
        resolve(true);
      }
    });
    timer = setTimeout(() => {
      off();
      console.warn("[dice+] isReady timeout");
      resolve(false);
    }, timeout);
    void OBR.broadcast.sendMessage(
      READY,
      { requestId, timestamp: Date.now() },
      { destination: "ALL" }
    );
  });
}

function validateNotation(
  notation: string,
  timeout = 1000
): Promise<{ valid: boolean; error: string | undefined }> {
  const requestId = crypto.randomUUID();
  console.log("[dice+] validate request", { requestId, notation });
  return new Promise(resolve => {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const off = OBR.broadcast.onMessage(VALIDATE, event => {
      console.log("[dice+] validate message", event.data);
      const data = event.data as Record<string, unknown>;
      if ("valid" in data && data.requestId === requestId) {
        clearTimeout(timer);
        off();
        console.log("[dice+] validate OK", { valid: data.valid });
        resolve({
          valid: data.valid as boolean,
          error: (data.error as { message?: string } | undefined)?.message
        });
      }
    });
    timer = setTimeout(() => {
      off();
      console.warn("[dice+] validate timeout", { notation });
      resolve({ valid: false, error: "Dice+ antwortet nicht" });
    }, timeout);
    void OBR.broadcast.sendMessage(
      VALIDATE,
      { requestId, notation, timestamp: Date.now() },
      { destination: "ALL" }
    );
  });
}

// Kanal öffnen: Listener für Dice+ Antworten (roll-result / roll-error)
function openChannels() {
  if (unsubResult) return;
  console.log("[dice+] opening channels", { RESULT, ERROR });
  unsubResult = OBR.broadcast.onMessage(RESULT, event => {
    console.log("[dice+] roll-result", event.data);
  });
  unsubError = OBR.broadcast.onMessage(ERROR, event => {
    console.warn("[dice+] roll-error", event.data);
  });
}

// Auf das SDK-Handshake warten (messageBus.ref ist sonst noch null)
function whenObrReady(timeout = 5000): Promise<boolean> {
  if (OBR.isReady) return Promise.resolve(true);
  return new Promise(resolve => {
    const timer = setTimeout(() => resolve(false), timeout);
    OBR.onReady(() => {
      clearTimeout(timer);
      resolve(true);
    });
  });
}

async function rollW6() {
  if (rolling.value) return;
  console.log("[dice+] click", { isAvailable: OBR.isAvailable });
  if (!OBR.isAvailable) {
    console.warn("[dice+] not embedded in Owlbear Rodeo");
    Notify.create({
      type: "warning",
      message: "Nur in Owlbear Rodeo verfügbar."
    });
    return;
  }
  rolling.value = true;
  try {
    console.log("[dice+] waiting for OBR ready");
    if (!(await whenObrReady())) {
      console.warn("[dice+] OBR never became ready");
      Notify.create({
        type: "warning",
        message: "Owlbear Rodeo ist nicht bereit."
      });
      return;
    }
    console.log("[dice+] OBR ready");
    const ready = await checkDicePlusReady();
    console.log("[dice+] dice+ ready:", ready);
    if (!ready) {
      Notify.create({ type: "warning", message: "Dice+ ist nicht verfügbar." });
      return;
    }
    const { valid, error } = await validateNotation(NOTATION);
    console.log("[dice+] notation check", { NOTATION, valid, error });
    if (!valid) {
      Notify.create({
        type: "warning",
        message: error ?? "Ungültige Notation"
      });
      return;
    }
    openChannels();
    const rollId = crypto.randomUUID();
    const playerId = await OBR.player.getId();
    const playerName = await OBR.player.getName();
    console.log("[dice+] sending roll", { rollId, playerId, playerName });
    await OBR.broadcast.sendMessage(
      ROLL_REQUEST,
      {
        rollId,
        playerId,
        playerName,
        rollTarget: "everyone",
        diceNotation: NOTATION,
        showResults: true,
        timestamp: Date.now(),
        source: SOURCE
      },
      { destination: "ALL" }
    );
    console.log("[dice+] roll sent", { rollId });
  } catch (error) {
    console.error("[dice+] roll failed", error);
    Notify.create({ type: "negative", message: "Würfeln fehlgeschlagen." });
  } finally {
    rolling.value = false;
  }
}

onUnmounted(() => {
  unsubResult?.();
  unsubError?.();
});
</script>
