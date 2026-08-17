<script setup lang="ts">
import {ref} from 'vue';
import {CdkAccordion, CdkAccordionItem, type CdkAccordionItemPublicApi} from 'vue-cdk/accordion';

const expanded = ref(false);
const item = ref<CdkAccordionItemPublicApi | null>(null);
</script>

<template>
  <div class="demo">
    <div class="actions">
      <button type="button" class="doc-btn primary" @click="item?.toggle()">通过实例 toggle()</button>
      <button type="button" class="doc-btn" @click="expanded = !expanded">直接修改 v-model</button>
    </div>
    <CdkAccordion>
      <CdkAccordionItem ref="item" v-model:expanded="expanded" v-slot="state" as="article" class="item">
        <button type="button" class="header" :aria-expanded="state.expanded" @click="state.toggle">
          受控项目：{{ expanded ? '已展开' : '已收起' }}
        </button>
        <p v-show="state.expanded" class="panel">命令式调用、插槽操作与 v-model 始终共享同一状态。</p>
      </CdkAccordionItem>
    </CdkAccordion>
  </div>
</template>

<style scoped>
.demo { width: 100%; }
.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.item { border: 1px solid var(--doc-border); border-radius: 8px; }
.header { width: 100%; padding: 12px; border: 0; background: white; text-align: left; cursor: pointer; }
.panel { margin: 0; padding: 0 12px 12px; color: var(--doc-muted); }
</style>

