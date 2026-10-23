<script setup lang="ts">
import {useLocale} from '../../composables/useLocale';
/** 命令式浮层内容的关闭回调；由创建浮层的父组件负责销毁 Overlay。 */
const props = defineProps<{
  onClose: () => void;
}>();
const {locale} = useLocale();
</script>

<template>
  <div class="content">
    <h3 class="title">{{ locale === 'en-US' ? 'Imperative overlay' : '命令式浮层' }}</h3>
    <p class="description">{{ locale === 'en-US' ? 'Created by useOverlay() and centered globally; click the backdrop or the button below to close.' : '由 useOverlay() 创建并全局居中；点击遮罩或下方按钮关闭。' }}</p>
    <div class="actions">
      <button type="button" class="doc-btn primary" @click="props.onClose">{{ locale === 'en-US' ? 'Close' : '关闭' }}</button>
    </div>
  </div>
</template>

<style scoped>
.content {
  min-width: 300px;
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
  margin: 0 0 18px;
  color: #6b7280;
  font-size: 13px;
}

.actions {
  display: flex;
  justify-content: flex-end;
}
</style>
