<script setup lang="ts">
import {ref, watch} from 'vue';
import ConfigProvider from './ConfigProvider.vue';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const text = ref(locale.value === 'en-US' ? 'This text is copied by a directive inside the provide configuration subtree.' : '这段文本由 provide 配置区域内的指令复制。');

watch(locale, value => {
  text.value = value === 'en-US'
    ? 'This text is copied by a directive inside the provide configuration subtree.'
    : '这段文本由 provide 配置区域内的指令复制。';
});
</script>

<template>
  <div class="wrap">
    <label class="field">
      <span>{{ locale === 'en-US' ? 'Text to copy' : '待复制文本' }}</span>
      <textarea v-model="text" rows="3" class="doc-input" />
    </label>
    <ConfigProvider :text="text" />
    <label class="field">
      <span>{{ locale === 'en-US' ? 'Paste verification' : '粘贴验证区' }}</span>
      <textarea class="doc-input" rows="2" :placeholder="locale === 'en-US' ? 'Paste here after copying' : '复制后粘贴到这里验证'" />
    </label>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
  display: grid;
  gap: 12px;
}

.field {
  display: grid;
  gap: 6px;
  font-size: 13px;
  color: var(--doc-muted);
}
</style>
