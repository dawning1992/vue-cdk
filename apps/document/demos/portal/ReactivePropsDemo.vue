<script setup lang="ts">
import {computed, getCurrentInstance, onBeforeUnmount, onMounted, reactive, ref} from 'vue';
import {ComponentPortal, DomPortalOutlet} from 'vue-cdk/portal';
import UserCard from './UserCard.vue';
import {useLocale} from '../../composables/useLocale';

const {locale} = useLocale();
const t = (zh: string, en: string) => locale.value === 'en-US' ? en : zh;

const appContext = getCurrentInstance()!.appContext;
const reactiveHost = ref<HTMLElement | null>(null);
const refHost = ref<HTMLElement | null>(null);
const computedHost = ref<HTMLElement | null>(null);
const getterHost = ref<HTMLElement | null>(null);
const outlets: DomPortalOutlet[] = [];

// reactive 适合原地修改；应直接传对象，展开后会失去顶层属性的追踪。
const reactiveProps = reactive({name: locale.value === 'en-US' ? 'Alex' : '小明', level: 1});
const reactivePortal = new ComponentPortal(UserCard, {props: reactiveProps});

// ref 适合替换整组输入；应传 ref 本身，传 .value 将无法追踪后续替换。
const refProps = ref({name: locale.value === 'en-US' ? 'Riley' : '小红', level: 1});
const refPortal = new ComponentPortal(UserCard, {props: refProps});

// computed 适合派生输入；保持 getter 纯净，不在其中修改状态。
const level = ref(1);
const computedProps = computed(() => ({name: t('派生用户', 'Derived user'), level: level.value * 2}));
const computedPortal = new ComponentPortal(UserCard, {props: computedProps});

// getter 适合组合多个响应式值；在 getter 内显式读取 .value。
const name = ref(locale.value === 'en-US' ? 'Jordan' : '小李');
const getterPortal = new ComponentPortal(UserCard, {
  props: () => ({name: name.value, level: level.value}),
});

onMounted(() => {
  const entries = [
    [reactiveHost.value, reactivePortal],
    [refHost.value, refPortal],
    [computedHost.value, computedPortal],
    [getterHost.value, getterPortal],
  ] as const;
  for (const [host, portal] of entries) {
    if (host) {
      const outlet = new DomPortalOutlet(host, {appContext});
      outlets.push(outlet);
      outlet.attach(portal);
    }
  }
});

onBeforeUnmount(() => {
  outlets.forEach(outlet => outlet.dispose());
});
</script>

<template>
  <div class="examples">
    <section class="example">
      <h4>{{ t('reactive：原地修改', 'reactive: mutate in place') }}</h4>
      <button class="doc-btn" type="button" @click="reactiveProps.level++">{{ t('等级 +1', 'Level +1') }}</button>
      <div ref="reactiveHost" />
    </section>
    <section class="example">
      <h4>{{ t('ref：整体替换', 'ref: replace the whole object') }}</h4>
      <button class="doc-btn" type="button" @click="refProps = {name: t('替换后的用户', 'Replacement user'), level: refProps.level + 1}">
        {{ t('替换 props 对象', 'Replace props object') }}
      </button>
      <div ref="refHost" />
    </section>
    <section class="example">
      <h4>{{ t('computed：派生输入', 'computed: derived input') }}</h4>
      <button class="doc-btn" type="button" @click="level++">{{ t(`基础等级 +1（当前 ${level}）`, `Base level +1 (current ${level})`) }}</button>
      <div ref="computedHost" />
    </section>
    <section class="example">
      <h4>{{ t('getter：组合输入', 'getter: combine inputs') }}</h4>
      <label>{{ t('姓名', 'Name') }} <input v-model="name" /></label>
      <div ref="getterHost" />
    </section>
    <p class="hint">
      {{ t('computed 与 getter 共用基础等级，点击按钮可观察两张卡片同步更新。更新后的 DOM 需等待 nextTick()；普通对象直接修改不会触发更新，对象内的 ref 不会逐项解包。detach/dispose 后停止追踪，再次挂载读取最新值。', 'computed and getter share the base level; click the button to see both cards update. Wait for nextTick() to read updated DOM. Mutating a plain object does not trigger updates, and refs inside the object are not individually unwrapped. Tracking stops after detach/dispose; remounting reads the latest values.') }}
    </p>
  </div>
</template>

<style scoped>
.examples {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 260px), 1fr));
  gap: 16px;
  width: 100%;
}

.example {
  display: grid;
  align-content: start;
  gap: 12px;
}

.example h4 {
  margin: 0;
}

.hint {
  grid-column: 1 / -1;
  margin: 0;
  color: var(--doc-muted);
  font-size: 13px;
  line-height: 1.7;
}
</style>
