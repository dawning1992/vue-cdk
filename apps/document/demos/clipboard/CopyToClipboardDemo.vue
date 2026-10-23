<script setup lang="ts">
import {ref, watch} from 'vue';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const text = ref(locale.value === 'en-US' ? 'Click a button below to copy this text: the Vue CDK clipboard module.' : '点击下方按钮即可复制这段文本：Vue CDK clipboard 模块。');
const attempts = ref(3);
const copied = ref<boolean | null>(null);

watch(locale, value => {
  text.value = value === 'en-US'
    ? 'Click a button below to copy this text: the Vue CDK clipboard module.'
    : '点击下方按钮即可复制这段文本：Vue CDK clipboard 模块。';
});

function onCopied(successful: boolean): void {
  copied.value = successful;
}
</script>

<template>
  <div class="wrap">
    <label class="field">
      <span>{{ locale === 'en-US' ? 'Text to copy' : '待复制文本' }}</span>
      <textarea v-model="text" rows="4" class="doc-input" />
    </label>
    <label class="field">
      <span>{{ locale === 'en-US' ? 'Retry attempts (maximum 50)' : '重试次数（attempts，上限 50）' }}</span>
      <input v-model.number="attempts" type="number" min="1" max="50" class="doc-input" />
    </label>
    <div class="buttons">
      <button type="button" class="doc-btn primary" v-copy-to-clipboard="text">
        {{ locale === 'en-US' ? 'Shorthand copy (attempts=1 by default)' : '简写复制（默认 attempts=1）' }}
      </button>
      <button
        type="button"
        class="doc-btn"
        v-copy-to-clipboard="{text, attempts, onCopied}"
      >
        {{ locale === 'en-US' ? `Object copy (attempts=${attempts})` : `对象复制（attempts=${attempts}）` }}
      </button>
    </div>
    <p class="hint">
      {{ locale === 'en-US' ? 'Object-binding callback status: ' : '对象绑定回调状态：' }}{{ copied === null ? (locale === 'en-US' ? 'Not copied' : '未复制') : copied ? (locale === 'en-US' ? 'Copied' : '复制成功') : (locale === 'en-US' ? 'Copy failed' : '复制失败') }}
    </p>
    <label class="field">
      <span>{{ locale === 'en-US' ? 'Paste verification (use Ctrl/Cmd + V after copying)' : '粘贴验证区（复制后手动 Ctrl/Cmd + V 粘贴验证）' }}</span>
      <textarea class="doc-input" rows="3" :placeholder="locale === 'en-US' ? 'Paste here to verify' : '粘贴到这里验证'" />
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

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
</style>
