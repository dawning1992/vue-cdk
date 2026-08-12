<script setup lang="ts">
import {ref} from 'vue';
import type {ApiGroup} from '../api';
import ApiTable from './ApiTable.vue';
import DocTabs from './DocTabs.vue';

const props = defineProps<{
  /** 模块英文名。 */
  moduleName: string;
  /** 模块中文名。 */
  zhName: string;
  /** 模块介绍，展示在示例 tab 顶部。 */
  intro: string;
  /** API 文档 tab 的分组表格数据。 */
  apiGroups: readonly ApiGroup[];
}>();

/** 默认激活示例 tab；切换仅影响组件内状态，不写入路由。 */
const activeTab = ref('demo');
</script>

<template>
  <div class="module-page">
    <header class="module-head">
      <h2>
        {{ props.moduleName }}
        <span class="zh-name">{{ props.zhName }}</span>
      </h2>
      <p>{{ props.intro }}</p>
    </header>

    <DocTabs v-model="activeTab" />

    <!-- v-show 而非 v-if：切换 tab 时保持示例组件挂载，避免破坏其内部状态。 -->
    <div v-show="activeTab === 'demo'" class="tab-pane">
      <slot />
    </div>

    <div v-show="activeTab === 'api'" class="tab-pane">
      <ApiTable
        v-for="group in props.apiGroups"
        :key="group.title"
        :title="group.title"
        :rows="group.rows"
      />
    </div>
  </div>
</template>

<style scoped>
.module-head h2 {
  margin: 0 0 6px;
  font-size: 24px;
}

.zh-name {
  margin-left: 8px;
  font-size: 15px;
  font-weight: 500;
  color: var(--doc-muted);
}

.module-head p {
  margin: 0;
  color: var(--doc-muted);
  font-size: 14px;
}
</style>
