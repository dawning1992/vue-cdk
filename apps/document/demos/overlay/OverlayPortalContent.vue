<script setup lang="ts">
import type {Ref} from 'vue';
import {useLocale} from '../../composables/useLocale';

const props = defineProps<{
  clicks: Ref<number>;
  onClose: () => void;
}>();

const emit = defineEmits<{
  click: [];
}>();
const {locale} = useLocale();
</script>

<template>
  <div class="content">
    <h3 class="title">overlay + ComponentPortal</h3>
    <p class="description">{{ locale === 'en-US' ? 'Reactive state inside the component Portal: clicks ' : '组件 Portal 内的响应式状态：点击次数 ' }}{{ props.clicks }}</p>
    <div class="actions">
      <button type="button" class="doc-btn" @click="emit('click')">{{ locale === 'en-US' ? 'Record a click' : '记录一次点击' }}</button>
      <button type="button" class="doc-btn primary" @click="props.onClose">{{ locale === 'en-US' ? 'Close' : '关闭' }}</button>
    </div>
  </div>
</template>

<style scoped>
.content {
  min-width: 320px;
  padding: 22px 26px;
  background: #fff;
  border: 1px solid #e3e6ee;
  border-radius: 10px;
  box-shadow: 0 6px 20px rgba(31, 36, 48, 0.12);
}

.title {
  margin: 0 0 8px;
  font-size: 16px;
}

.description {
  margin: 0 0 16px;
  color: #6b7280;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}
</style>
