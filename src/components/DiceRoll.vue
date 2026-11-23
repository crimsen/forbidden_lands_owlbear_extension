<template>
  <q-btn
    dense
    flat
    no-caps
    size="sm"
    icon="mdi-dice-multiple"
    :label="roll.label"
    :disable="!bridge.connected || !bridge.dicePlusReady"
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

const tooltip = computed(() => {
  if (!bridge.connected) return "App nicht verbunden";
  if (!bridge.dicePlusReady) return "Dice+ ist nicht verfügbar";
  return props.roll.notation || props.roll.label;
});
</script>
