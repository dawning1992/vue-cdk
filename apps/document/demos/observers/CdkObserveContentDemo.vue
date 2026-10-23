<script setup lang="ts">
import {ref} from 'vue';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const text = ref(locale.value === 'en-US' ? 'Initial content' : '初始内容');
const items = ref<string[]>([]);
const disabled = ref(false);
const eventCount = ref(0);
const lastTypes = ref('—');

function onContentChange(records: MutationRecord[]): void {
  eventCount.value += 1;
  lastTypes.value = records.map(record => record.type).join(', ');
}

function addItem(): void {
  items.value.push(locale.value === 'en-US' ? `Dynamic child ${items.value.length + 1}` : `动态子项 ${items.value.length + 1}`);
}
</script>

<template>
  <div class="demo-grid">
    <label class="field">
      <span>{{ locale === 'en-US' ? 'Edit observed text' : '修改被观察文本' }}</span>
      <input v-model="text" class="doc-input" />
    </label>
    <div class="controls">
      <button type="button" class="doc-btn" @click="addItem">{{ locale === 'en-US' ? 'Add child node' : '添加子节点' }}</button>
      <label><input v-model="disabled" type="checkbox" /> {{ locale === 'en-US' ? 'Pause observation' : '暂停观察' }}</label>
    </div>

    <div
      class="observed-box"
      v-cdk-observe-content="{callback: onContentChange, disabled, debounce: 100}"
    >
      <strong>{{ text }}</strong>
      <span v-for="item in items" :key="item">{{ item }}</span>
    </div>

    <p class="hint">{{ locale === 'en-US' ? 'Notifications:' : '通知次数：' }} {{ eventCount }}; {{ locale === 'en-US' ? 'last batch types:' : '最后一批类型：' }} {{ lastTypes }}</p>
  </div>
</template>

<style scoped>
.demo-grid { display: grid; gap: 12px; width: 100%; }
.field { display: grid; gap: 6px; color: var(--doc-muted); font-size: 13px; }
.controls { display: flex; align-items: center; gap: 16px; }
.observed-box { display: grid; gap: 6px; min-height: 72px; padding: 14px; border: 1px dashed var(--doc-border); border-radius: 8px; }
</style>
