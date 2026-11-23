<template>
  <q-dialog
    :model-value="dialog.open"
    @update:model-value="value => !value && close()"
  >
    <q-card style="min-width: 320px; max-width: 94vw">
      <q-card-section class="text-subtitle1">{{ title }}</q-card-section>

      <q-card-section v-if="kind === 'check'" class="q-pt-none q-gutter-y-xs">
        <q-input
          v-if="free && bridge.connected"
          v-model="label"
          label="Titel"
          dense
          outlined
        />

        <div class="row items-center no-wrap">
          <div class="col">
            Attribut
            <q-select
              v-if="free && bridge.connected"
              v-model="attribute"
              :options="attributeOptions"
              dense
              outlined
              options-dense
              class="q-mt-xs"
            />
            <span v-else-if="!free" class="text-caption text-grey-6">
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
          v-if="showSelectors"
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
          v-if="showSelectors"
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
        <div v-if="armorEntries.length === 0" class="text-grey-6">
          Keine Rüstung angelegt.
        </div>
        <div v-else class="text-caption text-grey-6">Rüstungsteile</div>
        <div class="column">
          <q-toggle
            v-for="entry in armorEntries"
            :key="entry.id"
            :model-value="armorIds.includes(entry.id)"
            :label="armorLabel(entry)"
            :disable="entry.data.rating <= 0"
            color="primary"
            dense
            @update:model-value="value => toggleArmor(entry.id, value)"
          />
        </div>
        <q-input
          v-model.number="damage"
          type="number"
          min="0"
          label="Erlittener Schaden"
          dense
          outlined
          class="q-mt-sm"
        />
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
        <div class="text-caption text-grey-6">
          {{ armorTotalDice }} W6 (Summe der Rüstungswerte)
        </div>
      </q-card-section>

      <q-card-section
        v-if="bridge.rollPending || localPending"
        class="text-center"
      >
        <q-spinner color="primary" size="2em" />
        <div class="text-caption q-mt-xs">
          {{ bridge.rollPending ? "Die App wertet aus …" : "Dice+ würfelt …" }}
        </div>
      </q-card-section>

      <q-card-section
        v-else-if="bridge.rollError || localError"
        class="text-caption text-negative"
      >
        {{ bridge.rollError || localError }}
      </q-card-section>

      <q-card-section v-else-if="localResult" class="q-pt-none">
        <div
          v-for="(group, index) in localResult.groups"
          :key="index"
          class="text-body2"
        >
          <span class="text-grey-6">{{ group.description }}:</span>
          {{ group.dice.join(", ") }}
        </div>
        <div class="text-subtitle2 q-mt-xs">
          Summe: {{ localResult.totalValue }}
        </div>
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
            v-if="evaluation.appliedFailures > 0"
            class="text-caption text-grey-6"
          >
            Attributschaden bereits verrechnet:
            {{ evaluation.appliedFailures }} Schaden · +{{
              evaluation.appliedFailures
            }}
            WP
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
          <div class="text-subtitle2">
            Rüstung: {{ evaluation.absorbed }} Schaden verhindert
          </div>
          <div
            v-for="(group, index) in evaluation.groups"
            :key="index"
            class="text-body2"
          >
            <span class="text-grey-6">{{ group.description }}:</span>
            {{ group.dice.join(", ") }}
          </div>

          <div class="text-body2 q-mt-sm">
            Schaden auf Stärke: {{ evaluation.damage }}
          </div>
          <div v-if="damageApplied" class="text-caption text-positive">
            Stärkeschaden angerechnet.
          </div>
          <q-btn
            v-else
            outline
            color="primary"
            class="q-mt-sm"
            label="Stärkeschaden anwenden"
            :disable="evaluation.damage === 0"
            @click="applyArmorDamage"
          />

          <div class="q-mt-md">
            <div
              v-if="evaluation.damage === 0"
              class="text-caption text-grey-6"
            >
              Rüstung hat alles abgefangen – keine Abnutzung.
            </div>
            <template v-else>
              <div class="text-subtitle2">Abnutzung (Einsen)</div>
              <div
                v-for="row in degradationRows"
                :key="row.id"
                class="row items-center no-wrap"
              >
                <div class="col text-body2">{{ row.name }}</div>
                <q-btn
                  dense
                  flat
                  round
                  size="sm"
                  icon="mdi-minus"
                  :disable="degradationApplied || row.value <= 0"
                  @click="setDegradation(row.id, row.value - 1)"
                />
                <div class="text-body2 q-px-sm">{{ row.value }}</div>
                <q-btn
                  dense
                  flat
                  round
                  size="sm"
                  icon="mdi-plus"
                  :disable="degradationApplied || row.value >= row.max"
                  @click="setDegradation(row.id, row.value + 1)"
                />
              </div>
              <div v-if="degradationApplied" class="text-caption text-positive">
                Abnutzung angerechnet.
              </div>
              <q-btn
                v-else
                outline
                color="primary"
                class="q-mt-sm"
                label="Abnutzung übernehmen"
                :disable="!hasDegradation"
                @click="applyDegradation"
              />
            </template>
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

  <q-dialog v-model="confirmingDestroy">
    <q-card style="min-width: 300px">
      <q-card-section class="text-subtitle1">Rüstung zerstört?</q-card-section>
      <q-card-section class="q-pt-none text-body2">
        {{ destroyedNames }} steht bei 0 – aus dem Inventar entfernen?
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="Behalten (0)" @click="keepDestroyed" />
        <q-btn color="negative" label="Entfernen" @click="removeDestroyed" />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import type { RollParams } from "@/model/types";
