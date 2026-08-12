<script setup lang="ts">
import {ref} from 'vue';

const enabled = ref(true);
</script>

<template>
  <div class="wrap">
    <label class="toggle">
      <input v-model="enabled" type="checkbox" />
      启用焦点陷阱
    </label>
    <!-- autoCapture：挂载时捕获焦点、卸载时恢复；绑定值控制启停。 -->
    <div v-focus-trap.autoCapture="enabled" class="trap-box" :class="{inert: !enabled}">
      <p class="tip">Tab 被限制在本区域内（包括首尾锚点）</p>
      <input class="doc-input" placeholder="输入框 A" />
      <input class="doc-input" placeholder="输入框 B" />
      <button type="button" class="doc-btn">内部按钮</button>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
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

.trap-box.inert .tip {
  color: var(--doc-muted);
}
</style>
