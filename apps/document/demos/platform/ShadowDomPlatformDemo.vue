<script setup lang="ts">
import {onBeforeUnmount, onMounted, ref, watch} from 'vue';
import {useLocale} from '../../composables/useLocale';
import {
  getEventTargetPierceShadowDom,
  getFocusedElementPierceShadowDom,
  getShadowRoot,
  supportsShadowDom,
} from 'vue-cdk/platform';

const host = ref<HTMLElement | null>(null);
const supported = supportsShadowDom();
const log = ref<string[]>([]);
const {locale} = useLocale();

function text(zh: string, en: string): string {
  return locale.value === 'en-US' ? en : zh;
}

function push(message: string): void {
  log.value.unshift(message);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

function mountShadowContent(): void {
  const el = host.value;
  if (!el || !supported) {
    return;
  }
  const shadow = el.shadowRoot ?? el.attachShadow({mode: 'open'});
  shadow.replaceChildren();
  shadow.innerHTML = `
    <style>
      .inner-btn { padding: 6px 12px; border: 1px solid #cbd5e1; border-radius: 6px; background: #fff; cursor: pointer; font-size: 13px; }
      .inner-input { padding: 5px 10px; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 13px; margin-left: 8px; }
    </style>
    <button class="inner-btn">${text('shadow 内按钮', 'Shadow button')}</button>
    <input class="inner-input" placeholder="${text('shadow 内输入框', 'Shadow input')}" />
  `;

  shadow.querySelector('.inner-btn')?.addEventListener('click', event => {
    const rawTarget = event.target as HTMLElement | null;
    const pierced = getEventTargetPierceShadowDom(event);
    push(
      `${text('按钮点击', 'Button click')}: event.target = ${rawTarget?.tagName}; ${text('穿透后', 'pierced')} target = ${(pierced as HTMLElement | null)?.tagName}`,
    );
  });

  shadow.querySelector('.inner-input')?.addEventListener('focus', () => {
    const focused = getFocusedElementPierceShadowDom();
    const root = focused ? getShadowRoot(focused) : null;
    push(
      `${text('输入框聚焦', 'Input focused')}: pierced activeElement = ${focused?.tagName}; getShadowRoot matched = ${root instanceof ShadowRoot}`,
    );
  });

  push(text('shadow DOM 已挂载（attachShadow open）', 'Shadow DOM mounted (attachShadow open)'));
}

onMounted(mountShadowContent);
watch(locale, () => {
  log.value = [];
  mountShadowContent();
});

function onHostClick(event: MouseEvent): void {
  const target = getEventTargetPierceShadowDom(event);
  push(`${text('宿主容器点击：穿透后', 'Host click: pierced')} target = ${(target as HTMLElement | null)?.tagName}`);
}

onBeforeUnmount(() => {
  host.value?.replaceChildren();
});
</script>

<template>
  <div class="wrap">
    <p v-if="!supported" class="hint">{{ text('当前环境不支持 Shadow DOM，无法演示穿透行为。', 'Shadow DOM is not supported in this environment, so boundary piercing cannot be demonstrated.') }}</p>
    <template v-else>
      <div ref="host" class="host" @click="onHostClick">
        <p class="host-fallback">{{ text('（Shadow DOM 挂载后此文本不可见）', '(This text is hidden after the Shadow DOM is mounted.)') }}</p>
      </div>
      <div class="doc-output">{{ log.join('\n') || text('点击 shadow 内按钮 / 聚焦输入框观察穿透结果', 'Click the Shadow button or focus the input to inspect boundary piercing.') }}</div>
      <p class="hint">
        {{ text('getEventTargetPierceShadowDom 经 composedPath 取最深层目标；getFocusedElementPierceShadowDom 穿透 shadowRoot.activeElement。', 'getEventTargetPierceShadowDom uses composedPath to find the deepest target; getFocusedElementPierceShadowDom traverses shadowRoot.activeElement.') }}
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
