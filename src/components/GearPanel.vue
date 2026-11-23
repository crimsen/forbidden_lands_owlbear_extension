<template>
  <div v-if="state" class="q-pa-sm">
    <div class="text-subtitle2">Waffen</div>
    <div
      v-for="entry in state.characterGear.weapons"
      :key="entry.id"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col">
        <div class="text-body2">{{ entry.data.name }}</div>
        <div class="text-caption text-grey-6">
          {{ entry.data.bonus }} · Schaden {{ entry.data.damage }}
        </div>
      </div>
      <DiceRoll
        v-if="rollById[`weapon:${entry.id}`]"
        :roll="rollById[`weapon:${entry.id}`]!"
      />
      <q-toggle
        dense
        :model-value="entry.equipped"
        @update:model-value="value => equip(entry.id, value)"
      >
        <q-tooltip>Ausgerüstet</q-tooltip>
      </q-toggle>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-delete"
        color="negative"
        @click="remove(entry.id)"
      />
    </div>
    <q-select
      :model-value="null"
      :options="weaponOptions"
      dense
      outlined
      emit-value
      map-options
      label="Waffe hinzufügen"
      @update:model-value="addWeapon"
    />

    <div class="text-subtitle2 q-mt-md">Rüstung</div>
    <div
      v-for="entry in state.characterGear.armor"
      :key="entry.id"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col">
        <div class="text-body2">{{ entry.data.name }}</div>
        <div class="text-caption text-grey-6">
          {{ entry.data.part }} · Schutz {{ entry.data.rating }}
        </div>
      </div>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-minus"
        :disable="entry.data.rating <= 0"
        @click="degrade(entry.id)"
      >
        <q-tooltip>Abnutzung −1</q-tooltip>
      </q-btn>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-delete"
        color="negative"
        @click="remove(entry.id)"
      />
    </div>
    <q-select
      :model-value="null"
      :options="armorOptions"
      dense
      outlined
      emit-value
      map-options
      label="Rüstung anlegen"
      @update:model-value="addArmor"
    />

    <div class="text-subtitle2 q-mt-md">Gegenstände</div>
    <div
      v-for="entry in state.characterGear.items"
      :key="entry.id"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col text-body2">{{ entry.data.name }}</div>
      <div class="text-caption text-grey-6 q-mr-sm"
        >×{{ entry.data.quantity }}</div
      >
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-delete"
        color="negative"
        @click="remove(entry.id)"
      />
    </div>
    <q-select
      :model-value="null"
      :options="itemOptions"
      dense
      outlined
      emit-value
      map-options
      label="Gegenstand hinzufügen"
      @update:model-value="addItem"
    />

    <div class="text-subtitle2 q-mt-md">Verbrauchsgüter</div>
    <div
      v-for="entry in state.characterGear.consumables"
      :key="entry.id"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col text-body2">{{ entry.data.name }}</div>
      <div class="text-caption q-mr-sm">
        {{ entry.data.die ?? "aufgebraucht" }}
      </div>
      <DiceRoll
        v-if="rollById[`consumable:${entry.id}`]"
        :roll="rollById[`consumable:${entry.id}`]!"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-minus"
        :disable="entry.data.die === null"
        @click="useConsumable(entry.id)"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-plus"
        :disable="entry.data.die === 'W12'"
        @click="addUnit(entry.id)"
      />
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

const rollById = computed(() => {
  const map: Record<string, RollButton | undefined> = {};
  for (const roll of character.rolls) map[roll.id] = roll;
  return map;
});

const options = (names: string[]) =>
  names.map(name => ({ label: name, value: name }));

const weaponOptions = computed(() =>
  options((catalog.ruleset?.weapons ?? []).map(weapon => weapon.name))
);
const armorOptions = computed(() =>
  options((catalog.ruleset?.armor ?? []).map(armor => armor.name))
);
const itemOptions = computed(() =>
  options((catalog.ruleset?.items ?? []).map(item => item.name))
);

const equip = (id: string, equipped: boolean) =>
  character.sendAction("gear.setEquipped", { id, equipped });
const remove = (id: string) => character.sendAction("gear.remove", { id });
const degrade = (id: string) =>
  character.sendAction("gear.degradeArmor", { id, amount: 1 });
const useConsumable = (id: string) =>
  character.sendAction("consumable.use", { id });
const addUnit = (id: string) =>
  character.sendAction("consumable.addUnit", { id });

const addWeapon = (name: string) => {
  const weapon = (catalog.ruleset?.weapons ?? []).find(
    row => row.name === name
  );
  if (weapon) character.sendAction("weapon.add", { weapon });
};
const addArmor = (name: string) => {
  const armor = (catalog.ruleset?.armor ?? []).find(row => row.name === name);
  if (armor) character.sendAction("armor.set", { armor });
};
const addItem = (name: string) => {
  const item = (catalog.ruleset?.items ?? []).find(row => row.name === name);
  if (item) character.sendAction("item.add", { item });
};
</script>
