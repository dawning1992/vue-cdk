<script setup lang="ts">
import {ref} from 'vue';

const text = ref('点击下方按钮即可复制这段文本：Vue CDK clipboard 模块。');
const attempts = ref(3);
const copied = ref<boolean | null>(null);

function onCopied(successful: boolean): void {
  copied.value = successful;
}
</script>

<template>
  <div class="wrap">
    <label class="field">
      <span>待复制文本</span>
      <textarea v-model="text" rows="4" class="doc-input" />
    </label>
    <label class="field">
      <span>重试次数（attempts，上限 50）</span>
      <input v-model.number="attempts" type="number" min="1" max="50" class="doc-input" />
    </label>
    <div class="buttons">
      <button type="button" class="doc-btn primary" v-copy-to-clipboard="text">
        简写复制（默认 attempts=1）
      </button>
      <button
        type="button"
        class="doc-btn"
        v-copy-to-clipboard="{text, attempts, onCopied}"
      >
        对象复制（attempts={{ attempts }}）
      </button>
    </div>
    <p class="hint">
      对象绑定回调状态：{{ copied === null ? '未复制' : copied ? '复制成功' : '复制失败' }}
    </p>
    <label class="field">
      <span>粘贴验证区（复制后手动 Ctrl/Cmd + V 粘贴验证）</span>
      <textarea class="doc-input" rows="3" placeholder="粘贴到这里验证" />
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
