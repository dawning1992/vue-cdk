<script setup lang="ts">
import type {ApiRow} from '../api';

defineProps<{
  /** 分组标题，如「组合式函数」。 */
  title: string;
  /** 本分组的 API 行。 */
  rows: readonly ApiRow[];
}>();
</script>

<template>
  <section class="api-table">
    <h3>{{ title }}</h3>
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>API</th>
            <th>签名</th>
            <th>默认值</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="row in rows" :key="row.name">
            <td class="cell-name"><code>{{ row.name }}</code></td>
            <td class="cell-signature"><code>{{ row.signature }}</code></td>
            <td class="cell-default"><code v-if="row.default">{{ row.default }}</code></td>
            <td class="cell-desc">{{ row.description }}</td>
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
  border-collapse: collapse;
  font-size: 13px;
}

th,
td {
  border-bottom: 1px solid var(--doc-border);
  padding: 9px 12px;
  text-align: left;
  vertical-align: top;
}

th {
  color: var(--doc-muted);
  font-weight: 600;
  white-space: nowrap;
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
  word-break: break-all;
}

.cell-name {
  white-space: nowrap;
  font-weight: 600;
}

.cell-signature {
  max-width: 340px;
}

.cell-default {
  white-space: nowrap;
}

.cell-desc {
  color: var(--doc-muted);
  min-width: 260px;
}
</style>
