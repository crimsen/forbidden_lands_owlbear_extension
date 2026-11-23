<template>
  <router-view />
</template>

<script setup lang="ts">
import { useBridgeStore } from "@/stores/bridge";
import { useUiStore } from "@/stores/ui";

useBridgeStore().init();
useUiStore().initSize();
</script>
