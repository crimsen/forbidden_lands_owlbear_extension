import { defineStore } from "pinia";
import { ref } from "vue";

/** Bearbeiten-Modus für Name, Volk, Beruf, Aussehen und Hintergrund. */
export const useUiStore = defineStore("ui", () => {
  const editing = ref(false);

  const toggleEditing = () => {
    editing.value = !editing.value;
  };

  return { editing, toggleEditing };
});
