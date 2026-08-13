<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {useClipboard, type PendingCopy} from 'vue-cdk/clipboard';

const clipboard = useClipboard();
const text = ref('这段文本将通过 useClipboard() 命令式复制。');
const directStatus = ref('');
const retryStatus = ref('');
let pending: PendingCopy | null = null;
let retryTimer: ReturnType<typeof setTimeout> | null = null;

/** 直接复制：小文本的同步路径。 */
function copyDirectly(): void {
  const successful = clipboard.copy(text.value);
  directStatus.value = `clipboard.copy() 返回 ${successful}`;
}

/** 延迟复制：beginCopy 预加载后按 1s 间隔重试最多 3 次。 */
function copyWithRetry(): void {
  pending?.destroy();
  pending = clipboard.beginCopy(text.value);
  retryStatus.value = 'beginCopy() 已预加载，开始重试…';
  let remainingAttempts = 3;

  const attempt = (): void => {
    const successful = pending!.copy();
    if (!successful && --remainingAttempts) {
      retryTimer = setTimeout(attempt, 1000);
    } else {
      pending!.destroy();
      pending = null;
      retryStatus.value = `beginCopy 重试结束：${successful ? '复制成功' : '复制失败'}`;
    }
  };
  attempt();
}

onBeforeUnmount(() => {
  if (retryTimer) {
    clearTimeout(retryTimer);
  }
  pending?.destroy();
  pending = null;
});
</script>

<template>
  <div class="wrap">
    <label class="field">
      <span>待复制文本</span>
      <textarea v-model="text" rows="4" class="doc-input" />
    </label>
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="copyDirectly">
        clipboard.copy() 直接复制
      </button>
      <button type="button" class="doc-btn" @click="copyWithRetry">
        beginCopy() 延迟重试（最多 3 次）
      </button>
    </div>
    <p class="hint">{{ directStatus || '未执行直接复制' }}</p>
    <p class="hint">{{ retryStatus || '未执行延迟复制' }}</p>
    <label class="field">
      <span>粘贴验证区</span>
      <textarea class="doc-input" rows="3" placeholder="复制后粘贴到这里验证" />
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
