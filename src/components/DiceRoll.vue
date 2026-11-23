<template>
  <q-btn
    dense
    flat
    no-caps
    size="sm"
    icon="mdi-dice-multiple"
    :label="roll.label"
    :loading="loading"
    :disable="disabled"
    @click="run"
  >
    <q-tooltip>{{ tooltip }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import { Notify } from "quasar";
import { EVENT_ROLL } from "@/model/roll";
import type { RollButton } from "@/model/types";
import { rollTargetOf, rollWithDicePlus } from "@/services/dicePlus";
import { useBridgeStore } from "@/stores/bridge";
import { useRollDialogStore } from "@/stores/rollDialog";

const props = defineProps<{ roll: RollButton }>();
const bridge = useBridgeStore();
const dialog = useRollDialogStore();
const loading = ref(false);

/** Freier und Ereigniswurf laufen notfalls ohne App (nur Dice+ nötig). */
const needsApp = computed(
  () => props.roll.group !== "free" && props.roll.group !== "event"
);

const disabled = computed(
  () => !bridge.dicePlusReady || (needsApp.value && !bridge.connected)
);

const tooltip = computed(() => {
  if (!bridge.dicePlusReady) return "Dice+ ist nicht verfügbar";
  if (needsApp.value && !bridge.connected) return "App nicht verbunden";
  return props.roll.notation || props.roll.label;
});

/** Zehner/Einer des T66-Wurfs, z. B. "34". */
const eventValue = (payload: Record<string, unknown>): string => {
  const outer = payload.result as
    | { result?: { groups?: { dice?: { value?: number }[] }[] } }
    | undefined;
  const digits =
    outer?.result?.groups?.[0]?.dice?.map(die => die.value ?? 0) ?? [];
  return digits.length ? digits.join("") : "?";
};

const run = async () => {
  // Nur der Ereigniswurf würfelt direkt; alles andere öffnet den Dialog.
  if (props.roll.group !== "event") {
    dialog.show(props.roll);
    return;
  }
  if (bridge.connected) {
    // Die App würfelt über Dice+ und zeigt ihre Benachrichtigung.
    bridge.send({
      type: "roll-request",
      requestId: crypto.randomUUID(),
      kind: "event",
      params: { kind: "event" },
      target: bridge.rollTarget
    });
    return;
  }
  loading.value = true;
  try {
    const payload = await rollWithDicePlus(
      EVENT_ROLL.notation,
      rollTargetOf(bridge.rollTarget)
    );
    Notify.create({
      message: `Ereigniswurf: ${eventValue(payload)}`,
      color: "primary"
    });
  } catch (error) {
    Notify.create({
      type: "warning",
      message: error instanceof Error ? error.message : String(error)
    });
  } finally {
    loading.value = false;
  }
};
</script>
