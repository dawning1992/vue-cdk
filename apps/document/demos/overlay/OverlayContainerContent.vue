<script setup lang="ts">
import {useLocale} from '../../composables/useLocale';

defineProps<{onClose: () => void}>();
const {locale} = useLocale();
</script>

<template>
  <div class="content">
    <h3>{{ locale === 'en-US' ? 'Overlay inside a region' : '区域内的浮层' }}</h3>
    <p>{{ locale === 'en-US' ? 'This panel is mounted in a custom div container and positioned within that region.' : '本面板挂载在自定义 div 容器中，定位范围被限制在该区域内。' }}</p>
    <div class="actions"><button type="button" class="doc-btn primary" @click="onClose">{{ locale === 'en-US' ? 'Close' : '关闭' }}</button></div>
  </div>
</template>

<style scoped>
.content { min-width: 240px; padding: 18px 22px; background: #fff; border: 1px solid #e3e6ee; border-radius: 10px; box-shadow: 0 6px 20px rgba(31, 36, 48, 0.12); }
.content h3 { margin: 0 0 8px; font-size: 16px; }
.content p { margin: 0 0 16px; color: #6b7280; font-size: 13px; }
.actions { display: flex; justify-content: flex-end; }
</style>
