<script setup lang="ts">
import {getCurrentInstance, onBeforeUnmount, ref} from 'vue';
import {ComponentPortal, DomPortalOutlet} from 'vue-cdk/portal';
import UserCard from './UserCard.vue';

const outletEl = ref<HTMLElement | null>(null);
const instanceInfo = ref('');
const mounted = ref(false);
let outlet: DomPortalOutlet | null = null;

/** 捕获当前应用上下文，使挂载的 .vue 组件可访问 app 级 provide/inject。 */
const appContext = getCurrentInstance()!.appContext;

/** 挂载组件 Portal 到面板元素，挂载引用为组件公共实例。 */
function mountCard(): void {
  if (!outletEl.value || outlet?.hasAttached()) {
    return;
  }
  outlet ??= new DomPortalOutlet(outletEl.value, {appContext});
  const instance = outlet.attach(
    new ComponentPortal(UserCard, {props: {name: '小明', level: 7}}),
  );
  mounted.value = true;
  instanceInfo.value = `attach 返回实例：${typeof instance === 'object' ? 'ComponentPublicInstance' : instance}`;
}

/** 卸载内容但保留出口，可再次挂载。 */
function unmountCard(): void {
  outlet?.detach();
  mounted.value = false;
  instanceInfo.value = '已 detach，出口保留，可再次挂载';
}

onBeforeUnmount(() => {
  outlet?.dispose();
  outlet = null;
});
</script>

<template>
  <div class="wrap column">
    <div class="controls">
      <button type="button" class="doc-btn primary" :disabled="mounted" @click="mountCard">
        挂载组件 Portal
      </button>
      <button type="button" class="doc-btn" :disabled="!mounted" @click="unmountCard">
        卸载（detach）
      </button>
    </div>
    <div ref="outletEl" class="portal-outlet">
      <p v-if="!mounted" class="placeholder">出口空闲：点击「挂载组件 Portal」</p>
    </div>
    <p class="result">{{ instanceInfo || '—' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  gap: 14px;
}

.controls {
  display: flex;
  gap: 10px;
}

.portal-outlet {
  min-height: 74px;
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

.result {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
