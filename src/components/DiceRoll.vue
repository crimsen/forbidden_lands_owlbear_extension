<template>
  <q-btn
    dense
    flat
    no-caps
    size="sm"
    icon="mdi-dice-multiple"
    :label="roll.label"
    :disable="disabled"
    @click="dialog.show(roll)"
  >
    <q-tooltip>{{ tooltip }}</q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { RollButton } from "@/model/types";
import { useBridgeStore } from "@/stores/bridge";
import { useRollDialogStore } from "@/stores/rollDialog";

const props = defineProps<{ roll: RollButton }>();
const bridge = useBridgeStore();
const dialog = useRollDialogStore();

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
</script>
