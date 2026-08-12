<script setup lang="ts">
import {ref} from 'vue';

const enabled = ref(true);
const mounted = ref(true);
</script>

<template>
  <div class="wrap">
    <div class="controls">
      <label class="toggle">
        <input v-model="enabled" type="checkbox" />
        启用焦点陷阱
      </label>
      <button type="button" class="doc-btn" @click="mounted = !mounted">
        {{ mounted ? '卸载区域（观察焦点恢复）' : '重新挂载（观察捕获）' }}
      </button>
    </div>
    <!-- autoCapture：挂载时捕获焦点、卸载时恢复；绑定值控制启停。 -->
    <div
      v-if="mounted"
      v-focus-trap.autoCapture="enabled"
      class="trap-box"
      :class="{inert: !enabled}"
    >
      <p class="tip">Tab 被限制在本区域内（包括首尾锚点）</p>
      <input class="doc-input" placeholder="输入框 A" />
      <input class="doc-input" placeholder="输入框 B" />
      <button type="button" class="doc-btn">内部按钮</button>
    </div>
    <p v-else class="tip dim">区域已卸载：autoCapture 会把焦点恢复到卸载前的元素。</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--doc-muted);
}

.trap-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 16px;
  border: 1px solid var(--doc-primary);
  border-radius: 8px;
  background: var(--doc-primary-soft);
}

.trap-box.inert {
  border-color: var(--doc-border);
  background: #fafbfe;
}

.tip {
  width: 100%;
  margin: 0 0 4px;
  font-size: 12px;
  color: var(--doc-primary);
}

.tip.dim {
  color: var(--doc-muted);
}

.trap-box.inert .tip {
  color: var(--doc-muted);
}
</style>
