<script setup lang="ts">
import {useLocale} from '../../composables/useLocale';

defineProps<{onClose: () => void}>();
const {locale} = useLocale();
</script>

<template>
  <div class="connected-panel">
    <strong>{{ locale === 'en-US' ? 'Connected positioning panel' : '连接定位面板' }}</strong>
    <p>{{ locale === 'en-US' ? 'The candidate position flips when space is insufficient; push brings it back into the viewport, and flexible allows the panel to shrink.' : '候选位置放不下时自动翻转；开启 push 后回推回屏，开启 flexible 后可压缩尺寸。' }}</p>
    <button type="button" class="doc-btn primary" @click="onClose">{{ locale === 'en-US' ? 'Close' : '关闭' }}</button>
  </div>
</template>

<style scoped>
.connected-panel { min-width: 220px; padding: 16px 18px; background: #fff; border: 1px solid #e3e6ee; border-radius: 10px; box-shadow: 0 6px 20px rgba(31, 36, 48, 0.12); }
.connected-panel strong { display: block; margin-bottom: 6px; font-size: 14px; }
.connected-panel p { margin: 0 0 12px; color: #6b7280; font-size: 12px; }
</style>
