<script setup lang="ts">
import {h, ref} from 'vue';
import {useDialog, type DialogRef} from 'vue-cdk/dialog';
import ConfirmDialog from './dialog/ConfirmDialog.vue';
import DataDialog from './dialog/DataDialog.vue';
import NestedDialog from './dialog/NestedDialog.vue';
import CustomDialogContainer from './dialog/CustomDialogContainer.vue';

defineProps<{id?: string}>();

const dialog = useDialog();
const lastResult = ref('');
const autoFocusMode = ref<'first-tabbable' | 'dialog' | 'first-heading' | 'none'>(
  'first-tabbable',
);
const restoreFocus = ref(true);

/** 收集关闭结果到页签底部的日志区。 */
function trackResult(dialogRef: DialogRef, fallback: string): void {
  dialogRef.closed.subscribe(result => {
    lastResult.value = String(result ?? fallback);
  });
}

/** 场景一：组件对话框 + 结果回传（data 经 useDialogData 注入，关闭经 useDialogRef）。 */
function openConfirmDialog(): void {
  const ref = dialog.open(ConfirmDialog, {
    data: {title: '删除确认', message: '确定要删除这条记录吗？该操作不可撤销。'},
    panelClass: 'demo-dialog-panel',
  });
  trackResult(ref, '未返回结果');
}

/** 场景二：渲染函数内容（等价 Angular 的 TemplateRef）+ templateContext + $implicit。 */
function openRenderFnDialog(): void {
  const ref = dialog.open(
    (ctx: Record<string, unknown>) =>
      h('div', {class: 'render-dialog'}, [
        h('h3', null, '渲染函数内容（等价 TemplateRef）'),
        h('p', null, `templateContext 消息：${ctx.message}`),
        h('p', null, `$implicit（data）：${(ctx.$implicit as {name: string}).name}`),
        h('div', {class: 'render-dialog-actions'}, [
          h(
            'button',
            {
              class: 'btn primary',
              onClick: () => (ctx.dialogRef as DialogRef).close('渲染函数返回结果'),
            },
            '关闭并返回',
          ),
        ]),
      ]),
    {
      data: {name: 'Vue CDK'},
      templateContext: {message: 'Hello from templateContext'},
      panelClass: 'demo-dialog-panel',
    },
  );
  trackResult(ref, '');
}

/** 场景三：data 双通道——contentProps（props）与 DIALOG_DATA（inject）。 */
function openDataDialog(): void {
  dialog.open(DataDialog, {
    data: {label: 'inject 通道：useDialogData()'},
    contentProps: {fromProps: 'props 通道：contentProps'},
    panelClass: 'demo-dialog-panel',
  });
}

/** 场景四：disableClose + closePredicate——3 秒后放行关闭，ESC/遮罩始终无效。 */
let allowClose = false;
function openGuardedDialog(): void {
  allowClose = false;
  const ref = dialog.open(ConfirmDialog, {
    data: {
      title: '受保护的对话框',
      message:
        'disableClose 已开启：ESC 与遮罩点击均无效。closePredicate 放行前，“确定”也会被阻止；3 秒后自动放行。',
    },
    disableClose: true,
    closePredicate: () => allowClose,
    panelClass: 'demo-dialog-panel',
  });
  trackResult(ref, '');
  setTimeout(() => {
    allowClose = true;
  }, 3000);
}

/** 场景五：autoFocus 四种模式 + restoreFocus 开关。 */
function openAutoFocusDialog(): void {
  const focusTarget = autoFocusMode.value;
  const messages: Record<typeof focusTarget, string> = {
    'first-tabbable': 'autoFocus=first-tabbable（默认）：打开后聚焦第一个可 Tab 元素。',
    dialog: 'autoFocus=dialog：打开后聚焦对话框根元素。',
    'first-heading': 'autoFocus=first-heading：打开后聚焦第一个标题（h1-h6）。',
    none: 'autoFocus=false：不主动聚焦内容元素。',
  };
  dialog.open(ConfirmDialog, {
    data: {title: '焦点管理', message: messages[focusTarget]},
    autoFocus: focusTarget === 'none' ? false : focusTarget,
    restoreFocus: restoreFocus.value,
    panelClass: 'demo-dialog-panel',
  });
}

/** 场景六：尺寸 / 无遮罩。 */
function openSizedDialog(): void {
  dialog.open(DataDialog, {
    data: {label: 'inject 通道：宽 520px、高 260px、无遮罩'},
    contentProps: {fromProps: 'props 通道：宽 520px、高 260px'},
    hasBackdrop: false,
    width: '520px',
    height: '260px',
    panelClass: 'demo-dialog-panel',
  });
}

/** 场景七：自定义容器（复用 useDialogContainerCore）。 */
function openCustomContainerDialog(): void {
  dialog.open(DataDialog, {
    container: CustomDialogContainer,
    data: {label: 'inject 通道：自定义容器'},
    contentProps: {fromProps: 'props 通道：自定义容器透传'},
    panelClass: 'demo-dialog-panel',
  });
}

/** 场景八：堆叠对话框——从对话框内再打开一层。 */
function openNestedDialog(): void {
  const ref = dialog.open(NestedDialog, {panelClass: 'demo-dialog-panel'});
  trackResult(ref, '');
}

