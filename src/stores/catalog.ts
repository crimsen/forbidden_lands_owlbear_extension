import { defineStore } from "pinia";
import { ref } from "vue";
import type { Ruleset } from "@/model/types";

/** Spiegel des App-Regelwerks (für Auswahllisten der Extension). */
export const useCatalogStore = defineStore("catalog", () => {
  const ruleset = ref<Ruleset | null>(null);

  const setRuleset = (next: Ruleset) => {
    ruleset.value = next;
  };

  return { ruleset, setRuleset };
});
