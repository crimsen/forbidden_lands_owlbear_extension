<template>
  <q-dialog v-model="open">
    <q-card style="min-width: 320px; max-width: 94vw">
      <q-card-section class="text-subtitle1">
        {{ isNew ? "Neuer Gegenstand" : "Gegenstand bearbeiten" }}
      </q-card-section>
      <q-card-section class="q-gutter-y-sm">
        <q-select
          v-if="isNew"
          v-model="carrier"
          :options="carriers"
          label="Träger"
          emit-value
          map-options
          dense
          outlined
        />
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
          v-model.number="draft.quantity"
          type="number"
          min="1"
          label="Menge"
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
          v-model="draft.description"
          type="textarea"
          autogrow
          label="Beschreibung"
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
import type { GearItem } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";

export interface CarrierOption {
  label: string;
  value: string;
}

const props = defineProps<{
  item: GearItem;
  isNew: boolean;
  carriers: CarrierOption[];
}>();
const emit = defineEmits<{ save: [GearItem, string] }>();

const open = defineModel<boolean>({ required: true });

const catalog = useCatalogStore();

const templateOptions = computed(() =>
  (catalog.ruleset?.items ?? []).map(item => item.name)
);

const draft = reactive<GearItem>({ ...props.item });
const templateName = ref<string>();
const carrier = ref<string>(props.carriers[0]?.value ?? "character");

watch(
  () => props.item,
  item => {
    Object.assign(draft, item);
    templateName.value = undefined;
    carrier.value = props.carriers[0]?.value ?? "character";
  }
);

const applyTemplate = (name?: string | null) => {
  const template = (catalog.ruleset?.items ?? []).find(
    item => item.name === name
  );
  if (template) Object.assign(draft, template);
};

const save = () => {
  emit("save", { ...draft }, carrier.value);
  open.value = false;
};
</script>
