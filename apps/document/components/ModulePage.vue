<script setup lang="ts">
import {computed, onMounted, ref, watch} from 'vue';
import {useRoute, useRouter} from 'vue-router';
import type {ApiGroup} from '../api';
import {buildAnchorIndex, globalAnchorMap, scrollToAnchor, type AnchorTarget} from '../apis/anchors';
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

const route = useRoute();
const router = useRouter();

/** 当前页锚点索引：分组导航数据与「别名 → 行锚点」映射。 */
const anchorIndex = computed(() => buildAnchorIndex(props.apiGroups));

/**
 * 深链接或跨模块跳转带 hash 到达时默认进入 API 文档 tab；
 * 无 hash 时保持示例 tab，切换不写入路由。
 */
const activeTab = ref(route.hash ? 'api' : 'demo');

/** 提及别名解析：当前页定义优先，其次查跨模块全局索引。 */
function resolveLink(alias: string): AnchorTarget | null {
  const local = anchorIndex.value.aliases.get(alias);
  if (local) return {anchor: local};
  const target = globalAnchorMap.get(alias);
  return target ? {path: target.path, anchor: target.anchor} : null;
}

/** 右侧导航点击：同页平滑滚动并同步 URL hash。 */
function scrollToId(id: string) {
  scrollToAnchor(id, router);
}

// hash 变化（跨模块跳转、浏览器前进/后退）时确保 API 文档 tab 可见。
watch(
  () => route.hash,
  hash => {
    if (hash) activeTab.value = 'api';
  },
);

// 挂载时若带 hash（深链接或跨模块跳转），等一帧渲染完成后再滚动到目标锚点。
onMounted(() => {
  if (route.hash) {
    // 锚点 id 均为小写 slug，统一转小写后再查找，兼容手写/分享的 #VTree 形式。
    requestAnimationFrame(() => scrollToAnchor(route.hash.slice(1).toLowerCase(), router));
  }
});
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

    <div v-show="activeTab === 'api'" class="tab-pane api-pane">
      <div class="api-tables">
        <ApiTable
          v-for="group in anchorIndex.groups"
          :key="group.anchor"
          :group="group"
          :resolve-link="resolveLink"
        />
      </div>

      <!-- 右侧 API 索引：sticky 固定，点击分组标题或条目平滑滚动到对应锚点。 -->
      <nav class="api-nav" aria-label="API 索引">
        <p class="api-nav-title">API 索引</p>
        <div v-for="group in anchorIndex.groups" :key="`nav-${group.anchor}`" class="api-nav-group">
          <a
            class="api-nav-group-title"
            href="#"
            :aria-label="`跳转到分组「${group.title}」`"
            @click.prevent="scrollToId(group.anchor)"
          >
            {{ group.title }}
          </a>
          <ul>
            <li v-for="item in group.items" :key="item.anchor">
              <a
                class="api-nav-item"
                href="#"
                :aria-label="`跳转到 ${item.label}`"
                @click.prevent="scrollToId(item.anchor)"
              >
                {{ item.label }}
              </a>
            </li>
          </ul>
        </div>
      </nav>
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

/* API tab 双栏布局：左侧表格自适应，右侧导航 sticky 固定在视口内不随页面滚动。 */
.api-pane {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

.api-tables {
  flex: 1;
  min-width: 0;
}

.api-nav {
  flex: 0 0 200px;
  position: sticky;
  top: 76px;
  max-height: calc(100vh - 96px);
  overflow-y: auto;
  background: var(--doc-card);
  border: 1px solid var(--doc-border);
  border-radius: var(--doc-radius);
  box-shadow: var(--doc-shadow);
  padding: 14px 16px;
}

.api-nav-title {
  margin: 0 0 10px;
  font-size: 13px;
  font-weight: 700;
}

.api-nav-group {
  margin-bottom: 12px;
}

.api-nav-group-title {
  display: block;
  margin-bottom: 4px;
  font-size: 12px;
  font-weight: 600;
  color: var(--doc-text);
  text-decoration: none;
}

.api-nav-group-title:hover {
  color: var(--doc-primary);
}

.api-nav-group ul {
  list-style: none;
  margin: 0;
  padding: 0;
}

.api-nav-item {
  display: block;
  padding: 3px 8px;
  font-size: 12px;
  color: var(--doc-muted);
  text-decoration: none;
  border-radius: 6px;
}

.api-nav-item:hover {
  color: var(--doc-primary);
  background: var(--doc-primary-soft);
}

.api-nav-group-title:focus-visible,
.api-nav-item:focus-visible {
  outline: 2px solid var(--doc-primary);
  outline-offset: 2px;
}

/* 窄屏下让出空间给表格，导航隐藏后表格恢复整行宽度。 */
@media (max-width: 1120px) {
  .api-nav {
    display: none;
  }
}
</style>
