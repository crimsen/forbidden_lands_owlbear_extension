<template>
  <div v-if="state" class="q-pa-sm">
    <q-input
      v-if="ui.editing"
      dense
      outlined
      label="Name"
      :model-value="state.name"
      @change="(value: string) => setText('name', value)"
    />
    <div v-else class="text-h6">{{ state.name || "–" }}</div>

    <div class="row q-col-gutter-sm q-mt-xs">
      <div class="col">
        <div class="text-caption text-grey-6">Volk</div>
        <q-select
          v-if="ui.editing"
          dense
          outlined
          :model-value="state.kin"
          :options="kinOptions"
          @update:model-value="value => setText('kin', value)"
        />
        <div v-else class="text-body2">{{ state.kin || "–" }}</div>
      </div>
      <div class="col">
        <div class="text-caption text-grey-6">Beruf</div>
        <q-select
          v-if="ui.editing"
          dense
          outlined
          :model-value="state.profession"
          :options="professionOptions"
          @update:model-value="value => setText('profession', value)"
        />
        <div v-else class="text-body2">{{ state.profession || "–" }}</div>
      </div>
    </div>

    <div class="text-subtitle2 q-mt-md">Aussehen</div>
    <div v-for="field in appearanceFields" :key="field.field" class="q-mb-xs">
      <div class="text-caption text-grey-6">{{ field.label }}</div>
      <q-input
        v-if="ui.editing"
        dense
        outlined
        :model-value="state.appearance[field.field]"
        @change="(value: string) => setAppearance(field.field, value)"
      />
      <div v-else class="text-body2">{{
        state.appearance[field.field] || "–"
      }}</div>
    </div>

    <div class="text-subtitle2 q-mt-md">Hintergrund</div>
    <div v-for="field in backgroundFields" :key="field.field" class="q-mb-xs">
      <div class="text-caption text-grey-6">{{ field.label }}</div>
      <q-input
        v-if="ui.editing"
        dense
        outlined
        type="textarea"
        autogrow
        :model-value="state[field.field]"
        @change="(value: string) => setText(field.field, value)"
      />
      <div v-else class="text-body2" style="white-space: pre-line">
        {{ state[field.field] || "–" }}
      </div>
    </div>

    <q-input
      class="q-mt-md"
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
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";
import { useUiStore } from "@/stores/ui";

const catalog = useCatalogStore();
const character = useCharacterStore();
const ui = useUiStore();

const state = computed(() => character.state);

const kinOptions = computed(() => catalog.ruleset?.kinOptions ?? []);
const professionOptions = computed(
  () => catalog.ruleset?.professionOptions ?? []
);

const appearanceFields = [
  { field: "face", label: "Gesicht" },
  { field: "body", label: "Körper" },
  { field: "clothing", label: "Kleidung" }
] as const;

const backgroundFields = [
  { field: "pride", label: "Stolz" },
  { field: "darkSecret", label: "Dunkles Geheimnis" }
] as const;

const setText = (field: string, value: string) =>
  character.sendAction("text.set", { field, value });
const setAppearance = (field: string, value: string) =>
  character.sendAction("appearance.set", { field, value });
</script>
