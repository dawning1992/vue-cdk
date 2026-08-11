<script setup lang="ts">
import {ref} from 'vue';
import {useFocusTrap} from 'vue-cdk/a11y';

defineProps<{id?: string}>();

// 场景一：指令 + autoCapture。
const open = ref(false);

// 场景二：enabled 开关。
const enabled = ref(true);

// 场景三：嵌套模态框（ConfigurableFocusTrap 栈管理）。
const outerOpen = ref(false);
const innerOpen = ref(false);
const outerRoot = ref<HTMLElement | null>(null);
const innerRoot = ref<HTMLElement | null>(null);
const outerTrap = useFocusTrap(outerRoot, {configurable: true, autoCapture: true});
const innerTrap = useFocusTrap(innerRoot, {configurable: true, autoCapture: true});

function openInner(): void {
  innerOpen.value = true;
}

function closeInner(): void {
  innerOpen.value = false;
}
</script>

<template>
  <section :id="id" class="section">
    <h2>焦点陷阱<span class="badge">FocusTrap</span></h2>
    <p class="desc">
      移植自 Angular CDK FocusTrap / ConfigurableFocusTrap：Tab 焦点被限制在区域内，
      锚点对视觉隐藏；autoCapture 在打开时捕获焦点、关闭时恢复。Esc 可关闭各模态框。
    </p>

    <div class="demo-grid">
      <div class="demo-card">
        <h3>v-focus-trap.autoCapture 模态框</h3>
        <button class="btn primary" @click="open = true">打开模态框</button>
        <p class="hint">打开后焦点被拉入框内，Tab 无法逃出；关闭后焦点回到触发按钮。</p>

        <div v-if="open" class="modal" v-focus-trap.autoCapture role="dialog" aria-modal="true">
          <h4>模态框</h4>
          <p class="hint">试试连续按 Tab，焦点始终留在框内。</p>
          <div class="modal-row">
            <input class="input" placeholder="第一个输入框" />
            <button class="btn">中间按钮</button>
            <input class="input" placeholder="第二个输入框" />
          </div>
          <div class="modal-row">
            <button class="btn primary" @click="open = false">关闭</button>
          </div>
        </div>
      </div>

      <div class="demo-card">
        <h3>enabled 开关（v-focus-trap）</h3>
        <label class="switch">
          <input v-model="enabled" type="checkbox" />
          启用陷阱
        </label>
        <div class="trap-box" v-focus-trap="enabled">
          <input class="input" placeholder="输入框 A" />
          <input class="input" placeholder="输入框 B" />
        </div>
        <p class="hint">
          关闭时锚点移出 Tab 顺序（移除 tabindex），焦点可以自由离开区域。
        </p>
      </div>

      <div class="demo-card">
        <h3>嵌套模态框（ConfigurableFocusTrap 栈）</h3>
        <button class="btn primary" @click="outerOpen = true">打开外层</button>
        <p class="hint">
          使用 useFocusTrap({ configurable: true })，FocusTrapManager 保证
          只有栈顶陷阱生效：打开内层时外层自动停用，关闭内层后恢复。
        </p>

        <div v-if="outerOpen" ref="outerRoot" class="modal" role="dialog" aria-modal="true">
          <h4>外层模态框</h4>
          <p class="hint">此层由 ConfigurableFocusTrap 管理。</p>
          <div class="modal-row">
            <button class="btn primary" @click="openInner">打开内层</button>
            <button class="btn" @click="outerTrap.focusInitial()">聚焦外层首个元素</button>
            <button class="btn" @click="outerOpen = false">关闭外层</button>
          </div>

          <div v-if="innerOpen" ref="innerRoot" class="modal inner" role="dialog" aria-modal="true">
            <h4>内层模态框</h4>
            <p class="hint">内层打开时外层陷阱自动停用。</p>
            <div class="modal-row">
              <button class="btn primary" @click="closeInner">关闭内层</button>
              <button class="btn" @click="innerTrap.focusInitial()">聚焦内层首个元素</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </section>
</template>
