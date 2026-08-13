<script setup lang="ts">
import {nextTick, ref, shallowRef} from 'vue';
import {
  VPortal,
  VPortalOutlet,
  type Portal,
  type PortalOutlet,
  type TemplatePortal,
} from 'vue-cdk/portal';

// 门户实例是类对象，shallowRef 避免模板 UnwrapRef 剥掉类私有成员导致类型丢失。
const first = shallowRef<{portal: TemplatePortal<unknown>} | null>(null);
const second = shallowRef<{portal: TemplatePortal<unknown>} | null>(null);
const outletRef = shallowRef<PortalOutlet | null>(null);
const activePortal = shallowRef<Portal<unknown> | null>(null);
const current = ref('甲');
const attachedInfo = ref('');

/** 通过 portal prop 声明式切换内容源。 */
function attachViaProp(source: 'first' | 'second'): void {
  activePortal.value = (source === 'first' ? first.value : second.value)?.portal ?? null;
}

/** 通过暴露的 attach 传入上下文（插槽 props），展示上下文通道。 */
function attachWithContext(): void {
  activePortal.value = null;
  nextTick(() => {
    first.value?.portal.attach(outletRef.value!, {data: '来自 attach 的上下文'});
  });
}

/** 卸载：同时覆盖 prop 路径与直接 attach 路径。 */
function detachAll(): void {
  activePortal.value = null;
  outletRef.value?.detach();
}

function onAttached(attachedRef: unknown): void {
  attachedInfo.value = `attached 事件载荷类型：${attachedRef ? typeof attachedRef : 'null'}`;
}
</script>

<template>
  <div class="wrap column">
    <div class="controls">
      <button type="button" class="doc-btn primary" @click="attachViaProp('first')">
        挂载源一（prop）
      </button>
      <button type="button" class="doc-btn" @click="attachViaProp('second')">
        挂载源二（prop）
      </button>
      <button type="button" class="doc-btn" @click="attachWithContext">
        以上下文挂载源一
      </button>
      <button type="button" class="doc-btn" @click="detachAll">卸载</button>
      <button type="button" class="doc-btn" @click="current = current === '甲' ? '乙' : '甲'">
        切换状态：{{ current }}
      </button>
    </div>
    <p class="tip">
      源一模板读取父级响应式状态：挂载后点击「切换状态」，出口内容会同步更新；
      插槽 props 即模板上下文。
    </p>

    <VPortal ref="first">
      <template #default="{data}">
        <div class="portal-card">源一：{{ current }} / 上下文 {{ data ?? '无' }}</div>
      </template>
    </VPortal>
    <VPortal ref="second">
      <template #default="{data}">
        <div class="portal-card">源二：{{ data ?? '无' }}</div>
      </template>
    </VPortal>

    <VPortalOutlet
      ref="outletRef"
      class="portal-outlet"
      tag="section"
      :portal="activePortal"
      @attached="onAttached"
    />
    <p class="result">{{ attachedInfo || '—' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  gap: 12px;
}

.controls {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.tip {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}

.portal-outlet {
  min-height: 46px;
  padding: 12px 16px;
  border: 1px dashed var(--doc-border);
  border-radius: var(--doc-radius);
  background: var(--doc-card);
}

.portal-card {
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e3e6ee;
  border-radius: 8px;
  font-size: 13px;
}

.result {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
