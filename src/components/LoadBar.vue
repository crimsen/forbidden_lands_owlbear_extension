<template>
  <div v-if="derived" class="q-mb-md">
    <div class="row items-center">
      <div class="col text-subtitle1">Traglast</div>
      <div
        class="col-auto"
        :class="overloaded ? 'text-negative text-weight-bold' : 'text-grey-8'"
      >
        {{ derived.currentLoad }} / {{ derived.capacity }} ({{
          derived.remainingLoad
        }}
        frei)
      </div>
    </div>
    <q-linear-progress
      :value="ratio"
      :color="overloaded ? 'negative' : 'primary'"
      track-color="grey-4"
      size="10px"
      rounded
      class="q-mt-xs"
    />
    <div class="text-caption text-grey-6 q-mt-xs">
      Kapazität = Stärke × 2 ({{ strength }} × 2)
      <span v-if="derived.packeselBonus > 0">
        + {{ derived.packeselBonus }} durch Packesel
      </span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCharacterStore } from "@/stores/character";

const character = useCharacterStore();

const derived = computed(() => character.derived);
const strength = computed(
  () => character.state?.attributes["Stärke"]?.value ?? 0
);
const overloaded = computed(() => (derived.value?.remainingLoad ?? 0) < 0);
const ratio = computed(() => {
  const capacity = derived.value?.capacity ?? 0;
  return capacity > 0
    ? Math.min(1, (derived.value?.currentLoad ?? 0) / capacity)
    : 1;
});
</script>