/** 场景九：alertdialog 角色与 ARIA 属性。 */
function openAlertDialog(): void {
  dialog.open(ConfirmDialog, {
    role: 'alertdialog',
    ariaModal: true,
    ariaLabel: '危险操作',
    ariaDescribedBy: 'alert-desc',
    data: {
      title: '危险操作',
      message:
        '这是 role="alertdialog" 演示：根元素带 aria-modal、aria-label 与 aria-describedby。',
    },
    panelClass: 'demo-dialog-panel',
  });
}
</script>

<template>
  <section :id="id" class="section">
    <h2>Dialog 对话框<span class="badge">vue-cdk/dialog · 对齐 Angular CDK</span></h2>
    <p class="desc">
      命令式 <code>useDialog()</code> 打开对话框：组件 / 渲染函数 / VNode 内容、data 双通道、
      disableClose / closePredicate、autoFocus / restoreFocus、自定义容器、堆叠与 ARIA。
      结构样式自动注入，内容与样式由使用方自定义。
    </p>

    <div class="scenario-grid">
      <div class="scenario">
        <h3>① 组件对话框 + 结果回传</h3>
        <p class="scenario-desc">data 经 useDialogData 注入，内容内 useDialogRef().close(result) 返回值。</p>
        <button class="btn primary" @click="openConfirmDialog">打开确认对话框</button>
      </div>

      <div class="scenario">
        <h3>② 渲染函数内容 + templateContext</h3>
        <p class="scenario-desc">渲染函数内容等价 TemplateRef，可访问 $implicit（data）与 dialogRef。</p>
        <button class="btn primary" @click="openRenderFnDialog">打开渲染函数对话框</button>
      </div>

      <div class="scenario">
        <h3>③ data 双通道</h3>
        <p class="scenario-desc">同一份数据既可通过 contentProps（props）也可通过 DIALOG_DATA（inject）读取。</p>
        <button class="btn primary" @click="openDataDialog">打开数据演示</button>
      </div>

      <div class="scenario">
        <h3>④ disableClose + closePredicate</h3>
        <p class="scenario-desc">ESC 与遮罩点击无效；“确定”在放行前被 closePredicate 阻止，3 秒后放行。</p>
        <button class="btn primary" @click="openGuardedDialog">打开受保护对话框</button>
      </div>

      <div class="scenario">
        <h3>⑤ autoFocus / restoreFocus</h3>
        <p class="scenario-desc">选择打开后的聚焦目标；关闭时按 restoreFocus 恢复打开前的焦点。</p>
        <div class="scenario-controls">
          <label v-for="mode in ['first-tabbable', 'dialog', 'first-heading', 'none']" :key="mode" class="radio">
            <input v-model="autoFocusMode" type="radio" name="autofocus" :value="mode" />
            <span>{{ mode }}</span>
          </label>
          <label class="checkbox">
            <input v-model="restoreFocus" type="checkbox" />
            <span>restoreFocus</span>
          </label>
        </div>
        <button class="btn primary" @click="openAutoFocusDialog">打开焦点演示</button>
      </div>

      <div class="scenario">
        <h3>⑥ 尺寸 / 无遮罩</h3>
        <p class="scenario-desc">width / height 直接应用，hasBackdrop=false 时无遮罩、可点击背景。</p>
        <button class="btn primary" @click="openSizedDialog">打开 520×260 对话框</button>
      </div>

      <div class="scenario">
        <h3>⑦ 自定义容器</h3>
        <p class="scenario-desc">config.container 传入自定义容器组件，复用 useDialogContainerCore 获得焦点与注入行为。</p>
        <button class="btn primary" @click="openCustomContainerDialog">打开自定义容器</button>
      </div>

      <div class="scenario">
        <h3>⑧ 堆叠对话框</h3>
        <p class="scenario-desc">从对话框内再打开一层；ESC 只关闭最上层，closeAll 可一次全部关闭。</p>
        <button class="btn primary" @click="openNestedDialog">打开堆叠演示</button>
      </div>

      <div class="scenario">
        <h3>⑨ alertdialog 角色</h3>
        <p class="scenario-desc">role="alertdialog" + aria-modal + aria-label + aria-describedby。</p>
        <button class="btn primary" @click="openAlertDialog">打开警示对话框</button>
      </div>
    </div>

    <div class="result-log">
      <span class="result-label">最近关闭结果：</span>
      <code>{{ lastResult || '（尚未关闭任何对话框）' }}</code>
    </div>
  </section>
</template>

<style scoped>
.badge {
  margin-left: 8px;
  padding: 2px 10px;
  border-radius: 999px;
  background: var(--demo-primary-soft);
  color: var(--demo-primary);
  font-size: 12px;
  font-weight: 500;
  vertical-align: 3px;
}

.scenario-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 14px;
  margin-bottom: 18px;
}

.scenario {
  border: 1px solid var(--demo-border);
  border-radius: 10px;
  padding: 16px;
  background: #fafbfe;
}

.scenario h3 {
  margin: 0 0 6px;
  font-size: 15px;
}

.scenario-desc {
  margin: 0 0 14px;
  color: var(--demo-muted);
  font-size: 13px;
  min-height: 40px;
}

.scenario-controls {
  display: flex;
  flex-wrap: wrap;
  gap: 8px 14px;
  margin-bottom: 14px;
  font-size: 13px;
}

.radio,
.checkbox {
  display: inline-flex;
  align-items: center;
  gap: 5px;
  cursor: pointer;
}

.result-log {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-radius: 8px;
  background: var(--demo-primary-soft);
  color: var(--demo-text);
  font-size: 14px;
}

.result-label {
  color: var(--demo-muted);
}
</style>
