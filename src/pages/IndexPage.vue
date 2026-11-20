<template>
  <q-page class="q-pa-md">
    <div class="row items-center">
      <div class="col">
        <div class="text-subtitle1">Verbotene Lande</div>
        <div
          class="text-caption"
          :class="connected ? 'text-positive' : 'text-grey-6'"
        >
          {{
            connected
              ? "Mit der App verbunden"
              : "Keine Verbindung zur App (Port 47823)"
          }}
        </div>
      </div>
      <q-btn
        color="primary"
        icon="mdi-dice-multiple"
        label="W6 würfeln"
        :loading="rolling"
        @click="rollLocal"
      />
    </div>

    <pre
      v-if="last"
      class="q-mt-md q-pa-sm bg-grey-2 text-caption"
      style="max-height: 320px; overflow: auto"
      >{{ last }}</pre>
  </q-page>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from "vue";
import { Notify } from "quasar";
import { rollWithDicePlus } from "@/services/dicePlus";
import {
  connectBridge,
  type BridgeConnection,
  type BridgeMessage
} from "@/services/bridge";

const connected = ref(false);
const rolling = ref(false);
const last = ref("");

let connection: BridgeConnection | undefined;

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

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
