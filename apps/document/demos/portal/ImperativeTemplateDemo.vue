<script setup lang="ts">
import {onBeforeUnmount, ref, shallowRef} from 'vue';
import {DomPortalOutlet, TemplatePortal, TemplateRef, type TemplateRefHandle} from 'vue-cdk/portal';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

const outletEl = ref<HTMLElement | null>(null);
const statusInfo = ref('');
let outlet: DomPortalOutlet | null = null;

const tpl = shallowRef<TemplateRefHandle<{status: 'fresh' | 'rotten'}> | null>(null);
let portal: TemplatePortal<{status: 'fresh' | 'rotten'}> | null = null;

/** attach 时传入上下文覆盖构造上下文。 */
function attachWith(status: 'fresh' | 'rotten'): void {
  if (!outletEl.value || !tpl.value) {
    return;
  }
  portal ??= new TemplatePortal<{status: 'fresh' | 'rotten'}>(tpl.value, {status: 'fresh'});
  outlet ??= new DomPortalOutlet(outletEl.value);
  if (portal?.isAttached) {
    portal.detach();
  }
  portal.attach(outlet, {status});
  statusInfo.value = t(`attach(outlet, {status: '${status}'}) 覆盖构造上下文`, `attach(outlet, {status: '${status}'}) overrides constructor context`);
}

/** detach 会清空上下文。 */
function clearPortal(): void {
  if (portal?.isAttached) {
    portal.detach();
  }
  statusInfo.value = t(`已 detach，portal.context 已清空（${portal?.context}）`, `Detached; portal.context cleared (${portal?.context})`);
}

onBeforeUnmount(() => {
  outlet?.dispose();
  outlet = null;
});
</script>

<template>
  <TemplateRef ref="tpl" v-slot="{status}">
    <div class="portal-card">
      <strong>{{ t('香蕉状态：', 'Banana status: ') }}{{ status }}</strong>
      <span :class="status === 'fresh' ? 'fresh-tag' : 'rotten-tag'">
        {{ status === 'fresh' ? t('（新鲜，推荐食用）', '(Fresh, recommended)') : t('（腐烂，请勿食用）', '(Rotten, do not eat)') }}
      </span>
    </div>
  </TemplateRef>
  <div class="wrap column">
    <div class="controls">
      <button type="button" class="doc-btn primary" @click="attachWith('fresh')">
        {{ t('以「新鲜」上下文挂载', 'Attach with “fresh” context') }}
      </button>
      <button type="button" class="doc-btn" @click="attachWith('rotten')">
        {{ t('以「腐烂」上下文挂载', 'Attach with “rotten” context') }}
      </button>
      <button type="button" class="doc-btn" @click="clearPortal">{{ t('卸载', 'Detach') }}</button>
    </div>
    <div ref="outletEl" class="portal-outlet">
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
