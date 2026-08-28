<script setup lang="ts">
import {h, onBeforeUnmount, ref, type VNode} from 'vue';
import {useDialog, type DialogRef} from 'vue-cdk/dialog';
import {overlayPositionBuilder} from 'vue-cdk/overlay';

// 对话框内容经渲染函数 h() 在 overlay 中渲染，不参与本组件 scoped 样式，
// 因此统一使用内联样式，避免样式作用域丢失导致布局错乱。
const contentStyle = {padding: '20px 24px', minWidth: '320px'};
const headingStyle = {margin: '0 0 8px', fontSize: '16px'};
const descStyle = {margin: '0 0 14px', color: '#6b7280', fontSize: '13px'};
const readoutBoxStyle = {
  margin: '0 0 14px',
  padding: '10px 12px',
  borderRadius: '6px',
  background: '#0f172a',
  color: '#e2e8f0',
  fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace',
  fontSize: '12px',
  lineHeight: '1.7',
};
const readoutLineStyle = {margin: '2px 0'};
const buttonRowStyle = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: '8px',
  justifyContent: 'flex-end',
};

const dialog = useDialog();
const openDialogs = ref<readonly DialogRef[]>([]);
const log = ref<string[]>([]);
const queryResult = ref('');

type DialogId = 'dialog-a' | 'dialog-b' | 'dialog-c';

/** 各层对话框的展示信息；next 表示该对话框内可继续打开的下一层。 */
const dialogMeta: Record<DialogId, {title: string; desc: string; next?: DialogId}> = {
  'dialog-a': {
    title: '对话框 A',
    desc: '在对话框内继续打开 B，观察共享遮罩如何插在两层窗口之间并遮住下层。',
    next: 'dialog-b',
  },
  'dialog-b': {
    title: '对话框 B',
    desc: '再打开无遮罩的 C，观察共享遮罩沉到所有对话框之下、C 浮在遮罩之上。',
    next: 'dialog-c',
  },
  'dialog-c': {
    title: '对话框 C（无遮罩）',
    desc: 'hasBackdrop=false：自身不参与共享遮罩，直接浮在遮罩之上。',
  },
};

/**
 * 各层对话框的打开位置：按打开顺序向右下阶梯错开，
 * 让多层窗口与共享遮罩的层级关系可见，而不是完全重叠。
 */
const dialogPositions: Record<
  DialogId,
  () => ReturnType<typeof overlayPositionBuilder.global>
> = {
  'dialog-a': () => overlayPositionBuilder.global().centerHorizontally().centerVertically(),
  'dialog-b': () =>
    overlayPositionBuilder.global().centerHorizontally('72px').centerVertically('56px'),
  'dialog-c': () =>
    overlayPositionBuilder.global().centerHorizontally('144px').centerVertically('112px'),
};

/** 单个对话框的层级信息，供对话框内实时读取。 */
interface DialogLayerInfo {
  id: string;
  zIndex: string;
  isTop: boolean;
  hasBackdrop: boolean;
}

/** 共享遮罩与层级数据快照。 */
interface StackInfo {
  backdropCount: number;
  backdropZIndex: string;
  renderMode: string;
  dialogs: DialogLayerInfo[];
}

const stackInfo = ref<StackInfo>({
  backdropCount: 0,
  backdropZIndex: '',
  renderMode: '',
  dialogs: [],
});

function push(message: string): void {
  log.value.unshift(`[${new Date().toLocaleTimeString()}] ${message}`);
  if (log.value.length > 6) {
    log.value.pop();
  }
}

/** 从真实 DOM 与打开栈收集共享遮罩数量、z-index 与渲染模式。 */
function collectStackInfo(): void {
  const backdrops = document.querySelectorAll('.vcdk-overlay-backdrop');
  const backdrop = backdrops[0] as HTMLElement | undefined;
  const openList = dialog.openDialogs;
  const top = openList[openList.length - 1];
  stackInfo.value = {
    backdropCount: backdrops.length,
    backdropZIndex: backdrop?.style.zIndex ?? '',
    renderMode: top?.overlayRef.getConfig().usePopover
      ? '原生 popover（top-layer 顺序层叠）'
      : '容器渲染（z-index 插层）',
    dialogs: openList.map((ref, index) => ({
      id: ref.id,
      zIndex: ref.overlayRef.hostElement.style.zIndex,
      isTop: index === openList.length - 1,
      hasBackdrop: ref.config.hasBackdrop !== false,
    })),
  };
}

function refreshStack(): void {
  openDialogs.value = dialog.openDialogs;
  collectStackInfo();
}

/**
 * 渲染共享遮罩与层级的实时读条。
 * 读取 stackInfo ref 后，任何一层打开/关闭都会驱动所有已打开对话框的内容重新渲染。
 */
