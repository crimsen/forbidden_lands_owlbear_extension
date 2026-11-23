<template>
  <div v-if="state && derived" class="q-pa-sm">
    <LoadBar />

    <div class="text-subtitle2">Attribute</div>
    <div
      v-for="name in attributeNames"
      :key="name"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col text-body2">{{ name }}</div>
      <div class="col-auto row items-center no-wrap">
        <q-btn
          v-if="ui.editing"
          flat
          dense
          round
          size="sm"
          icon="mdi-minus"
          :disable="(state.attributes[name]?.value ?? 0) <= 1"
          @click="changeValue(name, -1)"
        />
        <q-checkbox
          v-for="star in state.attributes[name]?.value ?? 0"
          :key="star"
          :model-value="star <= (state.attributes[name]?.health ?? 0)"
          :color="
            star <= (state.attributes[name]?.health ?? 0) ? 'primary' : 'grey-5'
          "
          checked-icon="mdi-star-circle"
          unchecked-icon="mdi-star-circle-outline"
          @click="setHealth(name, star)"
        />
        <q-btn
          v-if="ui.editing"
          flat
          dense
          round
          size="sm"
          icon="mdi-plus"
          @click="changeValue(name, 1)"
        />
      </div>
      <DiceRoll
        v-if="rollById[`attribute:${name}`]"
        :roll="rollById[`attribute:${name}`]!"
      />
    </div>

    <div class="text-subtitle2 q-mt-md">Ressourcen</div>
    <div
      v-for="res in resources"
      :key="res.field"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col text-body2">{{ res.label }}</div>
      <div class="text-h6 q-mr-sm">{{ res.value }}</div>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-minus"
        @click="resource(res.field, -1)"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-plus"
        @click="resource(res.field, 1)"
      />
    </div>

    <div class="text-subtitle2 q-mt-md">Geld</div>
    <div class="row q-col-gutter-sm">
      <q-input
        v-for="field in moneyFields"
        :key="field.field"
        class="col"
        dense
        outlined
        type="number"
        :label="field.label"
        :model-value="state.money[field.field]"
        @change="(value: string) => setMoney(field.field, Number(value))"
      />
    </div>

    <div class="text-subtitle2 q-mt-md">Zustände</div>
    <div class="q-gutter-xs q-mt-xs">
      <q-chip
        v-for="entry in states"
        :key="entry.id"
        clickable
        dense
        :color="state.activeStates.includes(entry.id) ? 'primary' : 'grey-4'"
        :text-color="state.activeStates.includes(entry.id) ? 'white' : 'black'"
        :icon="entry.icon"
        :label="entry.name"
        @click="toggleState(entry.id)"
      >
        <q-tooltip class="text-body2">{{ entry.rule }}</q-tooltip>
      </q-chip>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DiceRoll from "@/components/DiceRoll.vue";
import LoadBar from "@/components/LoadBar.vue";
import type { RollButton } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";
import { useUiStore } from "@/stores/ui";

const catalog = useCatalogStore();
const character = useCharacterStore();
const ui = useUiStore();

const state = computed(() => character.state);
const derived = computed(() => character.derived);

const attributeNames = computed(
  () =>
    catalog.ruleset?.attributes ?? Object.keys(state.value?.attributes ?? {})
);

const rollById = computed(() => {
  const map: Record<string, RollButton | undefined> = {};
  for (const roll of character.rolls) map[roll.id] = roll;
  return map;
});

const states = computed(() => catalog.ruleset?.states ?? []);

const resources = computed(() => [
  {
    field: "willpower",
    label: "Willenskraft",
    value: state.value?.willpower ?? 0
  },
  { field: "xp", label: "Erfahrung", value: state.value?.xp ?? 0 },
  { field: "reputation", label: "Ruf", value: state.value?.reputation ?? 0 }
]);

const moneyFields = [
  { field: "gold", label: "Gold" },
  { field: "silver", label: "Silber" },
  { field: "copper", label: "Kupfer" }
] as const;

// Wie die App: Klick auf einen Stern setzt den Schaden.
const setHealth = (attribute: string, star: number) => {
  const health = state.value?.attributes[attribute]?.health ?? 0;
  character.sendAction("attribute.setHealth", {
    attribute,
    health: star > health ? star : star - 1
  });
};

const changeValue = (attribute: string, delta: number) => {
  const value = state.value?.attributes[attribute]?.value ?? 0;
  character.sendAction("attribute.setValue", {
    attribute,
    value: value + delta
  });
};

const resource = (field: string, delta: number) =>
  character.sendAction("resource", { field, delta });
const setMoney = (field: string, value: number) =>
  character.sendAction("money.set", { field, value });
const toggleState = (id: string) =>
  character.sendAction("state.toggle", { id });
</script>
