<template>
  <div class="resize-handle" aria-label="Größe ziehen" @pointerdown="start">
    <q-icon name="mdi-resize-bottom-right" size="18px" />
  </div>
</template>

<script setup lang="ts">
import { useUiStore } from "@/stores/ui";

const ui = useUiStore();

const start = (event: PointerEvent) => {
  event.preventDefault();
  const target = event.currentTarget as HTMLElement;
  const startX = event.clientX;
  const startY = event.clientY;
  const startWidth = ui.width;
  const startHeight = ui.height;
  target.setPointerCapture(event.pointerId);

  const move = (moveEvent: PointerEvent) => {
    ui.resize(
      startWidth + (moveEvent.clientX - startX),
      startHeight + (moveEvent.clientY - startY)
    );
  };
  const stop = () => {
    target.removeEventListener("pointermove", move);
    target.removeEventListener("pointerup", stop);
    target.removeEventListener("pointercancel", stop);
    ui.persistSize();
  };

  target.addEventListener("pointermove", move);
  target.addEventListener("pointerup", stop);
  target.addEventListener("pointercancel", stop);
};
</script>

<style scoped>
.resize-handle {
  position: fixed;
  right: 0;
  bottom: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: flex-end;
  justify-content: flex-end;
  cursor: nwse-resize;
  color: rgba(43, 33, 24, 0.55);
  z-index: 9999;
  touch-action: none;
  user-select: none;
}
</style>
