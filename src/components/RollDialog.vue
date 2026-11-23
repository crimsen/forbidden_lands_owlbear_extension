<template>
  <q-dialog
    :model-value="dialog.open"
    @update:model-value="value => !value && close()"
  >
    <q-card style="min-width: 320px; max-width: 94vw">
      <q-card-section class="text-subtitle1">{{ title }}</q-card-section>

      <q-card-section v-if="check" class="q-pt-none q-gutter-y-xs">
        <div class="row items-center no-wrap">
          <div class="col">
            Attribut
            <span class="text-caption text-grey-6"
              >· {{ check.attribute }}</span
            >
          </div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="check.attributeDice <= 0"
            @click="check.attributeDice--"
          />
          <div class="text-body2 q-px-sm">{{ check.attributeDice }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="check.attributeDice++"
          />
        </div>

        <div v-if="check.skill" class="row items-center no-wrap">
          <div class="col">
            Fertigkeit
            <span class="text-caption text-grey-6">· {{ check.skill }}</span>
          </div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="(check.skillDice ?? 0) <= 0"
            @click="check.skillDice = (check.skillDice ?? 0) - 1"
          />
          <div class="text-body2 q-px-sm">{{ check.skillDice ?? 0 }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="check.skillDice = (check.skillDice ?? 0) + 1"
          />
        </div>

        <div v-if="check.weapon" class="row items-center no-wrap">
          <div class="col">
            Waffenwürfel
            <span class="text-caption text-grey-6">· {{ check.weapon }}</span>
          </div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="(check.weaponDice ?? 0) <= 0"
            @click="check.weaponDice = (check.weaponDice ?? 0) - 1"
          />
          <div class="text-body2 q-px-sm">{{ check.weaponDice ?? 0 }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="check.weaponDice = (check.weaponDice ?? 0) + 1"
          />
        </div>

        <div
          v-for="artifact in check.artifacts"
          :key="artifact.sides"
          class="row items-center no-wrap"
        >
          <div class="col">Artefakt W{{ artifact.sides }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="artifact.dice <= 0"
            @click="artifact.dice--"
          />
          <div class="text-body2 q-px-sm">{{ artifact.dice }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="artifact.dice++"
          />
        </div>
      </q-card-section>

      <q-card-section v-else-if="armor" class="q-pt-none q-gutter-y-xs">
        <div class="text-caption text-grey-6">Rüstungsteile</div>
        <q-checkbox
          v-for="entry in armorEntries"
          :key="entry.id"
          dense
          :model-value="armor.armorIds.includes(entry.id)"
          :label="`${entry.data.name} (${entry.data.rating})`"
          @update:model-value="value => toggleArmor(entry.id, value)"
        />
        <q-input
          v-model.number="damage"
          type="number"
          dense
          outlined
          label="Schaden"
          class="q-mt-sm"
        />
      </q-card-section>

      <q-card-section v-if="bridge.rollPending" class="text-center">
        <q-spinner color="primary" size="2em" />
        <div class="text-caption q-mt-xs">Die App wertet aus …</div>
      </q-card-section>

      <q-card-section
        v-else-if="bridge.rollError"
        class="text-caption text-negative"
      >
        {{ bridge.rollError }}
      </q-card-section>

      <q-card-section v-else-if="evaluation" class="q-pt-none">
        <template v-if="evaluation.kind === 'check'">
          <div class="text-h5 text-primary">
            {{ evaluation.successes }} Erfolge
          </div>
          <div class="text-caption text-grey-6">
            {{ evaluation.failures }} Einsen (Attributschaden beim Strapazieren)
          </div>
          <div class="text-caption q-mt-xs">
            {{
              evaluation.groups
                .map(
                  group =>
                    `${group.description ?? ""}: ${group.dice
                      .map(die => die.value)
                      .join(", ")}`
                )
                .join(" · ")
            }}
          </div>
        </template>

        <template v-else-if="evaluation.kind === 'armor'">
          <div class="text-h5 text-primary">
            {{ evaluation.absorbed }} absorbiert
          </div>
          <div class="text-caption text-grey-6">
            {{ evaluation.damage }} Schaden auf Stärke
          </div>
          <div v-if="evaluation.degraded.length" class="text-caption q-mt-xs">
            Abnutzung:
            {{
              evaluation.degraded
                .map(row => `${armorName(row.id)} −${row.amount}`)
                .join(", ")
            }}
          </div>
        </template>

        <template v-else-if="evaluation.kind === 'consumable'">
          <div class="text-h5 text-primary">
            {{ evaluation.dieBefore ?? "–" }} →
            {{ evaluation.dieAfter ?? "aufgebraucht" }}
          </div>
          <div class="text-caption text-grey-6"
            >Wurf: {{ evaluation.value }}</div
          >
        </template>

        <template v-else>
          <div class="text-h4 text-primary">{{ evaluation.value }}</div>
          <div class="text-caption text-grey-6">{{ evaluation.label }}</div>
        </template>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Schließen" @click="close" />
        <q-btn
          v-if="canPush"
          color="secondary"
          :label="pushLabel"
          :disable="bridge.rollPending"
          @click="push"
        />
        <q-btn
          color="primary"
          label="Würfeln"
          :disable="bridge.rollPending || !rollable"
          @click="submit"
        />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { RollParams } from "@/model/types";
import { useBridgeStore } from "@/stores/bridge";
import { useCharacterStore } from "@/stores/character";
import { useRollDialogStore } from "@/stores/rollDialog";

const dialog = useRollDialogStore();
const bridge = useBridgeStore();
const character = useCharacterStore();

const params = ref<RollParams | null>(null);
const damage = ref(0);
let requestId = "";

const check = computed(() =>
  params.value?.kind === "check" ? params.value : null
);
const armor = computed(() =>
  params.value?.kind === "armor" ? params.value : null
);
const evaluation = computed(() => bridge.evaluation);

const title = computed(() => {
  if (check.value) return check.value.label;
  if (armor.value) return "Rüstungswurf";
  if (params.value?.kind === "consumable") return "Verbrauchsgut";
  if (params.value?.kind === "event") return "Ereigniswurf";
  return "Wurf";
});

const armorEntries = computed(() => character.state?.characterGear.armor ?? []);

const armorName = (id: string) =>
  armorEntries.value.find(entry => entry.id === id)?.data.name ?? id;

const totalDice = computed(() => {
  if (!check.value) return 0;
  const artifacts = check.value.artifacts.reduce(
    (sum, artifact) => sum + artifact.dice,
    0
  );
  return (
    check.value.attributeDice +
    (check.value.skillDice ?? 0) +
    (check.value.weaponDice ?? 0) +
    artifacts
  );
});

const rollable = computed(() => {
  if (check.value) return totalDice.value > 0;
  if (armor.value) return armor.value.armorIds.length > 0;
  return true;
});

const canPush = computed(
  () => evaluation.value?.kind === "check" && evaluation.value.canPush
);
const pushLabel = computed(() =>
  evaluation.value?.kind === "check"
    ? evaluation.value.pushLabel
    : "Strapazieren"
);

watch(
  () => dialog.open,
  open => {
    if (!open || !dialog.roll) return;
    const copy = JSON.parse(JSON.stringify(dialog.roll.params)) as RollParams;
    if (copy.kind === "check") {
      for (const sides of [8, 10, 12]) {
        if (!copy.artifacts.some(artifact => artifact.sides === sides)) {
          copy.artifacts.push({ sides, dice: 0 });
        }
      }
    }
    params.value = copy;
    damage.value = copy.kind === "armor" ? (copy.damage ?? 0) : 0;
    requestId = crypto.randomUUID();
    bridge.resetRoll();
  }
);

const toggleArmor = (id: string, selected: boolean) => {
  if (!armor.value) return;
  armor.value.armorIds = selected
    ? [...armor.value.armorIds, id]
    : armor.value.armorIds.filter(entryId => entryId !== id);
};

const submit = () => {
  if (!params.value) return;
  if (params.value.kind === "armor") params.value.damage = damage.value;
  bridge.requestRoll(requestId, params.value.kind, params.value);
};

const push = () => bridge.pushRoll(requestId);

const close = () => {
  dialog.open = false;
  params.value = null;
  bridge.resetRoll();
};
</script>
