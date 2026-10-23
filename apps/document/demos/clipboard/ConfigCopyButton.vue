<script setup lang="ts">
import {ref} from 'vue';
import {useLocale} from '../../composables/useLocale';

const props = defineProps<{text: string}>();
const {locale} = useLocale();
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
      {{ locale === 'en-US' ? 'Copy (attempts omitted)' : '复制（未显式传 attempts）' }}
    </button>
    <span class="hint">
      {{ locale === 'en-US' ? 'Status: ' : '状态：' }}{{ copied === null ? (locale === 'en-US' ? 'Not copied' : '未复制') : copied ? (locale === 'en-US' ? 'Copied' : '复制成功') : (locale === 'en-US' ? 'Copy failed' : '复制失败') }}
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
