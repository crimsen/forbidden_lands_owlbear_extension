import { defineStore } from "pinia";
import { ref } from "vue";
import type { RollButton } from "@/model/types";

/** Öffnet den Wurf-Dialog für einen vorberechneten Wurf-Button. */
export const useRollDialogStore = defineStore("rollDialog", () => {
  const open = ref(false);
  const roll = ref<RollButton | null>(null);

  const show = (next: RollButton) => {
    roll.value = next;
    open.value = true;
  };

  return { open, roll, show };
});
