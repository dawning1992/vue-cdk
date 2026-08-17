<script setup lang="ts">
import {ref} from 'vue';
import {CdkAccordion, CdkAccordionItem, type CdkAccordionPublicApi} from 'vue-cdk/accordion';

const accordion = ref<CdkAccordionPublicApi | null>(null);
</script>

<template>
  <div class="demo">
    <div class="actions">
      <button type="button" class="doc-btn primary" @click="accordion?.openAll()">全部展开</button>
      <button type="button" class="doc-btn" @click="accordion?.closeAll()">全部收起</button>
    </div>
    <CdkAccordion ref="accordion" multi class="accordion">
      <CdkAccordionItem v-for="index in 3" :key="index" v-slot="item" :disabled="index === 3" class="item">
        <button type="button" class="header" :disabled="item.disabled" :aria-expanded="item.expanded" @click="item.toggle">
          选项 {{ index }}{{ item.disabled ? '（禁用）' : '' }}
        </button>
        <p v-show="item.expanded" class="panel">第 {{ index }} 项内容</p>
      </CdkAccordionItem>
    </CdkAccordion>
  </div>
</template>

<style scoped>
.demo, .accordion { width: 100%; }
.actions { display: flex; gap: 8px; margin-bottom: 12px; }
.item { border-bottom: 1px solid var(--doc-border); }
.header { width: 100%; padding: 10px; border: 0; text-align: left; background: white; cursor: pointer; }
.header:disabled { color: var(--doc-muted); cursor: not-allowed; }
.panel { margin: 0; padding: 0 10px 10px; color: var(--doc-muted); }
</style>

