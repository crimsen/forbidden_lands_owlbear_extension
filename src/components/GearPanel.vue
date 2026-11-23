<template>
  <div v-if="state" class="q-pa-sm">
    <LoadBar />

    <div class="row items-center no-wrap">
      <div class="col text-subtitle2">Waffen</div>
      <q-btn
        dense
        flat
        icon="mdi-plus"
        label="Waffe hinzufügen"
        @click="openWeapon()"
      />
    </div>
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
        icon="mdi-pencil"
        @click="openWeapon(entry)"
      >
        <q-tooltip>Bearbeiten</q-tooltip>
      </q-btn>
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

    <div class="row items-center no-wrap q-mt-md">
      <div class="col text-subtitle2">Rüstung</div>
      <DiceRoll v-if="armorRoll" :roll="armorRoll" />
    </div>
    <div v-for="part in parts" :key="part" class="q-mb-sm">
      <div class="row items-center no-wrap">
        <div class="col text-caption text-grey-6">{{ partLabel(part) }}</div>
        <q-btn
          dense
          flat
          icon="mdi-plus"
          :label="`${partLabel(part)} wählen`"
          @click="openArmor(part)"
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
          icon="mdi-pencil"
          @click="openArmor(part, armorForPart(part)!)"
        >
          <q-tooltip>Bearbeiten</q-tooltip>
        </q-btn>
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

    <div class="row items-center no-wrap q-mt-md">
      <div class="col text-subtitle2">Inventar</div>
      <q-btn
        dense
        flat
        icon="mdi-plus"
        label="Gegenstand hinzufügen"
        @click="openItem()"
      />
    </div>
    <div
      v-for="row in inventory"
      :key="row.id"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col">
        <div class="text-body2">{{ row.name }}</div>
        <div class="text-caption text-grey-6">{{ row.type }}</div>
      </div>
      <q-select
        class="col-auto"
        style="min-width: 110px"
        dense
        borderless
        :model-value="row.carrier"
        :options="carriers"
        emit-value
        map-options
        @update:model-value="value => setCarrier(row.id, value)"
      />
      <q-btn
        v-if="row.item"
        dense
        flat
        round
        size="sm"
        icon="mdi-pencil"
        @click="openItem({ id: row.id, data: row.item! })"
      >
        <q-tooltip>Bearbeiten</q-tooltip>
      </q-btn>
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

    <WeaponDialog
      v-model="weaponDialog"
      :weapon="weaponDraft"
      :is-new="weaponId === null"
      @save="saveWeapon"
    />
    <ArmorDialog
      v-model="armorDialog"
      :part="armorPart"
      :item="armorDraft"
      :is-new="armorIsNew"
      @save="saveArmor"
    />
    <ItemDialog
      v-model="itemDialog"
      :item="itemDraft"
      :is-new="itemId === null"
      :carriers="carriers"
      @save="saveItem"
    />
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import ArmorDialog from "@/components/ArmorDialog.vue";
import DiceRoll from "@/components/DiceRoll.vue";
import ItemDialog from "@/components/ItemDialog.vue";
import LoadBar from "@/components/LoadBar.vue";
import WeaponDialog from "@/components/WeaponDialog.vue";
import { blankArmor, blankItem, blankWeapon } from "@/model/blank";
import type {
  ArmorItem,
  ArmorPart,
  GearEntry,
  GearItem,
  RollButton,
  Weapon
} from "@/model/types";
import { useCharacterStore } from "@/stores/character";

const character = useCharacterStore();

const state = computed(() => character.state);

const parts = ["Kopf", "Körper", "Schild"] as const;

const partLabel = (part: ArmorPart) =>
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

const armorForPart = (part: ArmorPart) =>
  state.value?.characterGear.armor.find(
    entry => entry.equipped && entry.data.part === part
  ) ?? null;

interface InventoryRow {
  id: string;
  name: string;
  type: string;
  equipped: boolean;
  canEquip: boolean;
  carrier: string;
  item?: GearItem;
}

const carriers = computed(() => [
  { label: "Charakter", value: "character" },
  ...(state.value?.mounts ?? []).map(mount => ({
    label: mount.name || mount.animalName || "Reittier",
    value: mount.id
  }))
]);

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
      canEquip: true,
      carrier: "character"
    });
  }
  for (const entry of gear.armor) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      type: entry.data.part === "Schild" ? "Schild" : "Rüstung",
      equipped: entry.equipped,
      canEquip: true,
      carrier: "character"
    });
  }
  for (const entry of gear.items) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      type: "Ausrüstung",
      equipped: entry.equipped,
      canEquip: false,
      carrier: "character",
      item: entry.data
    });
  }
  for (const entry of gear.consumables) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      type: "Verbrauchsgut",
      equipped: entry.equipped,
      canEquip: false,
      carrier: "character"
    });
  }
  return rows;
});

const setEquipped = (id: string, equipped: boolean) =>
  character.sendAction("gear.setEquipped", { id, equipped });
const remove = (id: string) => character.sendAction("gear.remove", { id });
const clearArmor = (part: ArmorPart) =>
  character.sendAction("gear.clearArmor", { part });
const setCarrier = (id: string, carrier: string) =>
  character.sendAction("gear.setCarrier", { id, carrier });
const useConsumable = (id: string) =>
  character.sendAction("consumable.use", { id });
const addUnit = (id: string) =>
  character.sendAction("consumable.addUnit", { id });

// --- Dialoge -------------------------------------------------------------

const weaponDialog = ref(false);
const weaponDraft = ref<Weapon>(blankWeapon());
const weaponId = ref<string | null>(null);

const openWeapon = (entry?: GearEntry<Weapon>) => {
  weaponId.value = entry?.id ?? null;
  weaponDraft.value = entry ? { ...entry.data } : blankWeapon();
  weaponDialog.value = true;
};

const saveWeapon = (weapon: Weapon) => {
  if (weaponId.value) {
    character.sendAction("weapon.update", { id: weaponId.value, weapon });
  } else {
    character.sendAction("weapon.add", { weapon });
  }
  weaponDialog.value = false;
};

const armorDialog = ref(false);
const armorDraft = ref<ArmorItem>(blankArmor("Körper"));
const armorPart = ref<ArmorPart>("Körper");
const armorIsNew = ref(true);

const openArmor = (part: ArmorPart, entry?: GearEntry<ArmorItem>) => {
  armorPart.value = part;
  armorIsNew.value = !entry;
  armorDraft.value = entry ? { ...entry.data } : blankArmor(part);
  armorDialog.value = true;
};

const saveArmor = (item: ArmorItem) => {
  character.sendAction("armor.set", { armor: item });
  armorDialog.value = false;
};

const itemDialog = ref(false);
const itemDraft = ref<GearItem>(blankItem());
const itemId = ref<string | null>(null);

const openItem = (entry?: { id: string; data: GearItem }) => {
  itemId.value = entry?.id ?? null;
  itemDraft.value = entry ? { ...entry.data } : blankItem();
  itemDialog.value = true;
};

const saveItem = (item: GearItem, carrier: string) => {
  if (itemId.value) {
    character.sendAction("item.update", { id: itemId.value, item });
  } else {
    character.sendAction("item.add", { item, carrier });
  }
  itemDialog.value = false;
};
</script>
