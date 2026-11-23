<template>
  <div v-if="state && derived" class="q-pa-sm">
    <q-input
      dense
      outlined
      label="Name"
      :model-value="state.name"
      @change="(value: string) => setText('name', value)"
    />
    <div class="row q-col-gutter-sm q-mt-xs">
      <q-select
        class="col"
        dense
        outlined
        label="Volk"
        :model-value="state.kin"
        :options="kinOptions"
        @update:model-value="value => setText('kin', value)"
      />
      <q-select
        class="col"
        dense
        outlined
        label="Beruf"
        :model-value="state.profession"
        :options="professionOptions"
        @update:model-value="value => setText('profession', value)"
      />
    </div>

    <div class="text-subtitle2 q-mt-md">Aussehen</div>
    <q-input
      v-for="field in appearanceFields"
      :key="field.field"
      dense
      outlined
      :label="field.label"
      :model-value="state.appearance[field.field]"
      @change="(value: string) => setAppearance(field.field, value)"
    />

    <q-input
      class="q-mt-md"
      dense
      outlined
      type="textarea"
      label="Stolz"
      :model-value="state.pride"
      @change="(value: string) => setText('pride', value)"
    />
    <q-input
      class="q-mt-xs"
      dense
      outlined
      type="textarea"
      label="Dunkles Geheimnis"
      :model-value="state.darkSecret"
      @change="(value: string) => setText('darkSecret', value)"
    />
    <q-input
      class="q-mt-xs"
      dense
      outlined
      type="textarea"
      label="Kritische Verletzung"
      :model-value="state.criticalInjury"
      @change="(value: string) => setText('criticalInjury', value)"
    />
    <q-input
      class="q-mt-xs"
      dense
      outlined
      type="textarea"
      autogrow
      label="Notizen"
      :model-value="state.notes"
      @change="(value: string) => setText('notes', value)"
    />

    <div class="text-subtitle2 q-mt-md">Zauberbuch</div>
    <div
      v-for="name in state.spellbook"
      :key="name"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col text-body2">{{ name }}</div>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-delete"
        color="negative"
        @click="removeSpell(name)"
      />
    </div>
    <q-select
      :model-value="null"
      :options="spellOptions"
      dense
      outlined
      emit-value
      map-options
      label="Zauber hinzufügen"
      @update:model-value="addSpell"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

const catalog = useCatalogStore();
const character = useCharacterStore();

const state = computed(() => character.state);
const derived = computed(() => character.derived);

const kinOptions = computed(() => catalog.ruleset?.kinOptions ?? []);
const professionOptions = computed(
  () => catalog.ruleset?.professionOptions ?? []
);

const appearanceFields = [
  { field: "face", label: "Gesicht" },
  { field: "body", label: "Körper" },
  { field: "clothing", label: "Kleidung" }
] as const;

const spellOptions = computed(() => {
  const known = new Set(state.value?.spellbook ?? []);
  return (derived.value?.castableSpells ?? [])
    .filter(name => !known.has(name))
    .map(name => ({ label: name, value: name }));
});

const setText = (field: string, value: string) =>
  character.sendAction("text.set", { field, value });
const setAppearance = (field: string, value: string) =>
  character.sendAction("appearance.set", { field, value });
const addSpell = (name: string) => {
  if (name) character.sendAction("spellbook.add", { name });
};
const removeSpell = (name: string) =>
  character.sendAction("spellbook.remove", { name });
</script>
