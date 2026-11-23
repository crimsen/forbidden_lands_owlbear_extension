<template>
  <div v-if="state && derived" class="q-pa-sm">
    <div
      v-for="row in state.talents"
      :key="row.name"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col">
        <div class="text-body2">{{ row.name }}</div>
        <div class="text-caption text-grey-6">
          Stufe {{ row.level
          }}<span v-if="row.draft !== row.level"> → {{ row.draft }}</span>
        </div>
      </div>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-minus"
        :disable="row.draft <= row.level"
        @click="draft(row.name, row.draft - 1)"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-plus"
        @click="draft(row.name, row.draft + 1)"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-check"
        color="primary"
        :disable="row.draft === row.level"
        @click="confirm(row.name)"
      >
        <q-tooltip>Steigerung mit EP bestätigen</q-tooltip>
      </q-btn>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-delete"
        color="negative"
        @click="remove(row.name)"
      />
    </div>

    <q-select
      class="q-mt-md"
      :model-value="null"
      :options="learnable"
      dense
      outlined
      emit-value
      map-options
      label="Talent lernen"
      @update:model-value="learn"
    />
    <div v-if="derived.kinTalent" class="text-caption text-grey-6 q-mt-xs">
      Volkstalent: {{ derived.kinTalent }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCharacterStore } from "@/stores/character";

const character = useCharacterStore();
const state = computed(() => character.state);
const derived = computed(() => character.derived);

const learnable = computed(() => {
  const known = new Set(
    (state.value?.talents ?? [])
      .filter(row => row.level > 0)
      .map(row => row.name)
  );
  return (derived.value?.learnableTalents ?? [])
    .filter(name => !known.has(name))
    .map(name => ({ label: name, value: name }));
});

const draft = (name: string, level: number) =>
  character.sendAction("talent.draft", { name, level });
const confirm = (name: string) =>
  character.sendAction("talent.confirm", { name });
const remove = (name: string) =>
  character.sendAction("talent.remove", { name });
const learn = (name: string) => {
  if (name) character.sendAction("talent.learn", { name });
};
</script>
