<template>
  <q-dialog
    :model-value="dialog.open"
    @update:model-value="value => !value && close()"
  >
    <q-card style="min-width: 320px; max-width: 94vw">
      <q-card-section class="text-subtitle1">{{ title }}</q-card-section>

      <q-card-section v-if="kind === 'check'" class="q-pt-none q-gutter-y-xs">
        <q-input v-if="free" v-model="label" label="Titel" dense outlined />

        <div class="row items-center no-wrap">
          <div class="col">
            Attribut
            <q-select
              v-if="free"
              v-model="attribute"
              :options="attributeOptions"
              dense
              outlined
              options-dense
              class="q-mt-xs"
            />
            <span v-else class="text-caption text-grey-6">
              · {{ attribute }}
            </span>
          </div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="attributeDice <= 0"
            @click="attributeDice--"
          />
          <div class="text-body2 q-px-sm">{{ attributeDice }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="attributeDice++"
          />
        </div>

        <div v-if="skillName || free" class="row items-center no-wrap">
          <div class="col">
            Fertigkeit
            <span v-if="skillName" class="text-caption text-grey-6"
              >· {{ skillName }}</span
            >
          </div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="skillDice <= 0"
            @click="skillDice--"
          />
          <div class="text-body2 q-px-sm">{{ skillDice }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="skillDice++"
          />
        </div>

        <q-select
          v-model="weaponId"
          :options="weaponOptions"
          label="Waffe"
          dense
          outlined
          emit-value
          map-options
          options-dense
          class="q-mt-xs"
        />

        <div class="row items-center no-wrap">
          <div class="col">
            Waffenwürfel
            <span v-if="selectedWeapon" class="text-caption text-grey-6">
              · {{ selectedWeapon.name }}
            </span>
          </div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="weaponDice <= 0"
            @click="weaponDice--"
          />
          <div class="text-body2 q-px-sm">{{ weaponDice }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="weaponDice++"
          />
        </div>

        <q-select
          v-model="talentNames"
          :options="talentOptions"
          label="Talent (Artefaktwürfel)"
          dense
          outlined
          multiple
          use-chips
          emit-value
          map-options
          options-dense
          class="q-mt-xs"
        />

        <div
          v-for="sides in ARTIFACT_DICE"
          :key="sides"
          class="row items-center no-wrap"
        >
          <div class="col">Artefakt W{{ sides }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-minus"
            :disable="(artifactDice[sides] ?? 0) <= 0"
            @click="artifactDice[sides] = (artifactDice[sides] ?? 0) - 1"
          />
          <div class="text-body2 q-px-sm">{{ artifactDice[sides] ?? 0 }}</div>
          <q-btn
            flat
            dense
            round
            size="sm"
            icon="mdi-plus"
            @click="artifactDice[sides] = (artifactDice[sides] ?? 0) + 1"
          />
        </div>

        <q-select
          v-model="bridge.rollTarget"
          :options="rollTargets"
          label="Wurf sichtbar für"
          dense
          outlined
          emit-value
          map-options
          options-dense
        />
      </q-card-section>

      <q-card-section
        v-else-if="kind === 'armor'"
        class="q-pt-none q-gutter-y-xs"
      >
        <div class="text-caption text-grey-6">Rüstungsteile</div>
        <q-checkbox
          v-for="entry in armorEntries"
          :key="entry.id"
          dense
          :model-value="armorIds.includes(entry.id)"
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
          <div class="text-subtitle2">Erfolge: {{ evaluation.successes }}</div>
          <div
            v-for="(group, index) in evaluation.groups"
            :key="index"
            class="text-body2"
          >
            <span class="text-grey-6">{{ group.description }}:</span>
            {{ group.dice.join(", ") }}
            <span v-if="group.artifact" class="text-grey-6">
              → {{ group.successes }} Erfolge
            </span>
          </div>
          <div
            v-if="evaluation.pushCount > 0 && evaluation.failures > 0"
            class="text-caption text-grey-6"
          >
            Attributschaden bereits verrechnet:
            {{ evaluation.failures }} Schaden · +{{ evaluation.failures }} WP
          </div>
          <div v-if="evaluation.canPush" class="q-mt-sm">
            <div
              v-if="evaluation.pushCount === 0 && evaluation.failures > 0"
              class="text-caption text-grey-6"
            >
              {{ evaluation.failures }} Attributschaden · +{{
                evaluation.failures
              }}
              WP · {{ evaluation.failures }} Attributwürfel weniger
            </div>
            <q-btn
              outline
              color="primary"
              :label="evaluation.pushLabel"
              @click="push"
            />
          </div>
          <div
            v-else-if="evaluation.successes === 0 && !free"
            class="text-caption text-grey-6"
          >
            Kein weiterer Wurf ohne Strapazieren.
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
          color="primary"
          label="Würfeln"
          :disable="!canRoll"
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
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";
import { useRollDialogStore } from "@/stores/rollDialog";

const ARTIFACT_DICE = [8, 10, 12];

const dialog = useRollDialogStore();
const bridge = useBridgeStore();
const catalog = useCatalogStore();
const character = useCharacterStore();

const kind = ref<RollParams["kind"]>("event");
const free = ref(false);
const label = ref("");
const attribute = ref("");
const skillName = ref<string | undefined>(undefined);
const attributeDice = ref(0);
const skillDice = ref(0);
const weaponDice = ref(0);
const weaponId = ref("");
const talentNames = ref<string[]>([]);
const artifactDice = ref<Record<number, number>>({ 8: 0, 10: 0, 12: 0 });
const armorIds = ref<string[]>([]);
const damage = ref(0);
const consumableRefId = ref("");
let requestId = "";

const evaluation = computed(() => bridge.evaluation);

const attributeOptions = computed(() => catalog.ruleset?.attributes ?? []);
const weaponOptions = computed(() => [
  { label: "Keine Waffe", value: "" },
  ...(character.derived?.weaponOptions ?? []).map(option => ({
    label: option.label,
    value: option.id
  }))
]);
const selectedWeapon = computed(
  () =>
    character.derived?.weaponOptions.find(
      option => option.id === weaponId.value
    ) ?? null
);
const talentOptions = computed(() =>
  (character.derived?.talentOptions ?? []).map(option => ({
    label: option.label,
    value: option.name
  }))
);
const armorEntries = computed(() => character.state?.characterGear.armor ?? []);

const rollTargets = [
  { label: "Alle", value: "everyone" },
  { label: "Nur ich", value: "self" },
  { label: "GM und ich", value: "dm" },
  { label: "Nur GM", value: "gm_only" }
];

const title = computed(() => {
  if (kind.value === "check") {
    return free.value
      ? label.value || "Freier Wurf"
      : (dialog.roll?.label ?? "Wurf");
  }
  if (kind.value === "armor") return "Rüstungswurf";
  if (kind.value === "consumable") return dialog.roll?.label ?? "Verbrauchsgut";
  return "Ereigniswurf";
});

const armorName = (id: string) =>
  armorEntries.value.find(entry => entry.id === id)?.data.name ?? id;

const totalDice = computed(
  () =>
    attributeDice.value +
    skillDice.value +
    weaponDice.value +
    ARTIFACT_DICE.reduce(
      (sum, sides) => sum + (artifactDice.value[sides] ?? 0),
      0
    )
);

const canRoll = computed(() => {
  if (!bridge.connected || bridge.rollPending) return false;
  if (kind.value === "check") {
    if (totalDice.value <= 0) return false;
    // Nach dem Wurf nur noch über Strapazieren; im freien Wurf beliebig oft.
    return free.value || !evaluation.value;
  }
  if (kind.value === "armor") return armorIds.value.length > 0;
  return true;
});

// Bonuswürfel der gewählten Waffe automatisch übernehmen.
watch(weaponId, () => {
  weaponDice.value = selectedWeapon.value?.dice ?? 0;
});

// Artefaktwürfel der gewählten Talente automatisch übernehmen.
watch(talentNames, () => {
  const next: Record<number, number> = { 8: 0, 10: 0, 12: 0 };
  for (const name of talentNames.value) {
    const option = (character.derived?.talentOptions ?? []).find(
      entry => entry.name === name
    );
    if (option) next[option.die] = (next[option.die] ?? 0) + 1;
  }
  artifactDice.value = next;
});

watch(
  () => dialog.open,
  open => {
    if (!open || !dialog.roll) return;
    const params = dialog.roll.params;
    kind.value = params.kind;
    bridge.resetRoll();
    requestId = crypto.randomUUID();
    if (params.kind === "check") {
      free.value = params.free === true;
      label.value = params.label;
      attribute.value = params.attribute;
      skillName.value = params.skill;
      attributeDice.value = params.attributeDice;
      skillDice.value = params.skillDice ?? 0;
      weaponId.value =
        character.derived?.weaponOptions.find(
          option => option.name === params.weapon
        )?.id ?? "";
      weaponDice.value = params.weaponDice ?? 0;
      talentNames.value = [];
      artifactDice.value = { 8: 0, 10: 0, 12: 0 };
      for (const artifact of params.artifacts) {
        artifactDice.value[artifact.sides] = artifact.dice;
      }
    } else if (params.kind === "armor") {
      armorIds.value = [...params.armorIds];
      damage.value = params.damage ?? 0;
    } else if (params.kind === "consumable") {
      consumableRefId.value = params.refId;
    }
  }
);

const toggleArmor = (id: string, selected: boolean) => {
  armorIds.value = selected
    ? [...armorIds.value, id]
    : armorIds.value.filter(entryId => entryId !== id);
};

const buildParams = (): RollParams => {
  if (kind.value === "check") {
    const weapon = selectedWeapon.value?.name;
    return {
      kind: "check",
      ...(free.value ? { free: true } : {}),
      label: label.value,
      attribute: attribute.value,
      attributeDice: attributeDice.value,
      ...(skillName.value ? { skill: skillName.value } : {}),
      skillDice: skillDice.value,
      ...(weapon ? { weapon } : {}),
      weaponDice: weaponDice.value,
      artifacts: ARTIFACT_DICE.map(sides => ({
        sides,
        dice: artifactDice.value[sides] ?? 0
      }))
    };
  }
  if (kind.value === "armor") {
    return { kind: "armor", armorIds: armorIds.value, damage: damage.value };
  }
  if (kind.value === "consumable") {
    return { kind: "consumable", refId: consumableRefId.value };
  }
  return { kind: "event" };
};

const submit = () => {
  if (!canRoll.value) return;
  const params = buildParams();
  bridge.requestRoll(requestId, params.kind, params);
};

const push = () => bridge.pushRoll(requestId);

const close = () => {
  dialog.open = false;
  bridge.resetRoll();
};
</script>
