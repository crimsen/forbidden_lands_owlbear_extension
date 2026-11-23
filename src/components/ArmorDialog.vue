<template>
  <q-dialog v-model="open">
    <q-card style="min-width: 320px; max-width: 94vw">
      <q-card-section class="text-subtitle1">
        {{ isNew ? `${label} wählen` : `${label} bearbeiten` }}
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
          v-model.number="draft.rating"
          type="number"
          min="0"
          :label="ratingLabel"
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
          v-model="draft.properties"
          label="Eigenschaften"
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
import type { ArmorItem, ArmorPart } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";

const props = defineProps<{
  part: ArmorPart;
  item: ArmorItem;
  isNew: boolean;
}>();
const emit = defineEmits<{ save: [ArmorItem] }>();

const open = defineModel<boolean>({ required: true });

const catalog = useCatalogStore();

const label = computed(() =>
  props.part === "Schild" ? "Schild" : `Rüstung ${props.part}`
);
const ratingLabel = computed(() =>
  props.part === "Schild" ? "Bonus" : "Rüstungsschutz"
);
const templateOptions = computed(() =>
  (catalog.ruleset?.armor ?? [])
    .filter(item => item.part === props.part)
    .map(item => item.name)
);

const draft = reactive<ArmorItem>({ ...props.item });
const templateName = ref<string>();

watch(
  () => props.item,
  item => {
    Object.assign(draft, item);
    templateName.value = undefined;
  }
);

const applyTemplate = (name?: string | null) => {
  const template = (catalog.ruleset?.armor ?? []).find(
    item => item.name === name
  );
  if (template) Object.assign(draft, template);
};

const save = () => {
  emit("save", { ...draft, part: props.part });
  open.value = false;
};
</script>
