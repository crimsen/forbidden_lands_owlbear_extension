<template>
  <div v-if="state && derived" class="q-pa-sm">
    <div class="text-subtitle2">Attribute</div>
    <div
      v-for="(attr, name) in state.attributes"
      :key="name"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col">
        <div class="text-body2">{{ name }}</div>
        <div class="text-caption text-grey-6">
          Wert {{ attr.value }} · Schaden {{ attr.health }}
        </div>
      </div>
      <DiceRoll
        v-if="rollById[`attribute:${name}`]"
        :roll="rollById[`attribute:${name}`]!"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-minus"
        :disable="attr.health <= 0"
        @click="damage(name, -1)"
      >
        <q-tooltip>Heilen</q-tooltip>
      </q-btn>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-plus"
        :disable="attr.health >= attr.value"
        @click="damage(name, 1)"
      >
        <q-tooltip>Schaden</q-tooltip>
      </q-btn>
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

    <div class="text-caption text-grey-6 q-mt-md">
      Traglast {{ derived.currentLoad }} / {{ derived.capacity }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DiceRoll from "@/components/DiceRoll.vue";
import type { RollButton } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

const catalog = useCatalogStore();
const character = useCharacterStore();

const state = computed(() => character.state);
const derived = computed(() => character.derived);

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

const damage = (attribute: string, delta: number) =>
  character.sendAction("attribute.health", { attribute, delta });
const resource = (field: string, delta: number) =>
  character.sendAction("resource", { field, delta });
const setMoney = (field: string, value: number) =>
  character.sendAction("money.set", { field, value });
const toggleState = (id: string) =>
  character.sendAction("state.toggle", { id });
</script>
