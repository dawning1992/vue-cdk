<script setup lang="ts">
import {getCurrentInstance, onBeforeUnmount, ref} from 'vue';
import {ComponentPortal, DomPortalOutlet} from 'vue-cdk/portal';
import UserCard from './UserCard.vue';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

const outletEl = ref<HTMLElement | null>(null);
const instanceInfo = ref('');
const mounted = ref(false);
const name = ref(locale.value === 'en-US' ? 'Alex' : '小明');
const level = ref(7);
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
    new ComponentPortal(UserCard, {props: () => ({name: name.value, level: level.value})}),
  );
  mounted.value = true;
  instanceInfo.value = t(`attach 返回实例：${typeof instance === 'object' ? 'ComponentPublicInstance' : instance}`, `attach returned: ${typeof instance === 'object' ? 'ComponentPublicInstance' : instance}`);
}

/** 卸载内容但保留出口，可再次挂载。 */
function unmountCard(): void {
  outlet?.detach();
  mounted.value = false;
  instanceInfo.value = t('已 detach，出口保留，可再次挂载', 'Detached; outlet remains available for another attachment');
}

onBeforeUnmount(() => {
  outlet?.dispose();
  outlet = null;
});
</script>

<template>
  <div class="wrap column">
    <div class="controls">
      <label>{{ t('姓名', 'Name') }} <input v-model="name" :aria-label="t('用户名', 'User name')" /></label>
      <label>{{ t('等级', 'Level') }} <input v-model.number="level" type="number" min="1" :aria-label="t('用户等级', 'User level')" /></label>
    </div>
    <p class="result">{{ t('修改姓名或等级会更新已挂载的组件；卸载后再次挂载使用最新值。', 'Changing the name or level updates the mounted component; remounting uses the latest values.') }}</p>
    <div class="controls">
      <button type="button" class="doc-btn primary" :disabled="mounted" @click="mountCard">
        {{ t('挂载组件 Portal', 'Attach component portal') }}
      </button>
      <button type="button" class="doc-btn" :disabled="!mounted" @click="unmountCard">
        {{ t('卸载（detach）', 'Detach') }}
      </button>
    </div>
    <div ref="outletEl" class="portal-outlet">
      <p v-if="!mounted" class="placeholder">{{ t('出口空闲：点击「挂载组件 Portal」', 'Outlet is idle: click “Attach component portal”') }}</p>
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
