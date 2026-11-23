<template>
  <q-dialog v-model="open">
    <q-card style="min-width: 320px; max-width: 94vw">
      <q-card-section class="text-subtitle1">
        {{ isNew ? "Neue Waffe" : "Waffe bearbeiten" }}
      </q-card-section>
      <q-card-section class="q-gutter-y-sm">
        <q-select
          v-if="isNew"
          v-model="templateName"
          :options="templateOptions"
          label="Vorlage wählen"
          dense
          outlined
          clearable
          @update:model-value="applyTemplate"
        />
        <q-input v-model="draft.name" label="Name" dense outlined />
        <q-input
          v-model="draft.bonus"
          label="Bonus (+1, +2, –)"
          dense
          outlined
        />
        <q-input
          v-model.number="draft.damage"
          type="number"
          min="0"
          label="Schaden"
          dense
          outlined
        />
        <q-input v-model="draft.range" label="Reichweite" dense outlined />
        <q-input v-model="draft.grip" label="Griff (1H / 2H)" dense outlined />
        <q-input
          v-model="draft.properties"
          label="Eigenschaften"
          dense
          outlined
        />
        <q-select
          v-model="draft.weight"
          :options="WEIGHTS"
          label="Gewicht"
          dense
          outlined
        />
        <q-input
          v-model="draft.notes"
          type="textarea"
          autogrow
          label="Anmerkungen"
          dense
          outlined
        />
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Abbrechen" v-close-popup />
        <q-btn color="primary" label="Speichern" @click="save" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, reactive, ref, watch } from "vue";
import { WEIGHTS } from "@/model/blank";
import type { Weapon } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";

const props = defineProps<{ weapon: Weapon; isNew: boolean }>();
const emit = defineEmits<{ save: [Weapon] }>();

const open = defineModel<boolean>({ required: true });

const catalog = useCatalogStore();

const templateOptions = computed(() =>
  (catalog.ruleset?.weapons ?? []).map(weapon => weapon.name)
);

const draft = reactive<Weapon>({ ...props.weapon });
const templateName = ref<string>();

watch(
  () => props.weapon,
  weapon => {
    Object.assign(draft, weapon);
    templateName.value = undefined;
  }
);

const applyTemplate = (name?: string | null) => {
  const template = (catalog.ruleset?.weapons ?? []).find(
    weapon => weapon.name === name
  );
  if (template) Object.assign(draft, template);
};

const save = () => {
  emit("save", { ...draft });
  open.value = false;
};
</script>
