<script setup lang="ts">
import {ref} from 'vue';
import {
  STANDARD_DROPDOWN_BELOW_POSITIONS,
  VConnectedOverlay,
  VOverlayOrigin,
} from 'vue-cdk/overlay';

const open = ref(false);
const selected = ref('请选择');
const items = ['选项 A', '选项 B', '选项 C'];

/** 选择菜单项后更新按钮文案并关闭浮层。 */
function choose(item: string): void {
  selected.value = item;
  open.value = false;
}
</script>

<template>
  <div class="wrap">
    <VOverlayOrigin>
      <button type="button" class="doc-btn primary" @click="open = !open">
        {{ selected }} ▾
      </button>
      <VConnectedOverlay
        :open="open"
        :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
        @overlay-outside-click="open = false"
      >
        <ul class="menu">
          <li v-for="item in items" :key="item" @click="choose(item)">{{ item }}</li>
        </ul>
      </VConnectedOverlay>
    </VOverlayOrigin>
    <span class="hint">点击按钮开合菜单；点击外部区域自动关闭。</span>
  </div>
</template>

<style scoped>
.wrap {
  display: flex;
  align-items: center;
  gap: 14px;
}

.menu {
  list-style: none;
  margin: 0;
  padding: 4px;
  min-width: 150px;
  background: #fff;
  border: 1px solid var(--doc-border);
  border-radius: 8px;
  box-shadow: var(--doc-shadow);
}

.menu li {
  padding: 7px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.menu li:hover {
  background: var(--doc-primary-soft);
  color: var(--doc-primary);
}

.hint {
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
