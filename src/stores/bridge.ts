import { defineStore } from "pinia";
import { ref, watch } from "vue";
import type {
  CharacterView,
  RollEvaluation,
  RollParams,
  Ruleset
} from "@/model/types";
import type { RollTarget } from "@/services/dicePlus";
import {
  checkDicePlusReady,
  rollTargetOf,
  rollWithDicePlus
} from "@/services/dicePlus";
import {
  connectBridge,
  type BridgeConnection,
  type BridgeMessage
} from "@/services/bridge";
import { obrState } from "@/services/obr";
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

/** Kopplungscode liegt lokal in der Extension, nicht im Quellcode. */
const PAIRING_KEY = "forbidden-lands-pairing";

/** Dice+ zyklisch prüfen: schneller, solange es fehlt. */
const DICE_RETRY_MS = 3000;
const DICE_IDLE_MS = 15000;

const errorText = (error: unknown) =>
  error instanceof Error ? error.message : String(error);

/** Verbindung zur App plus Weiterleitung der Nachrichten an die Stores. */
export const useBridgeStore = defineStore("bridge", () => {
  const catalog = useCatalogStore();
  const character = useCharacterStore();

  const connected = ref(false);
  const dicePlusReady = ref(false);
  const pairingCode = ref(localStorage.getItem(PAIRING_KEY) ?? "");
  const rollTarget = ref<RollTarget>("everyone");

  /** Zustand des laufenden, von der App ausgewerteten Wurfs. */
  const evaluation = ref<RollEvaluation | null>(null);
  const rollPending = ref(false);
  const rollError = ref("");
  let evaluationRequestId = "";

  let connection: BridgeConnection | null = null;

  const send = (message: BridgeMessage) => connection?.send(message);

  /** Würfelauftrag der App ausführen und Ergebnis zurückschicken. */
  const handleRoll = async (message: BridgeMessage) => {
    const id = typeof message.id === "string" ? message.id : "";
    if (!id) return;
    const notation =
      typeof message.notation === "string" ? message.notation : "";
    try {
      const result = await rollWithDicePlus(
        notation,
        rollTargetOf(message.target)
      );
      send({ type: "roll-result", id, notation, result });
    } catch (error) {
      send({ type: "roll-error", id, message: errorText(error) });
    }
  };

  const handleMessage = (message: BridgeMessage) => {
    switch (message.type) {
      case "ruleset":
        catalog.setRuleset(message.ruleset as Ruleset);
        break;
      case "character":
        character.setView(
          message.view as CharacterView,
          Number(message.rev ?? 0)
        );
        break;
      case "character-clear":
        character.clear();
        break;
      case "roll":
        void handleRoll(message);
        break;
      case "roll-evaluation":
        if (message.requestId !== evaluationRequestId) break;
        rollPending.value = false;
        if (typeof message.error === "string" && message.error) {
          rollError.value = message.error;
          evaluation.value = null;
        } else {
          rollError.value = "";
          evaluation.value = (message.evaluation ??
            null) as RollEvaluation | null;
        }
        break;
      default:
        break;
    }
  };

  const refreshDicePlus = async () => {
    try {
      dicePlusReady.value = await checkDicePlusReady();
    } catch {
      dicePlusReady.value = false;
    }
  };

  let diceTimer: ReturnType<typeof setTimeout> | undefined;

  /** Prüft Dice+ zyklisch, solange Owlbear bereit ist (schneller, wenn es fehlt). */
  const scheduleDiceCheck = () => {
    if (diceTimer) clearTimeout(diceTimer);
    diceTimer = setTimeout(
      async () => {
        if (obrState.value === "ready") await refreshDicePlus();
        scheduleDiceCheck();
      },
      dicePlusReady.value ? DICE_IDLE_MS : DICE_RETRY_MS
    );
  };

  const connect = () => {
    connection?.close();
    connection = null;
    if (!pairingCode.value) {
      connected.value = false;
      return;
    }
    connection = connectBridge(pairingCode.value, {
      onMessage: handleMessage,
      onStatus: value => {
        connected.value = value;
        if (value) void refreshDicePlus();
      }
    });
  };

  const setPairingCode = (value: string) => {
    pairingCode.value = value.trim();
    localStorage.setItem(PAIRING_KEY, pairingCode.value);
    connect();
  };

  /** Startet einen Wurf: die App baut die Notation und wertet aus. */
  const requestRoll = (
    requestId: string,
    kind: string,
    params: RollParams,
    target: RollTarget = rollTarget.value
  ) => {
    evaluationRequestId = requestId;
    evaluation.value = null;
    rollError.value = "";
    rollPending.value = true;
    send({ type: "roll-request", requestId, kind, params, target });
  };

  /** „Strapazieren“: die App verrechnet die 1en und würfelt erneut. */
  const pushRoll = (requestId: string) => {
    evaluationRequestId = requestId;
    evaluation.value = null;
    rollError.value = "";
    rollPending.value = true;
    send({ type: "roll-push", requestId });
  };

  /** Bestätigte Rüstungsfolge (Schaden, Abnutzung, Zerstörung) anwenden. */
  const applyRoll = (
    requestId: string,
    apply: string,
    payload?: Record<string, unknown>
  ) => {
    send({
      type: "roll-apply",
      requestId,
      apply,
      ...(payload ? { payload } : {})
    });
  };

  /** Setzt den Wurf-Zustand zurück (beim Öffnen des Dialogs). */
  const resetRoll = () => {
    evaluationRequestId = "";
    evaluation.value = null;
    rollError.value = "";
    rollPending.value = false;
  };

  const init = () => {
    connect();
    void refreshDicePlus();
    scheduleDiceCheck();
    // Sobald Owlbear bereit ist, Dice+ sofort erneut prüfen.
    watch(obrState, value => {
      if (value === "ready") void refreshDicePlus();
    });
  };

  return {
    connected,
    dicePlusReady,
    pairingCode,
    rollTarget,
    evaluation,
    rollPending,
    rollError,
    init,
    send,
    setPairingCode,
    refreshDicePlus,
    requestRoll,
    pushRoll,
    applyRoll,
    resetRoll
  };
});
