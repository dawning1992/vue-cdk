<script setup lang="ts">
import {ref} from 'vue';
import ConfigProvider from './ConfigProvider.vue';

const text = ref('这段文本由 provide 配置区域内的指令复制。');
</script>

<template>
  <div class="wrap">
    <label class="field">
      <span>待复制文本</span>
      <textarea v-model="text" rows="3" class="doc-input" />
    </label>
    <ConfigProvider :text="text" />
    <label class="field">
      <span>粘贴验证区</span>
      <textarea class="doc-input" rows="2" placeholder="复制后粘贴到这里验证" />
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