import { EVENT_ROLL, rollNotation } from "@/model/roll";
import { rollTargetOf, rollWithDicePlus } from "@/services/dicePlus";
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
const damageApplied = ref(false);
const degradationApplied = ref(false);
const overrides = ref<Record<string, number>>({});
const destroyedIds = ref<string[]>([]);
const confirmingDestroy = ref(false);
const localPending = ref(false);
const localError = ref("");
const localResult = ref<LocalResult | null>(null);
let requestId = "";

interface LocalGroup {
  description: string;
  dice: number[];
  total: number;
}
interface LocalResult {
  groups: LocalGroup[];
  totalValue: number;
}

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

const armorLabel = (entry: {
  data: { name: string; part: string; rating: number };
}) =>
  entry.data.part === "Schild"
    ? `${entry.data.name} (+${entry.data.rating})`
    : `${entry.data.name} (${entry.data.rating})`;

const armorTotalDice = computed(() =>
  armorEntries.value
    .filter(entry => armorIds.value.includes(entry.id))
    .reduce((sum, entry) => sum + entry.data.rating, 0)
);

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

/** Auswahlfelder nur mit App (offline fehlen Regelwerk und Charakter). */
const showSelectors = computed(() => !free.value || bridge.connected);

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
  if (!bridge.dicePlusReady || bridge.rollPending || localPending.value) {
    return false;
  }
  if (kind.value === "event") return true;
  if (kind.value === "check") {
    if (totalDice.value <= 0) return false;
    // Freier Wurf: nur Dice+ nötig; sonst App und nach dem Wurf nur Strapazieren.
    if (free.value) return true;
    return bridge.connected && !evaluation.value;
  }
  if (kind.value === "armor") {
    return bridge.connected && armorIds.value.length > 0;
  }
  return bridge.connected;
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
    localResult.value = null;
    localError.value = "";
    localPending.value = false;
    requestId = crypto.randomUUID();
    if (params.kind === "check") {
      free.value = params.free === true;
      label.value = params.label;
      attribute.value =
        params.attribute ||
        (free.value ? (catalog.ruleset?.attributes[0] ?? "") : "");
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
      resetArmor();
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
  resetArmor();
  localResult.value = null;
  localError.value = "";
  // Freier/ereignis ohne App: lokal würfeln (App sonst wertet aus).
  if ((kind.value === "event" || free.value) && !bridge.connected) {
    void localRoll();
    return;
  }
  const params = buildParams();
  bridge.requestRoll(requestId, params.kind, params);
};

