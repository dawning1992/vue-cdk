<script setup lang="ts">
import {ref} from 'vue';
import {provideDirectionality, type Direction} from 'vue-cdk/bidi';
import DirectionConsumer from './DirectionConsumer.vue';

const direction = ref<Direction>('ltr');
provideDirectionality(direction);
</script>

<template>
  <!-- provider 组件使用 Fragment，不额外要求方向宿主元素。 -->
  <button type="button" @click="direction = direction === 'ltr' ? 'rtl' : 'ltr'">
    切换 Composition provider
  </button>
  <p>后代 useDirectionality() 读取到：<DirectionConsumer /></p>
</template>

<style scoped>
button { padding: 6px 12px; cursor: pointer; }
</style>
