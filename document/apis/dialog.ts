import type {ApiGroup} from '../api';

/** dialog 模块 API 分组：服务、配置、引用、注入与容器。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '服务与入口',
    rows: [
      {
        name: 'useDialog',
        signature: 'useDialog(): DialogApi',
        description:
          '组合式入口：在组件 setup 中调用会捕获应用上下文，使对话框内容可访问 app 级 provide。返回与 dialogService 相同的能力。',
      },
      {
        name: 'dialogService',
        signature: 'const dialogService = new Dialog()',
        description: '对话框服务模块级单例，适合在非组件环境（如 store、工具函数）中使用。',
      },
      {
        name: 'Dialog',
        signature: 'class Dialog implements DialogApi',
        description:
          '对话框服务：实现 DialogApi 全部能力；首个对话框打开时隐藏非 overlay 内容（aria-hidden），全部关闭后恢复。',
      },
      {
        name: 'DialogApi',
        signature: 'interface DialogApi',
        description:
          '对话框服务能力契约：open(content, config?)、closeAll()、getDialogById(id)、openDialogs、afterOpened、afterAllClosed。',
      },
      {
        name: 'DialogOpenOptions',
        signature: 'interface DialogOpenOptions { appContext?: AppContext | null; defaults?: DialogConfig | null }',
        description: 'open() 的 Vue 特有附加选项：渲染上下文与优先级高于内置默认值的默认配置。',
      },
    ],
  },
  {
    title: '配置',
    rows: [
      {
        name: 'DialogConfig',
        signature: 'class DialogConfig<D = unknown, R = unknown>',
        default: '—',
        description:
          '打开对话框的配置：id、role（dialog/alertdialog）、panelClass、hasBackdrop（默认 true）、backdropClass、disableClose、closePredicate、width/height/min/max 尺寸、positionStrategy（默认全局居中）、data、direction、ariaDescribedBy/ariaLabelledBy/ariaLabel/ariaModal、autoFocus（默认 first-tabbable）、restoreFocus（默认 true）、scrollStrategy（默认 block）、closeOnNavigation（默认 true）、closeOnDestroy、closeOnOverlayDetachments、disableAnimations、templateContext、container、contentProps。',
      },
      {
        name: 'DialogContent',
        signature: 'type DialogContent = Component | ((context) => VNode | VNode[] | null) | VNode',
        description:
          '可打开的内容：组件（SFC/defineComponent）、渲染函数（等价 Angular TemplateRef，上下文含 $implicit 与 dialogRef）或 VNode。',
      },
      {
        name: 'DialogRole',
        signature: "type DialogRole = 'dialog' | 'alertdialog'",
        description: '对话框根元素的合法 ARIA role。',
      },
      {
        name: 'AutoFocusTarget',
        signature: "type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading'",
        description: '打开时的自动聚焦目标：对话框根 / 第一个可 Tab 元素 / 第一个标题。',
      },
      {
        name: 'RestoreFocusValue',
        signature: 'type RestoreFocusValue = boolean | string | HTMLElement',
        description: '关闭后的焦点恢复：true 恢复为打开前聚焦元素、false 不恢复、字符串按 CSS 选择器、HTMLElement 为指定元素。',
      },
      {
        name: 'DialogContainerInstance',
        signature: 'interface DialogContainerInstance',
        description: '容器实例契约：_closeInteractionType、_recaptureFocus、element、contentComponentInstance，自定义容器经 onContainerReady 暴露。',
      },
    ],
  },
  {
    title: '引用',
    rows: [
      {
        name: 'DialogRef',
        signature: 'class DialogRef<R = unknown, C = unknown>',
        description:
          '已打开对话框的引用：close(result?, { focusOrigin? }) 关闭（幂等）；事件流 closed/backdropClick/keydownEvents/outsidePointerEvents（关闭时 complete）；updatePosition()/updateSize()/addPanelClass()/removePanelClass()；属性 id、disableClose、componentInstance、containerInstance、overlayRef、config。',
      },
      {
        name: 'DialogCloseOptions',
        signature: 'interface DialogCloseOptions { focusOrigin?: FocusOrigin }',
        description: '关闭选项：focusOrigin 用于关闭后恢复焦点时的样式归因。',
      },
    ],
  },
  {
    title: '注入与内容通道',
    rows: [
      {
        name: 'DIALOG_DATA',
        signature: 'const DIALOG_DATA: InjectionKey<unknown>',
        description: '对话框数据注入键；内容组件可通过 useDialogData() 读取 config.data。',
      },
      {
        name: 'DIALOG_REF',
        signature: 'const DIALOG_REF: InjectionKey<DialogRef>',
        description: '对话框引用注入键；内容组件可通过 useDialogRef() 读取当前引用。',
      },
      {
        name: 'DEFAULT_DIALOG_CONFIG',
        signature: 'const DEFAULT_DIALOG_CONFIG: InjectionKey<DialogConfig>',
        description: '全局默认配置注入键；app.provide 后作为 open() 的默认配置。',
      },
      {
        name: 'useDialogData',
        signature: 'useDialogData<D = unknown>(): D',
        description: '在对话框内容组件（或其子组件）内读取打开时传入的数据（inject 通道）。',
      },
      {
        name: 'useDialogRef',
        signature: 'useDialogRef<R = unknown, C = unknown>(): DialogRef<R, C>',
        description: '在对话框内容组件内读取当前 DialogRef，用于主动关闭或监听事件；在内容之外调用会抛出错误。',
      },
    ],
  },
  {
    title: '容器',
    rows: [
      {
        name: 'VDialogContainer',
        signature: 'component VDialogContainer',
        description:
          '内置对话框容器：内置焦点陷阱、autoFocus/restoreFocus、ARIA 属性、滚动锁定与数据注入。接收 config/dialogRef/content/onContainerReady 四个 props。',
      },
      {
        name: 'useDialogContainerCore',
        signature: 'useDialogContainerCore(props: VDialogContainerProps): { containerEl; instance; trapFocus(); restoreFocus(); captureContentRef() }',
        description:
          '容器行为组合式函数：自定义容器复用默认能力（provide DIALOG_DATA/DIALOG_REF、焦点陷阱、ARIA、焦点恢复）。须在自定义容器 setup 中调用，并把 containerEl 绑定到根元素。',
      },
      {
        name: 'VDialogContainerProps',
        signature: 'interface VDialogContainerProps { config: DialogConfig; dialogRef: DialogRef; content: DialogContent; onContainerReady? }',
        description: '容器组件接收的 props 契约，服务打开对话框时统一注入。',
      },
      {
        name: 'normalizeDialogContent',
        signature: 'normalizeDialogContent(content: DialogContent, config: DialogConfig, dialogRef: DialogRef, onComponentInstance?): VNode',
        description:
          '把对话框内容归一化为单根 VNode：渲染函数按上下文调用、VNode 原样返回、组件透传 contentProps。函数一律按渲染函数处理，函数式组件请用 defineComponent 包装。',
      },
    ],
  },
  {
    title: '样式',
    rows: [
      {
        name: 'injectDialogStyles',
        signature: 'injectDialogStyles(): void',
        description: '注入对话框结构样式（幂等）。',
      },
      {
        name: 'removeInjectedDialogStyles',
        signature: 'removeInjectedDialogStyles(): void',
        description: '移除已注入的对话框结构样式。',
      },
      {
        name: 'vcdkDialogStyles',
        signature: 'const vcdkDialogStyles: string',
        description: '对话框结构样式源码。',
      },
    ],
  },
];
