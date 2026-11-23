<template>
  <q-btn
    dense
    flat
    no-caps
    size="sm"
    icon="mdi-dice-multiple"
    :label="roll.label"
    :loading="loading"
    :disable="!bridge.dicePlusReady"
    @click="run"
  >
    <q-tooltip>
      {{ bridge.dicePlusReady ? roll.notation : "Dice+ ist nicht verfügbar" }}
    </q-tooltip>
  </q-btn>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { Notify } from "quasar";
import type { RollButton } from "@/model/types";
import { rollTargetOf, rollWithDicePlus } from "@/services/dicePlus";
import { useBridgeStore } from "@/stores/bridge";

const props = defineProps<{ roll: RollButton }>();
const bridge = useBridgeStore();
const loading = ref(false);

/** Erste Würfelaugenzahl aus der Dice+-Antwort. */
const firstDie = (payload: Record<string, unknown>): number | undefined => {
  const outer = payload.result as
    | { result?: { groups?: { dice?: { value?: number }[] }[] } }
    | undefined;
  return outer?.result?.groups?.[0]?.dice?.[0]?.value;
};

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const run = async () => {
  loading.value = true;
  try {
    const payload = await rollWithDicePlus(
      props.roll.notation,
      rollTargetOf(bridge.rollTarget)
    );
    // Verbrauchsgut: die App senkt den Würfel anhand des Ergebnisses.
    if (props.roll.apply === "consumable" && props.roll.refId) {
      const value = firstDie(payload);
      if (value !== undefined) {
        bridge.send({
          type: "character-roll-result",
          kind: "consumable",
          refId: props.roll.refId,
          value
        });
      }
    }
  } catch (error) {
    Notify.create({ type: "warning", message: errorText(error) });
  } finally {
    loading.value = false;
  }
};
</script>
