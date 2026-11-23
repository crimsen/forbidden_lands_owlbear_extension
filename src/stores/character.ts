import { defineStore } from "pinia";
import { computed, ref } from "vue";
import type { CharacterView } from "@/model/types";
import { useBridgeStore } from "@/stores/bridge";

/** Spiegel des offenen Charakters; bearbeitet wird nur über Aktionen. */
export const useCharacterStore = defineStore("character", () => {
  const view = ref<CharacterView | null>(null);
  /** Letzte angewandte Revision; ältere Snapshots werden verworfen. */
  const rev = ref(-1);

  const state = computed(() => view.value?.state ?? null);
  const derived = computed(() => view.value?.derived ?? null);
  const rolls = computed(() => view.value?.rolls ?? []);

  const setView = (next: CharacterView, nextRev: number) => {
    if (nextRev < rev.value) return;
    rev.value = nextRev;
    view.value = next;
  };

  const clear = () => {
    view.value = null;
    rev.value = -1;
  };

  /** Sendet eine Aktion an die App; die App validiert und spiegelt zurück. */
  const sendAction = (action: string, args: Record<string, unknown>) => {
    useBridgeStore().send({ type: "character-action", action, args });
  };

  return { view, rev, state, derived, rolls, setView, clear, sendAction };
});
