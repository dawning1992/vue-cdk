<script setup lang="ts">
import {ref} from 'vue';
import {STANDARD_DROPDOWN_BELOW_POSITIONS, VConnectedOverlay, VOverlayOrigin} from 'vue-cdk/overlay';

defineProps<{id?: string}>();

const open = ref(false);
const selected = ref('React');
const items = ['Vue 3', 'React', 'Svelte', 'Solid'];

function choose(item: string) {
  selected.value = item;
  open.value = false;
}
</script>

<template>
  <section :id="id" class="section">
    <h2>下拉菜单<span class="badge">声明式 · 位置自动翻转</span></h2>
    <p class="desc">
      使用 <code>VOverlayOrigin</code> + <code>VConnectedOverlay</code>，候选位置放不下时自动向上翻转；
      点击面板外部或按 ESC 关闭。
    </p>
    <div class="stage">
      <VOverlayOrigin>
        <button class="btn primary" @click="open = !open">
          选择框架：{{ selected }} ▾
        </button>
        <VConnectedOverlay
          :open="open"
          :positions="STANDARD_DROPDOWN_BELOW_POSITIONS"
          panel-class="menu-panel"
          @backdrop-click="open = false"
          @overlay-outside-click="open = false"
          @update:open="open = $event"
        >
          <div class="panel">
            <div
              v-for="item in items"
              :key="item"
              class="menu-item"
              :class="{active: item === selected}"
              @click="choose(item)"
            >
              {{ item }}
            </div>
          </div>
        </VConnectedOverlay>
      </VOverlayOrigin>
    </div>
  </section>
</template>

<style scoped>
.menu-panel {
  min-width: 180px;
}
</style>
