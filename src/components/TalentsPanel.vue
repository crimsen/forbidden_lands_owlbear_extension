<template>
  <div v-if="state && derived" class="q-pa-sm">
    <q-expansion-item v-if="kinTalent" dense class="q-mb-xs">
      <template #header>
        <q-item-section>
          <div class="row items-center no-wrap full-width">
            <div class="col text-body2">{{ kinTalent.name }}</div>
            <div class="col-auto text-caption text-grey-6">Volkstalent</div>
          </div>
        </q-item-section>
      </template>
      <q-card flat>
        <q-card-section class="q-py-xs">
          <div
            v-for="level in kinTalent.levels"
            :key="level.level"
            class="text-body2"
          >
            <span class="text-weight-medium">Stufe {{ level.level }}:</span>
            {{ level.effect }}
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-expansion-item
      v-for="row in state.talents"
      :key="row.name"
      dense
      class="q-mb-xs"
    >
      <template #header>
        <q-item-section>
          <div class="row items-center no-wrap full-width">
            <div class="col text-body2">{{ row.name }}</div>
            <div
              class="col-auto q-mr-sm"
              :class="
                row.draft !== row.level ? 'text-primary text-weight-bold' : ''
              "
            >
              Stufe {{ row.draft }}
            </div>
            <q-btn
              dense
              flat
              round
              size="sm"
              icon="mdi-minus"
              :disable="row.draft <= row.level"
              @click.stop="draft(row.name, row.draft - 1)"
            />
            <q-btn
              dense
              flat
              round
              size="sm"
              icon="mdi-plus"
              @click.stop="draft(row.name, row.draft + 1)"
            />
            <q-btn
              v-if="row.draft !== row.level"
              dense
              flat
              round
              size="sm"
              icon="mdi-check"
              color="primary"
              @click.stop="confirm(row.name)"
            >
              <q-tooltip>Steigerung mit EP bestätigen</q-tooltip>
            </q-btn>
            <q-btn
              dense
              flat
              round
              size="sm"
              icon="mdi-delete"
              color="negative"
              @click.stop="remove(row.name)"
            />
          </div>
        </q-item-section>
      </template>
      <q-card flat>
        <q-card-section class="q-py-xs">
          <div
            v-for="level in levelsOf(row.name)"
            :key="level.level"
            class="text-body2"
            :class="level.level > row.level ? 'text-grey-5' : ''"
          >
            <span class="text-weight-medium">Stufe {{ level.level }}:</span>
            {{ level.effect }}
            <span v-if="level.level > row.level" class="text-italic">
              (noch nicht erlernt)
            </span>
          </div>
        </q-card-section>
      </q-card>
    </q-expansion-item>

    <q-select
      class="q-mt-sm"
      :model-value="null"
      :options="learnable"
      dense
      outlined
      emit-value
      map-options
      label="Talent lernen"
      @update:model-value="learn"
    />

    <template v-if="derived.castableSpells.length > 0">
      <div class="text-subtitle2 q-mt-md">Zauber</div>
      <template
        v-for="discipline in derived.spellDisciplines"
        :key="discipline"
      >
        <template v-if="spellsOf(discipline).length">
          <div class="text-caption text-grey-6 q-mt-sm">{{ discipline }}</div>
          <q-expansion-item
            v-for="spell in spellsOf(discipline)"
            :key="spell.name"
            dense
            class="q-mb-xs"
          >
            <template #header>
              <q-item-section>
                <div class="row items-center no-wrap full-width">
                  <div class="col text-body2">{{ spell.name }}</div>
                  <div class="col-auto text-caption text-grey-6 q-mr-sm">
                    Rang {{ spell.rank }}
                  </div>
                  <q-btn
                    dense
                    flat
                    round
                    size="sm"
                    :icon="
                      inBook(spell.name) ? 'mdi-book-check' : 'mdi-book-plus'
                    "
                    :color="inBook(spell.name) ? 'primary' : ''"
                    @click.stop="toggleSpellbook(spell.name)"
                  >
                    <q-tooltip>
                      {{
                        inBook(spell.name)
                          ? "aus dem Zauberbuch entfernen"
                          : "ins Zauberbuch schreiben"
                      }}
                    </q-tooltip>
                  </q-btn>
                </div>
              </q-item-section>
            </template>
            <q-card flat>
              <q-card-section class="q-py-xs text-body2">
                <div class="text-caption text-grey-6 q-mb-xs">
                  {{ meta(spell) }}
                </div>
                <div style="white-space: pre-line">{{ spell.effect }}</div>
              </q-card-section>
            </q-card>
          </q-expansion-item>
        </template>
      </template>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import type { Spell } from "@/model/types";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

const catalog = useCatalogStore();
const character = useCharacterStore();

const state = computed(() => character.state);
const derived = computed(() => character.derived);

const kinTalent = computed(() =>
  (catalog.ruleset?.talents ?? []).find(
    talent => talent.name === derived.value?.kinTalent
  )
);

const levelsOf = (name: string) =>
  (catalog.ruleset?.talents ?? []).find(talent => talent.name === name)
    ?.levels ?? [];

const learnable = computed(() => {
  const known = new Set(
    (state.value?.talents ?? [])
      .filter(row => row.level > 0)
      .map(row => row.name)
  );
  return (derived.value?.learnableTalents ?? [])
    .filter(name => !known.has(name))
    .map(name => ({ label: name, value: name }));
});

const spellsOf = (discipline: string) =>
  (derived.value?.castableSpells ?? []).filter(
    spell => spell.discipline === discipline
  );

const inBook = (name: string) => (state.value?.spellbook ?? []).includes(name);

const toggleSpellbook = (name: string) => {
  character.sendAction(inBook(name) ? "spellbook.remove" : "spellbook.add", {
    name
  });
};

/** Kopfzeile des Zaubers: Reichweite, Dauer und (falls vorhanden) Komponente. */
const meta = (spell: Spell) => {
  const parts = [`Reichweite: ${spell.reach}`, `Dauer: ${spell.duration}`];
  if (spell.component) parts.push(`Komponente: ${spell.component}`);
  return parts.join(" · ");
};

const draft = (name: string, level: number) =>
  character.sendAction("talent.draft", { name, level });
const confirm = (name: string) =>
  character.sendAction("talent.confirm", { name });
const remove = (name: string) =>
  character.sendAction("talent.remove", { name });
const learn = (name: string) => {
  if (name) character.sendAction("talent.learn", { name });
};
</script>
