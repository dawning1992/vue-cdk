<script setup lang="ts">
import {onBeforeUnmount, ref} from 'vue';
import {
  focusTrapFactory,
  useFocusTrap,
  type FocusTrap,
} from 'vue-cdk/a11y';

const box = ref<HTMLElement | null>(null);
const trap = ref<FocusTrap | null>(null);
const factoryEnabled = ref(true);
const factoryLog = ref('尚未创建陷阱');

function createTrap(): void {
  destroyTrap();
  if (!box.value) {
    return;
  }
  trap.value = focusTrapFactory.create(box.value, false);
  trap.value.enabled = factoryEnabled.value;
  factoryLog.value = `focusTrapFactory.create() 已创建，enabled = ${trap.value.enabled}`;
}

function destroyTrap(): void {
  trap.value?.destroy();
  trap.value = null;
  factoryLog.value = '已销毁：锚点移除、全局监听清理';
}

function toggleFactory(): void {
  if (trap.value) {
    trap.value.enabled = factoryEnabled.value;
    factoryLog.value = `enabled 已更新为 ${trap.value.enabled}`;
  }
}

// 组合式形态：autoCapture 在挂载时捕获焦点、卸载时恢复。
const area = ref<HTMLElement | null>(null);
const {
  enabled: useEnabled,
  focusInitial,
  focusFirst,
  focusLast,
  destroy: destroyUseTrap,
} = useFocusTrap(area, {autoCapture: true});

onBeforeUnmount(() => {
  destroyTrap();
  destroyUseTrap();
});
</script>

<template>
  <div class="wrap">
    <div class="section">
      <h4>focusTrapFactory 命令式</h4>
      <div ref="box" class="trap-box">
        <input class="doc-input" placeholder="输入框 A" />
        <input class="doc-input" placeholder="输入框 B" />
        <button type="button" class="doc-btn">内部按钮</button>
      </div>
      <div class="buttons">
        <button type="button" class="doc-btn primary" @click="createTrap">创建并启用</button>
        <label class="toggle">
          <input v-model="factoryEnabled" type="checkbox" @change="toggleFactory" />
          enabled
        </label>
        <button type="button" class="doc-btn" @click="destroyTrap">销毁</button>
      </div>
      <p class="log">{{ factoryLog }}</p>
    </div>

    <div class="section">
      <h4>useFocusTrap 组合式</h4>
      <div ref="area" class="trap-box">
        <input class="doc-input" placeholder="输入框 A" />
        <input class="doc-input" placeholder="输入框 B" />
        <button type="button" class="doc-btn">内部按钮</button>
      </div>
      <div class="buttons">
        <label class="toggle">
          <input v-model="useEnabled" type="checkbox" />
          enabled（双向同步）
        </label>
        <button type="button" class="doc-btn" @click="() => focusInitial()">focusInitial</button>
        <button type="button" class="doc-btn" @click="() => focusFirst()">focusFirst</button>
        <button type="button" class="doc-btn" @click="() => focusLast()">focusLast</button>
        <button type="button" class="doc-btn" @click="destroyUseTrap">destroy</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.section {
  margin-bottom: 18px;
}

.section h4 {
  margin: 0 0 10px;
  font-size: 14px;
}

.trap-box {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  align-items: center;
  padding: 14px;
  border: 1px solid var(--doc-primary);
  border-radius: 8px;
  background: var(--doc-primary-soft);
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px;
  margin-top: 10px;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: var(--doc-muted);
}

.log {
  margin: 8px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
