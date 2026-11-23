<template>
  <div v-if="state" class="q-pa-sm">
    <div
      v-for="skill in state.skills"
      :key="skill.name"
      class="row items-center no-wrap q-py-xs"
    >
      <div class="col">
        <div class="text-body2">{{ skill.name }}</div>
        <div class="text-caption text-grey-6">
          {{ skill.attribute }} · Wert {{ skill.value
          }}<span v-if="skill.draft !== skill.value"> → {{ skill.draft }}</span>
        </div>
      </div>
      <DiceRoll
        v-if="rollById[`skill:${skill.name}`]"
        :roll="rollById[`skill:${skill.name}`]!"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-minus"
        :disable="skill.draft <= skill.value"
        @click="draft(skill.name, skill.draft - 1)"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-plus"
        @click="draft(skill.name, skill.draft + 1)"
      />
      <q-btn
        dense
        flat
        round
        size="sm"
        icon="mdi-check"
        color="primary"
        :disable="skill.draft === skill.value"
        @click="confirm(skill.name)"
      >
        <q-tooltip>Steigerung mit EP bestätigen</q-tooltip>
      </q-btn>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import DiceRoll from "@/components/DiceRoll.vue";
import type { RollButton } from "@/model/types";
import { useCharacterStore } from "@/stores/character";

const character = useCharacterStore();
const state = computed(() => character.state);

const rollById = computed(() => {
  const map: Record<string, RollButton | undefined> = {};
  for (const roll of character.rolls) map[roll.id] = roll;
  return map;
});

const draft = (name: string, value: number) =>
  character.sendAction("skill.draft", { name, value });
const confirm = (name: string) =>
  character.sendAction("skill.confirm", { name });
</script>
