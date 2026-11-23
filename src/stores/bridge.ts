import { defineStore } from "pinia";
import { ref } from "vue";
import type { CharacterView, Ruleset } from "@/model/types";
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
import { useCatalogStore } from "@/stores/catalog";
import { useCharacterStore } from "@/stores/character";

/** Kopplungscode liegt lokal in der Extension, nicht im Quellcode. */
const PAIRING_KEY = "forbidden-lands-pairing";

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

  const init = () => {
    connect();
    void refreshDicePlus();
  };

  return {
    connected,
    dicePlusReady,
    pairingCode,
    rollTarget,
    init,
    send,
    setPairingCode,
    refreshDicePlus
  };
});
