<template>
  <q-page class="column no-wrap">
    <div class="q-pa-sm bg-primary text-white">
      <div class="row items-center no-wrap">
        <div class="col">
          <div class="text-subtitle2">Verbotene Lande</div>
          <div class="text-caption">
            {{ character.state?.name || "Kein Charakter geöffnet" }}
          </div>
        </div>
        <DiceRoll v-if="eventRoll" :roll="eventRoll" />
      </div>
      <div class="row items-center q-gutter-xs q-mt-xs">
        <q-chip
          dense
          square
          :color="bridge.connected ? 'positive' : 'grey-8'"
          text-color="white"
          :icon="bridge.connected ? 'mdi-lan-connect' : 'mdi-lan-disconnect'"
          :label="bridge.connected ? 'App verbunden' : 'App getrennt'"
        />
        <q-chip
          dense
          square
          :color="bridge.dicePlusReady ? 'positive' : 'orange-9'"
          text-color="white"
          icon="mdi-dice-multiple"
          :label="bridge.dicePlusReady ? 'Dice+' : 'Dice+ fehlt'"
        />
        <q-space />
        <q-select
          v-model="bridge.rollTarget"
          dense
          dark
          borderless
          emit-value
          map-options
          :options="rollTargets"
          style="min-width: 120px"
        />
      </div>
    </div>

    <q-banner v-if="!bridge.connected" dense class="bg-grey-3 text-body2">
      <template #avatar>
        <q-icon name="mdi-link-variant" />
      </template>
      Kopplungscode aus den App-Einstellungen eingeben:
      <div class="row items-center q-mt-xs">
        <q-input
          v-model="pairingInput"
          class="col"
          dense
          outlined
          placeholder="Kopplungscode"
          @keyup.enter="pair"
        />
        <q-btn
          class="q-ml-sm"
          dense
          color="primary"
          label="Verbinden"
          @click="pair"
        />
      </div>
    </q-banner>

    <q-tabs
      v-model="tab"
      dense
      align="justify"
      class="bg-grey-2 text-grey-8"
      active-color="primary"
      indicator-color="primary"
    >
      <q-tab name="values" label="Werte" />
      <q-tab name="skills" label="Fertigkeiten" />
      <q-tab name="talents" label="Talente" />
      <q-tab name="gear" label="Ausrüstung" />
      <q-tab name="more" label="Mehr" />
    </q-tabs>

    <q-separator />

    <q-tab-panels
      v-model="tab"
      class="col"
      style="flex: 1; overflow: auto"
      animated
    >
      <q-tab-panel name="values" class="q-pa-none">
        <ValuesPanel />
      </q-tab-panel>
      <q-tab-panel name="skills" class="q-pa-none">
        <SkillsPanel />
      </q-tab-panel>
      <q-tab-panel name="talents" class="q-pa-none">
        <TalentsPanel />
      </q-tab-panel>
      <q-tab-panel name="gear" class="q-pa-none">
        <GearPanel />
      </q-tab-panel>
      <q-tab-panel name="more" class="q-pa-none">
        <MountsPanel />
        <NotesPanel />
      </q-tab-panel>
    </q-tab-panels>

    <RollDialog />
  </q-page>
</template>

<script setup lang="ts">
import { computed, ref } from "vue";
import DiceRoll from "@/components/DiceRoll.vue";
import GearPanel from "@/components/GearPanel.vue";
import MountsPanel from "@/components/MountsPanel.vue";
import NotesPanel from "@/components/NotesPanel.vue";
import RollDialog from "@/components/RollDialog.vue";
import SkillsPanel from "@/components/SkillsPanel.vue";
import TalentsPanel from "@/components/TalentsPanel.vue";
import ValuesPanel from "@/components/ValuesPanel.vue";
import { useBridgeStore } from "@/stores/bridge";
import { useCharacterStore } from "@/stores/character";

const bridge = useBridgeStore();
const character = useCharacterStore();

const tab = ref("values");
const pairingInput = ref(bridge.pairingCode);

const rollTargets = [
  { label: "Alle", value: "everyone" },
  { label: "Nur ich", value: "self" },
  { label: "GM und ich", value: "dm" },
  { label: "Nur GM", value: "gm_only" }
];

const eventRoll = computed(() =>
  character.rolls.find(roll => roll.group === "event")
);

const pair = () => bridge.setPairingCode(pairingInput.value);
</script>
