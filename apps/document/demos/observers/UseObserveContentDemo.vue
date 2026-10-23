<script setup lang="ts">
import {ref} from 'vue';
import {useObserveContent} from 'vue-cdk/observers';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const target = ref<HTMLElement | null>(null);
const content = ref('Composition API observation target');
const count = ref(0);

useObserveContent(target, records => {
  count.value += records.length;
});
</script>

<template>
  <div class="demo-grid">
    <input v-model="content" class="doc-input" :aria-label="locale === 'en-US' ? 'Edit observed text' : '修改观察目标文本'" />
    <div ref="target" class="observed-box">{{ content }}</div>
    <p class="hint">{{ locale === 'en-US' ? 'Total MutationRecord count:' : '累计 MutationRecord 数：' }} {{ count }}</p>
  </div>
</template>

<style scoped>
.demo-grid { display: grid; gap: 12px; width: 100%; }
.observed-box { padding: 14px; border: 1px dashed var(--doc-border); border-radius: 8px; }
</style>
