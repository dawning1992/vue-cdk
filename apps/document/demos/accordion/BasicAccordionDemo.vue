<script setup lang="ts">
import {CdkAccordion, CdkAccordionItem} from 'vue-cdk/accordion';
</script>

<template>
  <CdkAccordion class="accordion">
    <CdkAccordionItem v-for="index in 3" :key="index" v-slot="item" class="item">
      <button
        :id="`basic-header-${index}`"
        type="button"
        class="header"
        :aria-expanded="item.expanded"
        :aria-controls="`basic-panel-${index}`"
        @click="item.toggle"
      >
        第 {{ index }} 项
        <span>{{ item.expanded ? '−' : '+' }}</span>
      </button>
      <div
        v-show="item.expanded"
        :id="`basic-panel-${index}`"
        role="region"
        :aria-labelledby="`basic-header-${index}`"
        class="panel"
      >
        默认是单选模式；展开本项会自动收起同组的其他项。
      </div>
    </CdkAccordionItem>
  </CdkAccordion>
</template>

<style scoped>
.accordion { width: 100%; border: 1px solid var(--doc-border); border-radius: 8px; overflow: hidden; }
.item + .item { border-top: 1px solid var(--doc-border); }
.header { width: 100%; padding: 12px 14px; border: 0; background: white; display: flex; justify-content: space-between; cursor: pointer; }
.panel { padding: 0 14px 14px; color: var(--doc-muted); }
</style>

