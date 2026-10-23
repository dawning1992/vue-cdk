<script setup lang="ts">
import {computed} from 'vue';
import {useRouter} from 'vue-router';
import type {ApiAnchorGroup} from '../api';
import {linkify, scrollToAnchor, type AnchorResolver} from '../apis/anchors';
import {useLocale} from '../composables/useLocale';

const props = defineProps<{
  /** 分组锚点信息：标题、锚点、行数据与行锚点。 */
  group: ApiAnchorGroup;
  /** 提及链接解析函数：同页锚点优先，其次跨模块索引。 */
  resolveLink: AnchorResolver;
}>();

const router = useRouter();
const {locale, messages} = useLocale();
const hasDefaultValues = computed(() => props.group.items.some(({row}) => Boolean(row.default)));

/**
 * 表格内提及链接的委托点击：跨模块跳转走路由，同页锚点平滑滚动。
 * 使用事件委托是为了配合 v-html 生成的 <a>，避免为每个链接单独绑定。
 */
function onMentionClick(event: MouseEvent) {
  const target = event.target as HTMLElement | null;
  const link = target?.closest<HTMLAnchorElement>('a.api-mention[data-anchor]');
  if (!link) return;
  event.preventDefault();
  const {anchor, path} = link.dataset;
  if (!anchor) return;
  if (path) {
    router.push({path, hash: `#${anchor}`}).catch(() => undefined);
    return;
  }
  scrollToAnchor(anchor, router);
}
</script>

<template>
  <section class="api-table">
    <h3 :id="props.group.anchor">{{ locale === 'en-US' ? props.group.titleEn ?? props.group.title : props.group.title }}</h3>
    <div class="table-wrap" @click="onMentionClick">
      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>{{ locale === 'en-US' ? 'Signature' : '签名' }}</th>
            <th v-if="hasDefaultValues">{{ locale === 'en-US' ? 'Default' : '默认值' }}</th>
            <th :class="{'description-with-default': hasDefaultValues, 'description-without-default': !hasDefaultValues}">{{ locale === 'en-US' ? 'Description' : '说明' }}</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="item in props.group.items" :id="item.anchor" :key="item.anchor">
            <td class="cell-name"><code>{{ item.label }}</code></td>
            <td class="cell-signature">
              <code v-html="linkify(item.row.signature, props.resolveLink)"></code>
            </td>
            <td v-if="hasDefaultValues" class="cell-default"><code v-if="item.row.default">{{ item.row.default }}</code></td>
            <td class="cell-desc" v-html="linkify(locale === 'en-US' ? item.row.descriptionEn ?? messages.missingEnglishDescription : item.row.description, props.resolveLink)"></td>
          </tr>
        </tbody>
      </table>
    </div>
  </section>
</template>

<style scoped>
.api-table {
  background: var(--doc-card);
  border: 1px solid var(--doc-border);
  border-radius: var(--doc-radius);
  box-shadow: var(--doc-shadow);
  padding: 18px 20px;
  margin-bottom: 20px;
}

.api-table h3 {
  margin: 0 0 12px;
  font-size: 15px;
}

.table-wrap {
  overflow-x: auto;
}

table {
  width: 100%;
  table-layout: fixed;
  min-width: 720px;
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  border-bottom: 1px solid var(--doc-border);
  padding: 9px 12px;
  text-align: left;
  vertical-align: top;
  overflow-wrap: anywhere;
}

th {
  color: var(--doc-muted);
  font-weight: 600;
  white-space: nowrap;
}

/* 默认值列按分组动态显示；两种布局分别保证说明列获得剩余空间。 */
th:nth-child(1) {
  width: 20%;
}

th:nth-child(2) {
  width: 34%;
}

th:nth-child(3) {
  width: 8%;
}

th.description-with-default {
  width: 38%;
}

th.description-without-default {
  width: 46%;
}

tr:last-child td {
  border-bottom: none;
}

td code {
  font-size: 12px;
  background: var(--doc-primary-soft);
  border-radius: 4px;
  padding: 1px 5px;
  color: #33439e;
}

.cell-name {
  font-weight: 600;
}

.cell-default {
  overflow-wrap: anywhere;
}

.cell-desc {
  color: var(--doc-muted);
}

/* 锚点行与分组标题预留 sticky 顶栏高度，保证滚动后不被头部遮挡。 */
.api-table h3[id],
.api-table tr[id] {
  scroll-margin-top: 76px;
}

/* v-html 注入的提及链接不在模板作用域内，需要 :deep 才能命中 scoped 样式。 */
:deep(.api-mention) {
  color: var(--doc-primary);
  text-decoration: none;
  border-radius: 3px;
}

:deep(.api-mention:hover) {
  text-decoration: underline;
}

:deep(.api-mention:focus-visible) {
  outline: 2px solid var(--doc-primary);
  outline-offset: 2px;
}
</style>
