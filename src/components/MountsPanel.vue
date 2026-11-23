<template>
  <div v-if="state" class="q-pa-sm">
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
          <div class="col text-caption">Angriff: {{ mount.attack }}</div>
          <div class="col text-caption">Schaden: {{ mount.damage }}</div>
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
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

const catalog = useCatalogStore();
const character = useCharacterStore();

const state = computed(() => character.state);

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
</script>
