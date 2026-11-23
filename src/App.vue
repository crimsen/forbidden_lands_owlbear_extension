<template>
  <router-view />
</template>

<script setup lang="ts">
import { useBridgeStore } from "@/stores/bridge";

useBridgeStore().init();
</script>
