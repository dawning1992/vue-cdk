<script setup lang="ts">
import {defineComponent, getCurrentInstance, h, inject, onBeforeUnmount, ref} from 'vue';
import {ComponentPortal, DomPortalOutlet} from 'vue-cdk/portal';

/**
 * 组件内容：props 传入数据，inject 读取 app 级 provide。
 * 内容经 ComponentPortal 挂载后仍能访问应用上下文提供的注入值。
 */
const UserCard = defineComponent({
  name: 'PortalUserCard',
  props: {
    name: {type: String, required: true},
    level: {type: Number, default: 1},
  },
  setup(props) {
    const appName = inject<string>('vue-cdk-doc-app', '未知应用');
    return () =>
      h('div', {class: 'portal-card'}, [
        h('p', {class: 'card-title'}, `你好，${props.name}`),
        h(
          'p',
          {class: 'card-meta'},
          `Lv.${props.level} · 应用级 provide：${appName}`,
        ),
      ]);
  },
});

const outletEl = ref<HTMLElement | null>(null);
const instanceInfo = ref('');
const mounted = ref(false);
let outlet: DomPortalOutlet | null = null;

/** 捕获当前应用上下文，使挂载内容可访问 app 级 provide。 */
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

.portal-card {
  padding: 10px 14px;
  background: #fff;
  border: 1px solid #e3e6ee;
  border-radius: 8px;
}

.card-title {
  margin: 0 0 4px;
  font-size: 14px;
  font-weight: 600;
}

.card-meta {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}

.result {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
