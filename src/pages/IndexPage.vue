<template>
  <q-page class="q-pa-md">
    <div class="row items-center">
      <div class="col">
        <div class="text-subtitle1">Verbotene Lande</div>
        <div class="row items-center q-gutter-sm q-mt-xs">
          <q-chip
            dense
            square
            :color="obr.color"
            :label="obr.label"
            :icon="obr.icon"
            text-color="white"
          />
          <div
            class="text-caption"
            :class="connected ? 'text-positive' : 'text-grey-6'"
          >
            {{
              connected
                ? "App-Bridge verbunden"
                : "App-Bridge getrennt (Port 47823)"
            }}
          </div>
        </div>
      </div>
      <q-btn
        color="primary"
        icon="mdi-dice-multiple"
        label="W6 würfeln"
        :loading="rolling"
        :disable="obrState !== 'ready'"
        @click="rollLocal"
      />
    </div>

    <q-banner
      v-if="obrState === 'timeout'"
      dense
      rounded
      class="q-mt-md bg-orange-1 text-orange-9"
    >
      Owlbear Rodeo hat den Handshake nicht gemeldet. Lade die Seite neu oder
      schließe die Extension in Owlbear und öffne sie erneut.
      <template #action>
        <q-btn flat color="orange-9" label="Neu laden" @click="reload" />
      </template>
    </q-banner>

    <q-expansion-item
      v-if="isDev"
      dense
      icon="mdi-bug-outline"
      label="Diagnose"
      class="q-mt-sm"
    >
      <pre
        class="q-pa-sm bg-grey-2 text-caption"
        style="max-height: 200px; overflow: auto"
        >{{ detail }}</pre>
    </q-expansion-item>

    <pre
      v-if="last"
      class="q-mt-md q-pa-sm bg-grey-2 text-caption"
      style="max-height: 320px; overflow: auto"
      >{{ last }}</pre>
  </q-page>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from "vue";
import { Notify } from "quasar";
import { rollWithDicePlus } from "@/services/dicePlus";
import { obrDetail, obrState, type ObrState } from "@/services/obr";
import {
  connectBridge,
  type BridgeConnection,
  type BridgeMessage
} from "@/services/bridge";

const connected = ref(false);
const rolling = ref(false);
const last = ref("");
const isDev = import.meta.env.DEV;

const obrStates: Record<
  ObrState,
  { label: string; color: string; icon: string }
> = {
  unavailable: {
    label: "Nicht in Owlbear",
    color: "grey",
    icon: "mdi-open-in-new"
  },
  connecting: {
    label: "Owlbear verbindet …",
    color: "orange",
    icon: "mdi-timer-sand"
  },
  ready: {
    label: "Owlbear bereit",
    color: "positive",
    icon: "mdi-check-circle"
  },
  timeout: {
    label: "Owlbear nicht bereit",
    color: "negative",
    icon: "mdi-alert-circle"
  }
};

const obr = computed(() => obrStates[obrState.value]);
const detail = computed(() => JSON.stringify(obrDetail.value, null, 2));

let connection: BridgeConnection | undefined;

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

const reload = () => window.location.reload();

const rollLocal = async () => {
  rolling.value = true;
  try {
    last.value = JSON.stringify(await rollWithDicePlus("1d6"), null, 2);
  } catch (error) {
    Notify.create({ type: "warning", message: errorText(error) });
  } finally {
    rolling.value = false;
  }
};

/** Auftrag der App: würfeln und das Ergebnis zurückgeben. */
const handleBridgeMessage = async (message: BridgeMessage) => {
  const id = message.id;
  if (message.type !== "roll" || !id) return;
  const notation = String(message.notation ?? "");
  try {
    const result = await rollWithDicePlus(notation);
    last.value = JSON.stringify(result, null, 2);
    connection?.send({ v: 1, type: "roll-result", id, notation, result });
  } catch (error) {
    connection?.send({
      v: 1,
      type: "roll-error",
      id,
      message: errorText(error)
    });
  }
};

onMounted(() => {
  connection = connectBridge({
    onMessage: message => void handleBridgeMessage(message),
    onStatus: value => (connected.value = value)
  });
});

onUnmounted(() => connection?.close());
</script>
