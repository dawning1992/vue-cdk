<script setup lang="ts">
import {computed, getCurrentInstance, onBeforeUnmount, onMounted, reactive, ref} from 'vue';
import {ComponentPortal, DomPortalOutlet} from 'vue-cdk/portal';
import UserCard from './UserCard.vue';

const appContext = getCurrentInstance()!.appContext;
const reactiveHost = ref<HTMLElement | null>(null);
const refHost = ref<HTMLElement | null>(null);
const computedHost = ref<HTMLElement | null>(null);
const getterHost = ref<HTMLElement | null>(null);
const outlets: DomPortalOutlet[] = [];

// reactive 适合原地修改；应直接传对象，展开后会失去顶层属性的追踪。
const reactiveProps = reactive({name: '小明', level: 1});
const reactivePortal = new ComponentPortal(UserCard, {props: reactiveProps});

// ref 适合替换整组输入；应传 ref 本身，传 .value 将无法追踪后续替换。
const refProps = ref({name: '小红', level: 1});
const refPortal = new ComponentPortal(UserCard, {props: refProps});

// computed 适合派生输入；保持 getter 纯净，不在其中修改状态。
const level = ref(1);
const computedProps = computed(() => ({name: '派生用户', level: level.value * 2}));
const computedPortal = new ComponentPortal(UserCard, {props: computedProps});

// getter 适合组合多个响应式值；在 getter 内显式读取 .value。
const name = ref('小李');
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
      <h4>reactive：原地修改</h4>
      <button class="doc-btn" type="button" @click="reactiveProps.level++">等级 +1</button>
      <div ref="reactiveHost" />
    </section>
    <section class="example">
      <h4>ref：整体替换</h4>
      <button class="doc-btn" type="button" @click="refProps = {name: '替换后的用户', level: refProps.level + 1}">
        替换 props 对象
      </button>
      <div ref="refHost" />
    </section>
    <section class="example">
      <h4>computed：派生输入</h4>
      <button class="doc-btn" type="button" @click="level++">基础等级 +1（当前 {{ level }}）</button>
      <div ref="computedHost" />
    </section>
    <section class="example">
      <h4>getter：组合输入</h4>
      <label>姓名 <input v-model="name" /></label>
      <div ref="getterHost" />
    </section>
    <p class="hint">
      computed 与 getter 共用基础等级，点击按钮可观察两张卡片同步更新。更新后的 DOM 需等待 nextTick()；
      普通对象直接修改不会触发更新，对象内的 ref 不会逐项解包。detach/dispose 后停止追踪，再次挂载读取最新值。
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
