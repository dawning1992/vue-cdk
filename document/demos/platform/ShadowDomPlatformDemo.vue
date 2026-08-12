<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref} from 'vue';
import {
  getEventTargetPierceShadowDom,
  getFocusedElementPierceShadowDom,
  getShadowRoot,
  supportsShadowDom,
} from 'vue-cdk/platform';

const host = ref<HTMLElement | null>(null);
const supported = supportsShadowDom();
const log = ref<string[]>([]);

function push(message: string): void {
  log.value.unshift(message);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

onMounted(() => {
  const el = host.value;
  if (!el || !supported) {
    return;
  }
  const shadow = el.attachShadow({mode: 'open'});
  shadow.innerHTML = `
    <style>
      .inner-btn { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
      .inner-input { padding: 5px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; margin-left: 8px; }
    </style>
    <button class="inner-btn">shadow 内按钮</button>
    <input class="inner-input" placeholder="shadow 内输入框" />
  `;

  shadow.querySelector('.inner-btn')?.addEventListener('click', event => {
    const rawTarget = event.target as HTMLElement | null;
    const pierced = getEventTargetPierceShadowDom(event);
    push(
      `按钮点击：event.target = ${rawTarget?.tagName}；穿透后 target = ${(pierced as HTMLElement | null)?.tagName}`,
    );
  });

  shadow.querySelector('.inner-input')?.addEventListener('focus', () => {
    const focused = getFocusedElementPierceShadowDom();
    const root = focused ? getShadowRoot(focused) : null;
    push(
      `输入框聚焦：穿透 activeElement = ${focused?.tagName}；getShadowRoot 命中 = ${root instanceof ShadowRoot}`,
    );
  });

  push('shadow DOM 已挂载（attachShadow open）');
});

function onHostClick(event: MouseEvent): void {
  const target = getEventTargetPierceShadowDom(event);
  push(`宿主容器点击：穿透后 target = ${(target as HTMLElement | null)?.tagName}`);
}

onBeforeUnmount(() => {
  host.value?.replaceChildren();
});
</script>

<template>
  <div class="wrap">
    <p v-if="!supported" class="hint">当前环境不支持 Shadow DOM，无法演示穿透行为。</p>
    <template v-else>
      <div ref="host" class="host" @click="onHostClick">
        <p class="host-fallback">（Shadow DOM 挂载后此文本不可见）</p>
      </div>
      <div class="doc-output">{{ log.join('\n') || '点击 shadow 内按钮 / 聚焦输入框观察穿透结果' }}</div>
      <p class="hint">
        getEventTargetPierceShadowDom 经 composedPath 取最深层目标；getFocusedElementPierceShadowDom 穿透 shadowRoot.activeElement。
      </p>
    </template>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.host {
  min-height: 60px;
  padding: 14px;
  border: 1px dashed var(--doc-border);
  border-radius: 8px;
  background: #fafbfe;
}

.host-fallback {
  margin: 0;
  color: var(--doc-muted);
  font-size: 12px;
}

.hint {
  margin: 10px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
