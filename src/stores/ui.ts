import { defineStore } from "pinia";
import { ref } from "vue";
import OBR from "@owlbear-rodeo/sdk";

const SIZE_KEY = "forbidden-lands-size";

/** Kompakte Mindestgröße der Extension. */
export const MIN_SIZE = { width: 400, height: 600 };
/** Obergrenze (Maximum im Manifest). */
export const MAX_SIZE = { width: 1200, height: 1000 };

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, Math.round(value)));

const readSize = () => {
  try {
    const raw = localStorage.getItem(SIZE_KEY);
    if (!raw) return { ...MIN_SIZE };
    const parsed = JSON.parse(raw) as { width?: number; height?: number };
    return {
      width: clamp(
        parsed.width ?? MIN_SIZE.width,
        MIN_SIZE.width,
        MAX_SIZE.width
      ),
      height: clamp(
        parsed.height ?? MIN_SIZE.height,
        MIN_SIZE.height,
        MAX_SIZE.height
      )
    };
  } catch {
    return { ...MIN_SIZE };
  }
};

/** Bearbeiten-Modus der Stammfelder und die Größe des Popovers. */
export const useUiStore = defineStore("ui", () => {
  const editing = ref(false);
  const width = ref(MIN_SIZE.width);
  const height = ref(MIN_SIZE.height);

  let frame: number | undefined;

  const toggleEditing = () => {
    editing.value = !editing.value;
  };

  /** Setzt die Popover-Größe (gedrosselt auf einen Frame). */
  const applySize = () => {
    if (!OBR.isAvailable) return;
    if (frame !== undefined) cancelAnimationFrame(frame);
    frame = requestAnimationFrame(() => {
      frame = undefined;
      void OBR.action.setWidth(width.value);
      void OBR.action.setHeight(height.value);
    });
  };

  const initSize = () => {
    const size = readSize();
    width.value = size.width;
    height.value = size.height;
    applySize();
  };

  const resize = (nextWidth: number, nextHeight: number) => {
    width.value = clamp(nextWidth, MIN_SIZE.width, MAX_SIZE.width);
    height.value = clamp(nextHeight, MIN_SIZE.height, MAX_SIZE.height);
    applySize();
  };

  const persistSize = () => {
    localStorage.setItem(
      SIZE_KEY,
      JSON.stringify({ width: width.value, height: height.value })
    );
  };

  return {
    editing,
    toggleEditing,
    width,
    height,
    initSize,
    resize,
    persistSize
  };
});
