<script setup lang="ts">
import {h, onBeforeUnmount, ref} from 'vue';
import {DomPortalOutlet, TemplatePortal} from 'vue-cdk/portal';

const outletEl = ref<HTMLElement | null>(null);
const statusInfo = ref('');
let outlet: DomPortalOutlet | null = null;

/** 模板 Portal：渲染函数接收上下文，attach 时传入的上下文可覆盖构造值。 */
const portal = new TemplatePortal<{status: 'fresh' | 'rotten'}>(
  ctx =>
    h('div', {class: 'portal-card'}, [
      h('strong', `香蕉状态：${ctx.status}`),
      h(
        'span',
        {class: ctx.status === 'fresh' ? 'fresh-tag' : 'rotten-tag'},
        ctx.status === 'fresh' ? '（新鲜，推荐食用）' : '（腐烂，请勿食用）',
      ),
    ]),
  {status: 'fresh'},
);

/** attach 时传入上下文覆盖构造上下文。 */
function attachWith(status: 'fresh' | 'rotten'): void {
  if (!outletEl.value) {
    return;
  }
  outlet ??= new DomPortalOutlet(outletEl.value);
  if (portal.isAttached) {
    portal.detach();
  }
  portal.attach(outlet, {status});
  statusInfo.value = `attach(outlet, {status: '${status}'}) 覆盖构造上下文`;
}

/** detach 会清空上下文。 */
function clearPortal(): void {
  if (portal.isAttached) {
    portal.detach();
  }
  statusInfo.value = `已 detach，portal.context 已清空（${portal.context}）`;
}

onBeforeUnmount(() => {
  outlet?.dispose();
  outlet = null;
});
</script>

<template>
  <div class="wrap column">
    <div class="controls">
      <button type="button" class="doc-btn primary" @click="attachWith('fresh')">
        以「新鲜」上下文挂载
      </button>
      <button type="button" class="doc-btn" @click="attachWith('rotten')">
        以「腐烂」上下文挂载
      </button>
      <button type="button" class="doc-btn" @click="clearPortal">卸载</button>
    </div>
    <div ref="outletEl" class="portal-outlet">
      <p v-if="!portal.isAttached" class="placeholder">出口空闲</p>
    </div>
    <p class="result">{{ statusInfo || '—' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  gap: 14px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.portal-outlet {
  min-height: 46px;
  padding: 12px 16px;
  border: 1px dashed var(--doc-border);
  border-radius: var(--doc-radius);
  background: var(--doc-card);
}

.placeholder {
  margin: 0;
  color: var(--doc-muted);
  font-size: 13px;
}

.portal-card {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e3e6ee;
  border-radius: 8px;
  font-size: 13px;
}

.fresh-tag {
  color: #16a34a;
  font-size: 12px;
}

.rotten-tag {
  color: #dc2626;
  font-size: 12px;
}

.result {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
