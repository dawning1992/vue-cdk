<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {useFocusMonitor, type FocusOrigin} from 'vue-cdk/a11y';

defineProps<{id?: string}>();

const monitor = useFocusMonitor();
const origins = ref<FocusOrigin[]>([]);
const lastOrigin = ref<FocusOrigin>(null);
const elementRef = ref<HTMLElement | null>(null);
const focusTarget = ref<HTMLElement | null>(null);
let stopSubscription: (() => void) | undefined;

// 组合式用法：元素就绪后订阅来源变化。
onMounted(() => {
  stopSubscription = monitor.monitor(elementRef).subscribe(origin => {
    lastOrigin.value = origin;
    origins.value = [...origins.value.slice(-4), origin];
  });
});

onBeforeUnmount(() => {
  stopSubscription?.();
});

/** v-focus-monitor 指令的回调：仅展示来源，便于模板内联观察。 */
function onChange(origin: FocusOrigin): void {
  void origin;
}

/** 用 focusVia 模拟指定来源的聚焦。 */
function focusAs(origin: FocusOrigin): void {
  monitor.focusVia(focusTarget, origin);
}
</script>

<template>
  <section :id="id" class="section">
    <h2>焦点来源<span class="badge">FocusMonitor</span></h2>
    <p class="desc">
      移植自 Angular CDK FocusMonitor：区分 mouse / keyboard / touch / program 四种来源，
      自动添加 <code>vcdk-mouse-focused</code>、<code>vcdk-keyboard-focused</code>、
      <code>vcdk-touch-focused</code>、<code>vcdk-program-focused</code> 类（样式见下方色标）。
    </p>

    <div class="demo-grid">
      <div class="demo-card">
        <h3>v-focus-monitor 指令</h3>
        <div class="monitor-stack">
          <input class="input" v-focus-monitor placeholder="鼠标/键盘点击试试" />
          <input class="input" v-focus-monitor placeholder="触发来源会改变描边颜色" />
        </div>
        <div class="legend">
          <span class="legend-key keyboard">键盘</span>
          <span class="legend-key mouse">鼠标</span>
          <span class="legend-key touch">触摸</span>
          <span class="legend-key program">程序</span>
        </div>
        <p class="hint">聚焦后按来源显示不同颜色的描边；失焦自动清除。</p>
      </div>

      <div class="demo-card">
        <h3>v-focus-monitor.subtree 子树监视</h3>
        <div class="subtree-box" v-focus-monitor.subtree>
          <input class="input" placeholder="子输入框 1" />
          <button class="btn">子按钮</button>
          <input class="input" placeholder="子输入框 2" />
        </div>
        <p class="hint">子树内任意元素聚焦，父容器都会被标记为聚焦。</p>
      </div>

      <div class="demo-card">
        <h3>focusVia 指定来源聚焦</h3>
        <div class="monitor-stack">
          <button ref="focusTarget" class="btn" v-focus-monitor="onChange">被聚焦按钮</button>
          <div class="monitor-row">
            <button class="btn" @click="focusAs('program')">program</button>
            <button class="btn" @click="focusAs('mouse')">mouse</button>
            <button class="btn" @click="focusAs('keyboard')">keyboard</button>
          </div>
        </div>
        <p class="hint">focusVia 用命令式方式模拟指定来源的聚焦。</p>
      </div>

      <div class="demo-card">
        <h3>useFocusMonitor 组合式</h3>
        <input ref="elementRef" class="input" placeholder="订阅来源变化" />
        <p class="hint">
          最近来源：<code>{{ lastOrigin ?? 'null' }}</code>；历史：
          {{ origins.join(' → ') || '（等待聚焦）' }}
        </p>
      </div>
    </div>
  </section>
</template>
