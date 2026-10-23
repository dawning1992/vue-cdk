<script setup lang="ts">
import {ref} from 'vue';
import {provideDirectionality, type Direction} from 'vue-cdk/bidi';
import DirectionConsumer from './DirectionConsumer.vue';
import {useLocale} from '../../composables/useLocale';
const {locale} = useLocale();

const direction = ref<Direction>('ltr');
provideDirectionality(direction);
</script>

<template>
  <!-- provider 组件使用 Fragment，不额外要求方向宿主元素。 -->
  <button type="button" @click="direction = direction === 'ltr' ? 'rtl' : 'ltr'">
    {{ locale === 'en-US' ? 'Toggle Composition provider' : '切换 Composition provider' }}
  </button>
  <p>{{ locale === 'en-US' ? 'Descendant useDirectionality() reads: ' : '后代 useDirectionality() 读取到：' }}<DirectionConsumer /></p>
</template>

<style scoped>
button { padding: 6px 12px; cursor: pointer; }
</style>