function renderStackReadout(): VNode {
  const info = stackInfo.value;
  const lines: VNode[] = info.dialogs.map(layer => {
    const tag = layer.hasBackdrop ? layer.id : `${layer.id}（无遮罩）`;
    return h(
      'div',
      {style: readoutLineStyle},
      [
        h('span', {style: {color: '#f59e0b'}}, tag),
        ` z = ${layer.zIndex} `,
        layer.isTop ? '（顶层）' : '（下层）',
      ],
    );
  });
  if (info.backdropCount) {
    lines.push(
      h(
        'div',
        {style: {...readoutLineStyle, color: '#f8fafc'}},
        `共享遮罩 z = ${info.backdropZIndex}（全站仅 ${info.backdropCount} 个遮罩元素）`,
      ),
    );
  }
  lines.push(h('div', {style: {...readoutLineStyle, opacity: 0.65}}, `渲染：${info.renderMode}`));
  return h('div', {style: readoutBoxStyle}, lines);
}

/** 打开指定 id 的对话框；内容为渲染函数，关闭时返回自身 id。 */
function openDialog(id: DialogId): void {
  const meta = dialogMeta[id];
  const dialogRef = dialog.open(
    (ctx: Record<string, unknown>) =>
      h('div', {style: contentStyle}, [
        h('h3', {style: headingStyle}, meta.title),
        h('p', {style: descStyle}, meta.desc),
        renderStackReadout(),
        h('div', {style: buttonRowStyle}, [
          ...(meta.next
            ? [
                h(
                  'button',
                  {
                    class: 'doc-btn primary',
                    onClick: () => openDialog(meta.next as DialogId),
                  },
                  `打开${dialogMeta[meta.next].title}`,
                ),
              ]
            : []),
          h(
            'button',
            {
              class: 'doc-btn',
              onClick: () => (ctx.dialogRef as DialogRef).close(id),
            },
            '关闭本层',
          ),
          h(
            'button',
            {
              class: 'doc-btn',
              onClick: () => dialog.closeAll(),
            },
            'closeAll',
          ),
        ]),
      ]),
    {
      id,
      panelClass: 'doc-dialog-panel',
      positionStrategy: dialogPositions[id](),
      ...(id === 'dialog-c' ? {hasBackdrop: false} : {}),
    },
  );
  dialogRef.closed.subscribe(value => {
    push(`closed：${String(value)}`);
    refreshStack();
  });
  refreshStack();
  push(`opened：${id}`);
}

function closeAll(): void {
  dialog.closeAll();
  push('closeAll：按 LIFO 依次关闭');
}

function queryById(): void {
  const ref = dialog.getDialogById('dialog-a');
  queryResult.value = ref ? `找到 dialog-a（id=${ref.id}）` : 'dialog-a 未打开';
}

// 订阅服务级事件流：afterOpened / afterAllClosed（注意 afterAllClosed 在无打开对话框时立即触发一次）。
const unsubscribeOpened = dialog.afterOpened.subscribe(ref => push(`afterOpened：${ref.id}`));
const unsubscribeAllClosed = dialog.afterAllClosed.subscribe(() => {
  push('afterAllClosed：全部对话框已关闭');
  refreshStack();
});

onBeforeUnmount(() => {
  unsubscribeOpened();
  unsubscribeAllClosed();
  dialog.closeAll();
});
</script>

<template>
  <div class="wrap">
    <div class="buttons">
      <button type="button" class="doc-btn primary" @click="openDialog('dialog-a')">
        打开对话框 A
      </button>
      <button type="button" class="doc-btn" @click="closeAll">closeAll</button>
      <button type="button" class="doc-btn" @click="queryById">getDialogById('dialog-a')</button>
    </div>

    <div class="info">
      当前打开（后进优先）：{{ openDialogs.length ? openDialogs.map(d => d.id).join(' → ') : '无' }}
    </div>

    <p class="hint">
      三层对话框按阶梯错开排布、互不遮挡，便于观察层级；在 A 内继续打开 B、在 B 内打开无遮罩的 C，每层对话框内都有实时层级读条。
      点击对话框外的真实遮罩区域只关闭最上层对话框。对话框打开后页面按钮被遮罩盖住，属于正常模态行为。
    </p>
    <div class="doc-output">{{ log.join('\n') || '打开对话框观察服务级事件流与层级变化' }}</div>
    <p class="hint">{{ queryResult || 'getDialogById 可查询任意已打开对话框' }}</p>
  </div>
</template>

<style scoped>
.wrap {
  width: 100%;
}

.buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 10px;
}

.info {
  margin-bottom: 8px;
  font-size: 12px;
  color: var(--doc-primary);
}

.hint {
  margin: 8px 0 0;
  color: var(--doc-muted);
  font-size: 12px;
}
</style>
