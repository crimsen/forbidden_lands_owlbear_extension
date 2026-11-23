<template>
  <div v-if="state && derived" class="q-pa-sm">
    <div v-if="state.mounts.length === 0" class="text-caption text-grey-6">
      Keine Reittiere.
    </div>
    <q-card
      v-for="mount in state.mounts"
      :key="mount.id"
      flat
      bordered
      class="q-mb-sm"
    >
      <q-card-section class="q-py-sm">
        <div class="row items-center no-wrap">
          <q-input
            class="col"
            dense
            outlined
            label="Name"
            :model-value="mount.name"
            @change="(value: string) => rename(mount.id, value)"
          />
          <q-btn
            dense
            flat
            round
            size="sm"
            icon="mdi-delete"
            color="negative"
            @click="remove(mount.id)"
          />
        </div>
        <div class="text-caption text-grey-6 q-mt-xs">
          {{ mount.animalName }} · Stärke {{ mount.strength.value }} · Geschick
          {{ mount.agility.value }} · Bewegung {{ mount.movement }}
        </div>
        <div class="row q-col-gutter-sm q-mt-xs">
          <div class="col text-caption">Angriff: {{ mount.attack || "–" }}</div>
          <div class="col text-caption">Schaden: {{ mount.damage || "–" }}</div>
        </div>

        <div class="row items-center q-mt-sm">
          <div class="col text-caption text-grey-6">Traglast</div>
          <div
            class="col-auto text-caption"
            :class="
              overloaded(mount.id) ? 'text-negative text-weight-bold' : ''
            "
          >
            {{ loadOf(mount.id).load }} / {{ loadOf(mount.id).capacity }}
          </div>
        </div>
        <q-linear-progress
          :value="ratio(mount.id)"
          :color="overloaded(mount.id) ? 'negative' : 'primary'"
          track-color="grey-4"
          size="8px"
          rounded
          class="q-mt-xs"
        />

        <div class="text-caption text-grey-6 q-mt-sm">Geladen</div>
        <div v-if="!gearRows(mount).length" class="text-caption text-grey-6">
          Nichts beladen.
        </div>
        <div
          v-for="row in gearRows(mount)"
          :key="row.id"
          class="row items-center no-wrap q-py-xs"
        >
          <div class="col">
            <div class="text-body2">{{ row.name }}</div>
            <div class="text-caption text-grey-6">
              Gewicht {{ row.weight }}
              <span v-if="row.detail"> · {{ row.detail }}</span>
            </div>
          </div>
          <q-select
            class="col-auto"
            style="min-width: 110px"
            dense
            borderless
            :model-value="mount.id"
            :options="carriers"
            emit-value
            map-options
            @update:model-value="value => setCarrier(row.id, value)"
          />
          <q-btn
            dense
            flat
            round
            size="sm"
            icon="mdi-delete"
            color="negative"
            @click="removeGear(row.id, mount.id)"
          />
        </div>
      </q-card-section>
    </q-card>

    <q-select
      :model-value="null"
      :options="animalOptions"
      dense
      outlined
      emit-value
      map-options
      label="Reittier hinzufügen"
      @update:model-value="addMount"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { MountState } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

const catalog = useCatalogStore();
const character = useCharacterStore();

const state = computed(() => character.state);
const derived = computed(() => character.derived);

const loadOf = (id: string) =>
  derived.value?.mountLoads.find(entry => entry.id === id) ?? {
    id,
    load: 0,
    capacity: 0
  };

const overloaded = (id: string) => {
  const load = loadOf(id);
  return load.load > load.capacity;
};

const ratio = (id: string) => {
  const load = loadOf(id);
  return load.capacity > 0 ? Math.min(1, load.load / load.capacity) : 1;
};

const carriers = computed(() => [
  { label: "Charakter", value: "character" },
  ...(state.value?.mounts ?? []).map(mount => ({
    label: mount.name || mount.animalName || "Reittier",
    value: mount.id
  }))
]);

interface GearRow {
  id: string;
  name: string;
  weight: string;
  detail: string;
}

const gearRows = (mount: MountState): GearRow[] => {
  const rows: GearRow[] = [];
  for (const entry of mount.gear.weapons) {
    if (entry.data.name === "Unbewaffnet") continue;
    rows.push({
      id: entry.id,
      name: entry.data.name,
      weight: entry.data.weight,
      detail: entry.data.notes
    });
  }
  for (const entry of mount.gear.armor) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      weight: entry.data.weight,
      detail: entry.data.notes
    });
  }
  for (const entry of mount.gear.items) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      weight: entry.data.weight,
      detail: entry.data.description
    });
  }
  for (const entry of mount.gear.consumables) {
    rows.push({
      id: entry.id,
      name: entry.data.name,
      weight: "–",
      detail:
        entry.data.die !== null ? `Würfel ${entry.data.die}` : "aufgebraucht"
    });
  }
  return rows;
};

const animalOptions = computed(() =>
  (catalog.ruleset?.animals ?? [])
    .filter(animal => animal.rideable)
    .map(animal => ({ label: animal.name, value: animal.name }))
);

const addMount = (animalName: string) => {
  if (animalName) character.sendAction("mount.add", { animalName });
};
const remove = (id: string) => character.sendAction("mount.remove", { id });
const rename = (id: string, name: string) =>
  character.sendAction("mount.rename", { id, name });
const setCarrier = (id: string, carrier: string) =>
  character.sendAction("gear.setCarrier", { id, carrier });
const removeGear = (id: string, carrier: string) =>
  character.sendAction("gear.remove", { id, carrier });
</script>
