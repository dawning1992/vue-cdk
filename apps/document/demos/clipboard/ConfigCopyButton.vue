<script setup lang="ts">
import {ref} from 'vue';

const props = defineProps<{text: string}>();
const copied = ref<boolean | null>(null);

function onCopied(successful: boolean): void {
  copied.value = successful;
}
</script>

<template>
  <div class="config-copy">
    <button
      type="button"
      class="doc-btn primary"
      v-copy-to-clipboard="{text: props.text, onCopied}"
    >
      复制（未显式传 attempts）
    </button>
    <span class="hint">
      状态：{{ copied === null ? '未复制' : copied ? '复制成功' : '复制失败' }}
    </span>
  </div>
</template>

<style scoped>
.config-copy {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
}

.hint {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