/** Notation des freien Wurfs aus den Dialogwerten. */
const freeNotation = () =>
  rollNotation({
    attributeDice: attributeDice.value,
    attribute: attribute.value,
    skillDice: skillDice.value,
    skill: skillName.value,
    weaponDice: weaponDice.value,
    weapon: selectedWeapon.value?.name,
    artifacts: ARTIFACT_DICE.map(sides => ({
      sides,
      dice: artifactDice.value[sides] ?? 0
    }))
  });

const extractDice = (payload: Record<string, unknown>): LocalResult => {
  const outer = payload.result as
    | {
        result?: {
          totalValue?: number;
          groups?: {
            description?: string;
            dice?: { value?: number }[];
            total?: number;
          }[];
        };
      }
    | undefined;
  const inner = outer?.result;
  return {
    totalValue: inner?.totalValue ?? 0,
    groups: (inner?.groups ?? []).map(group => ({
      description: group.description ?? "Würfel",
      dice: (group.dice ?? []).map(die => die.value ?? 0),
      total: group.total ?? 0
    }))
  };
};

/** Würfelt ohne App direkt über Dice+ und zeigt die rohen Würfel. */
const localRoll = async () => {
  localPending.value = true;
  localResult.value = null;
  localError.value = "";
  try {
    const notation =
      kind.value === "event" ? EVENT_ROLL.notation : freeNotation();
    const payload = await rollWithDicePlus(
      notation,
      rollTargetOf(bridge.rollTarget)
    );
    localResult.value = extractDice(payload);
  } catch (error) {
    localError.value = error instanceof Error ? error.message : String(error);
  } finally {
    localPending.value = false;
  }
};

const push = () => bridge.pushRoll(requestId);

// --- Rüstungsfolgen bestätigen (wie in der App) --------------------------

const degradationRows = computed(() => {
  const current = evaluation.value;
  if (current?.kind !== "armor") return [];
  return current.degradation.map(row => ({
    id: row.id,
    name: row.name,
    max: row.max,
    value: overrides.value[row.id] ?? row.value
  }));
});

const hasDegradation = computed(() =>
  degradationRows.value.some(row => row.value > 0)
);

const destroyedNames = computed(() =>
  destroyedIds.value.map(id => armorName(id)).join(", ")
);

const resetArmor = () => {
  damageApplied.value = false;
  degradationApplied.value = false;
  overrides.value = {};
  destroyedIds.value = [];
  confirmingDestroy.value = false;
};

const setDegradation = (id: string, value: number) => {
  overrides.value = { ...overrides.value, [id]: Math.max(0, value) };
};

const applyArmorDamage = () => {
  bridge.applyRoll(requestId, "armor-damage");
  damageApplied.value = true;
};

const applyDegradation = () => {
  const rows = degradationRows.value.map(row => ({
    id: row.id,
    value: row.value
  }));
  bridge.applyRoll(requestId, "armor-degradation", { rows });
  degradationApplied.value = true;
  const zero = degradationRows.value.filter(
    row => row.max > 0 && row.value >= row.max
  );
  if (zero.length > 0) {
    destroyedIds.value = zero.map(row => row.id);
    confirmingDestroy.value = true;
  }
};

const removeDestroyed = () => {
  bridge.applyRoll(requestId, "armor-destroy", {
    ids: destroyedIds.value,
    remove: true
  });
  destroyedIds.value = [];
  confirmingDestroy.value = false;
};

const keepDestroyed = () => {
  bridge.applyRoll(requestId, "armor-destroy", {
    ids: destroyedIds.value,
    remove: false
  });
  destroyedIds.value = [];
  confirmingDestroy.value = false;
};

const close = () => {
  dialog.open = false;
  bridge.resetRoll();
  localResult.value = null;
  localError.value = "";
  localPending.value = false;
};
</script>
