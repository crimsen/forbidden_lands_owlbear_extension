<template>
  <div v-if="state" class="q-pa-sm">
    <LoadBar />

    <div class="text-subtitle2">Waffen</div>
    <div
      v-for="entry in equippedWeapons"
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
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-star"
        @click="setEquipped(entry.id, false)"
      >
        <q-tooltip>Ablegen</q-tooltip>
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
    <div v-if="!equippedWeapons.length" class="text-caption text-grey-6">
      Keine Waffe ausgerüstet.
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

    <div class="row items-center no-wrap q-mt-md">
      <div class="col text-subtitle2">Rüstung</div>
      <DiceRoll v-if="armorRoll" :roll="armorRoll" />
    </div>
    <div v-for="part in parts" :key="part" class="q-mb-sm">
      <div class="row items-center no-wrap">
        <div class="col text-caption text-grey-6">{{ partLabel(part) }}</div>
        <q-select
          class="col-auto"
          style="min-width: 160px"
          :model-value="null"
          :options="armorOptionsFor(part)"
          dense
          outlined
          emit-value
          map-options
          options-dense
          :label="`${partLabel(part)} wählen`"
          @update:model-value="name => equipArmor(part, name)"
        />
      </div>
      <div v-if="armorForPart(part)" class="row items-center no-wrap">
        <div class="col text-body2">
          {{ armorForPart(part)?.data.name }} ({{
            armorForPart(part)?.data.rating
          }})
        </div>
        <q-btn
          dense
          flat
          round
          size="sm"
          icon="mdi-arrow-down"
          @click="setEquipped(armorForPart(part)!.id, false)"
        >
          <q-tooltip>Ablegen (bleibt im Inventar)</q-tooltip>
        </q-btn>
        <q-btn
          dense
          flat
          round
          size="sm"
          icon="mdi-delete"
          color="negative"
          @click="clearArmor(part)"
        />
      </div>
    </div>

    <div class="text-subtitle2 q-mt-md">Inventar</div>
    <div
      v-for="row in inventory"
      :key="row.id"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col">
        <div class="text-body2">{{ row.name }}</div>
        <div class="text-caption text-grey-6">{{ row.type }}</div>
      </div>
      <q-btn
        v-if="row.canEquip"
        dense
        flat
        round
        size="sm"
        :icon="row.equipped ? 'mdi-star' : 'mdi-star-outline'"
        @click="setEquipped(row.id, !row.equipped)"
      >
        <q-tooltip>{{ row.equipped ? "Ablegen" : "Ausrüsten" }}</q-tooltip>
      </q-btn>
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-delete"
        color="negative"
        @click="remove(row.id)"
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
import LoadBar from "@/components/LoadBar.vue";
import type { RollButton } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

const catalog = useCatalogStore();
const character = useCharacterStore();

const state = computed(() => character.state);

const parts = ["Kopf", "Körper", "Schild"] as const;
type Part = (typeof parts)[number];

const partLabel = (part: Part) =>
  part === "Schild" ? "Schild" : `Rüstung ${part}`;

const rollById = computed(() => {
  const map: Record<string, RollButton | undefined> = {};
  for (const roll of character.rolls) map[roll.id] = roll;
  return map;
});

const armorRoll = computed(() =>
  character.rolls.find(roll => roll.group === "armor")
);

const equippedWeapons = computed(
  () => state.value?.characterGear.weapons.filter(entry => entry.equipped) ?? []
);

const armorForPart = (part: Part) =>
  state.value?.characterGear.armor.find(
    entry => entry.equipped && entry.data.part === part
  ) ?? null;

const weaponOptions = computed(() =>
  (catalog.ruleset?.weapons ?? []).map(weapon => ({
    label: weapon.name,
    value: weapon.name
  }))
);
const itemOptions = computed(() =>
  (catalog.ruleset?.items ?? []).map(item => ({
    label: item.name,
    value: item.name
  }))
);
const armorOptionsFor = (part: Part) =>
  (catalog.ruleset?.armor ?? [])
    .filter(armor => armor.part === part)
    .map(armor => ({ label: armor.name, value: armor.name }));

interface InventoryRow {
  id: string;
  name: string;
  type: string;
  equipped: boolean;
  canEquip: boolean;
}

const inventory = computed<InventoryRow[]>(() => {
  const gear = state.value?.characterGear;
  if (!gear) return [];
  const rows: InventoryRow[] = [];
  for (const entry of gear.weapons) {
    if (entry.data.name === "Unbewaffnet") continue;
    rows.push({
      id: entry.id,
      name: entry.data.name,
      type: "Waffe",
      equipped: entry.equipped,
      canEquip: true
    });
  }
  for (const entry of gear.armor) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      type: entry.data.part === "Schild" ? "Schild" : "Rüstung",
      equipped: entry.equipped,
      canEquip: true
    });
  }
  for (const entry of gear.items) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      type: "Ausrüstung",
      equipped: entry.equipped,
      canEquip: false
    });
  }
  for (const entry of gear.consumables) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      type: "Verbrauchsgut",
      equipped: entry.equipped,
      canEquip: false
    });
  }
  return rows;
});

const setEquipped = (id: string, equipped: boolean) =>
  character.sendAction("gear.setEquipped", { id, equipped });
const remove = (id: string) => character.sendAction("gear.remove", { id });
const clearArmor = (part: Part) =>
  character.sendAction("gear.clearArmor", { part });
const useConsumable = (id: string) =>
  character.sendAction("consumable.use", { id });
const addUnit = (id: string) =>
  character.sendAction("consumable.addUnit", { id });

const equipArmor = (part: Part, name: string) => {
  const armor = (catalog.ruleset?.armor ?? []).find(
    row => row.name === name && row.part === part
  );
  if (armor) character.sendAction("armor.set", { armor });
};
const addWeapon = (name: string) => {
  const weapon = (catalog.ruleset?.weapons ?? []).find(
    row => row.name === name
  );
  if (weapon) character.sendAction("weapon.add", { weapon });
};
const addItem = (name: string) => {
  const item = (catalog.ruleset?.items ?? []).find(row => row.name === name);
  if (item) character.sendAction("item.add", { item });
};
</script>
