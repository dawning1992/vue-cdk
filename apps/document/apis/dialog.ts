import type {ApiGroup} from '../api';

/** dialog 模块 API 分组：服务、配置、引用、注入与容器。 */
export const apiGroups: readonly ApiGroup[] = [
  {
    title: '服务与入口', titleEn: 'Service and entry points',
    rows: [
      {
        name: 'useDialog',
        signature: 'useDialog(): DialogApi',
        description:
          '组合式入口：在组件 setup 中调用会捕获应用上下文，使对话框内容可访问 app 级 provide。返回与 dialogService 相同的能力。',
        descriptionEn:
          'Composable entry point that captures the app context when called in component setup, allowing dialog content to access app-level provides. Returns the same capabilities as dialogService.',
      },
      {
        name: 'dialogService',
        signature: 'const dialogService = new Dialog()',
        description: '对话框服务模块级单例，适合在非组件环境（如 store、工具函数）中使用。',
        descriptionEn: 'Module-level dialog service singleton for non-component environments such as stores and utility functions.',
      },
      {
        name: 'Dialog',
        signature: 'class Dialog implements DialogApi',
        description:
          '对话框服务：实现 DialogApi 全部能力；多个对话框共享唯一遮罩并统一管理 z-index 栈（后开对话框的遮罩插在两层窗口之间并遮住下层，关闭顶层后 z-index 回落、下一层浮出）；首个对话框打开时隐藏非 overlay 内容（aria-hidden），全部关闭后恢复。遮罩外观（backdropClass）跟随顶层参与对话框；限制：容器模式（浏览器不支持 popover）下非对话框浮层不参与 z-index 管理，可能落在对话框之下，popover 模式不受影响。',
        descriptionEn:
          'Dialog service implementing DialogApi. Multiple dialogs share one backdrop and a managed z-index stack; the top dialog backdrop sits between windows and lower dialogs reappear when the top closes. Non-overlay content is aria-hidden while the first dialog is open and restored after all close. The backdropClass follows the top participating dialog. In container mode, non-dialog overlays are not included in z-index management and may appear below dialogs; popover mode is unaffected.',
      },
      {
        name: 'DialogApi',
        signature: 'interface DialogApi',
        description:
          '对话框服务能力契约，useDialog() 与 dialogService 共用：open<R, D, C>(content, config?) 打开对话框并返回 DialogRef（id 与已打开对话框重复时抛错）；closeAll() 按后进先出顺序关闭全部对话框；getDialogById(id) 按 id 查找已打开对话框；openDialogs 为当前打开的对话框列表（后打开的排末尾）；afterOpened 为打开事件流；afterAllClosed 为全部关闭完成事件流（订阅时无打开对话框会立即触发一次）。',
        descriptionEn:
          'Shared service contract for useDialog() and dialogService: open<R, D, C>(content, config?) returns a DialogRef and throws on duplicate ids; closeAll() closes dialogs in LIFO order; getDialogById(id) looks up an open dialog; openDialogs lists current dialogs; afterOpened emits open events; afterAllClosed emits when all dialogs finish closing and fires once immediately when subscribed with none open.',
      },
      {
        name: 'DialogOpenOptions',
        signature: 'interface DialogOpenOptions { appContext?: AppContext | null; defaults?: DialogConfig | null }',
        description: 'open() 的 Vue 特有附加选项：渲染上下文与优先级高于内置默认值的默认配置。',
        descriptionEn: 'Vue-specific open() options for the render context and defaults that take precedence over built-in defaults.',
      },
    ],
  },
  {
    title: '配置', titleEn: 'Configuration',
    rows: [
      {
        name: 'DialogConfig',
        signature: 'class DialogConfig<D = unknown, R = unknown>',
        default: '—',
        description:
          '打开对话框的配置：id、role（dialog/alertdialog）、panelClass、hasBackdrop（默认 true）、backdropClass、disableClose、closePredicate、width/height/min/max 尺寸、positionStrategy（默认全局居中）、data、direction、ariaDescribedBy/ariaLabelledBy/ariaLabel/ariaModal、autoFocus（默认 first-tabbable）、restoreFocus（默认 true）、scrollStrategy（默认 block）、closeOnNavigation（默认 true）、closeOnDestroy、closeOnOverlayDetachments、disableAnimations、templateContext、container、contentProps。',
        descriptionEn:
          'Dialog configuration: id and role (dialog/alertdialog); panelClass, hasBackdrop (true by default), and backdropClass; disableClose and closePredicate; width, height, min/max dimensions; positionStrategy (globally centered by default); data and direction; ariaDescribedBy, ariaLabelledBy, ariaLabel, and ariaModal; autoFocus (first-tabbable by default) and restoreFocus (true by default); scrollStrategy (block by default); closeOnNavigation (true by default), closeOnDestroy, and closeOnOverlayDetachments; disableAnimations; templateContext, container, and contentProps.',
      },
      {
        name: 'DialogContent',
        signature: 'type DialogContent = Component | ((context) => VNode | VNode[] | null) | VNode',
        description:
          '可打开的内容：组件（SFC/defineComponent）、渲染函数（等价 Angular TemplateRef，上下文含 $implicit 与 dialogRef）或 VNode。',
        descriptionEn:
          'Openable content: a component (SFC/defineComponent), render function (Angular TemplateRef equivalent with $implicit and dialogRef), or VNode.',
      },
      {
        name: 'DialogRole',
        signature: "type DialogRole = 'dialog' | 'alertdialog'",
        description: '对话框根元素的合法 ARIA role。',
        descriptionEn: 'Valid ARIA roles for the dialog root element.',
      },
      {
        name: 'AutoFocusTarget',
        signature: "type AutoFocusTarget = 'dialog' | 'first-tabbable' | 'first-heading'",
        description: '打开时的自动聚焦目标：对话框根 / 第一个可 Tab 元素 / 第一个标题。',
        descriptionEn: 'Automatic focus target on open: the dialog root, first tabbable element, or first heading.',
      },
      {
        name: 'RestoreFocusValue',
        signature: 'type RestoreFocusValue = boolean | string | HTMLElement',
        description: '关闭后的焦点恢复：true 恢复为打开前聚焦元素、false 不恢复、字符串按 CSS 选择器、HTMLElement 为指定元素。',
        descriptionEn: 'Focus restoration after close: true restores the previously focused element, false disables restoration, a string is a CSS selector, and HTMLElement selects an explicit target.',
      },
      {
        name: 'DialogContainerInstance',
        signature: 'interface DialogContainerInstance',
        description: '容器实例契约：_closeInteractionType、_recaptureFocus、element、contentComponentInstance，自定义容器经 onContainerReady 暴露。',
        descriptionEn: 'Container instance contract exposing _closeInteractionType, _recaptureFocus, element, and contentComponentInstance; custom containers receive it through onContainerReady.',
      },
    ],
  },
  {
    title: '引用', titleEn: 'References',
    rows: [
      {
        name: 'DialogRef',
        signature: 'class DialogRef<R = unknown, C = unknown>',
        description:
          '已打开对话框的引用：close(result?, { focusOrigin? }) 关闭（幂等）；closedPromise 在成功关闭后解析为关闭结果；事件流 closed/backdropClick/keydownEvents/outsidePointerEvents（关闭时 complete），backdropClick 在共享遮罩被点击且该对话框为顶层参与对话框时触发；updatePosition()/updateSize()/addPanelClass()/removePanelClass()；属性 id、disableClose、componentInstance、containerInstance、overlayRef、config（overlayRef.backdropElement 对对话框恒为 null，遮罩由 Dialog 服务统一持有）。',
        descriptionEn:
          'Reference to an open dialog: close(result?, { focusOrigin? }) is idempotent; closedPromise resolves with the close result; closed, backdropClick, keydownEvents, and outsidePointerEvents complete on close. backdropClick emits when the shared backdrop is clicked and this dialog is the top participating dialog. Also exposes updatePosition(), updateSize(), panel-class methods, and id/config/component/container references; overlayRef.backdropElement is always null because Dialog owns the shared backdrop.',
      },
      {
        name: 'DialogRef.closedPromise',
        signature: 'readonly closedPromise: Promise<R | undefined>',
        description:
          '等待当前对话框成功关闭并取得 close(result) 的结果。closePredicate 阻止关闭时保持待定，无结果关闭时解析为 undefined；Promise 不会 reject。',
        descriptionEn:
          'Waits for the dialog to close successfully and resolves with the close(result) value. It remains pending when closePredicate blocks closing, resolves to undefined without a result, and never rejects.',
      },
      {
        name: 'DialogCloseOptions',
        signature: 'interface DialogCloseOptions { focusOrigin?: FocusOrigin }',
        description: '关闭选项：focusOrigin 用于关闭后恢复焦点时的样式归因。',
        descriptionEn: 'Close options; focusOrigin annotates the focus origin used when restoring focus after closing.',
      },
    ],
  },
  {
    title: '注入与内容通道', titleEn: 'Injection and content channels',
    rows: [
      {
        name: 'DIALOG_DATA',
        signature: 'const DIALOG_DATA: InjectionKey<unknown>',
        description: '对话框数据注入键；内容组件可通过 useDialogData() 读取 config.data。',
        descriptionEn: 'Injection key for dialog data; content components can read config.data through useDialogData().',
      },
      {
        name: 'DIALOG_REF',
        signature: 'const DIALOG_REF: InjectionKey<DialogRef>',
        description: '对话框引用注入键；内容组件可通过 useDialogRef() 读取当前引用。',
        descriptionEn: 'Injection key for the dialog reference; content components can read the current reference through useDialogRef().',
      },
      {
        name: 'DEFAULT_DIALOG_CONFIG',
        signature: 'const DEFAULT_DIALOG_CONFIG: InjectionKey<DialogConfig>',
        description: '全局默认配置注入键；app.provide 后作为 open() 的默认配置。',
        descriptionEn: 'Injection key for global defaults; app.provide makes the value the default configuration for open().',
      },
      {
        name: 'useDialogData',
        signature: 'useDialogData<D = unknown>(): D',
        description: '在对话框内容组件（或其子组件）内读取打开时传入的数据（inject 通道）。',
        descriptionEn: 'Reads the data supplied when opening the dialog from a content component or descendant through injection.',
      },
      {
        name: 'useDialogRef',
        signature: 'useDialogRef<R = unknown, C = unknown>(): DialogRef<R, C>',
        description: '在对话框内容组件内读取当前 DialogRef，用于主动关闭或监听事件；在内容之外调用会抛出错误。',
        descriptionEn: 'Reads the current DialogRef inside dialog content for closing or event subscriptions; calling it outside dialog content throws.',
      },
    ],
  },
  {
    title: '容器', titleEn: 'Containers',
    rows: [
      {
        name: 'VDialogContainer',
        signature: 'component VDialogContainer',
        description:
          '内置对话框容器：内置焦点陷阱、autoFocus/restoreFocus、ARIA 属性、滚动锁定与数据注入。接收 config/dialogRef/content/onContainerReady 四个 props。',
        descriptionEn:
          'Built-in dialog container with focus trapping, autoFocus/restoreFocus, ARIA attributes, scroll locking, and data injection. It accepts config, dialogRef, content, and onContainerReady props.',
      },
      {
        name: 'useDialogContainerCore',
        signature: 'useDialogContainerCore(props: VDialogContainerProps): { containerEl; instance; trapFocus(); restoreFocus(); captureContentRef() }',
        description:
          '容器行为组合式函数：自定义容器复用默认能力（provide DIALOG_DATA/DIALOG_REF、焦点陷阱、ARIA、焦点恢复）。须在自定义容器 setup 中调用，并把 containerEl 绑定到根元素。',
        descriptionEn:
          'Composable for container behavior; custom containers reuse the default provides, focus trap, ARIA, and focus restoration. Call it in custom-container setup and bind containerEl to the root element.',
      },
      {
        name: 'VDialogContainerProps',
        signature: 'interface VDialogContainerProps { config: DialogConfig; dialogRef: DialogRef; content: DialogContent; onContainerReady? }',
        description: '容器组件接收的 props 契约，服务打开对话框时统一注入。',
        descriptionEn: 'Props contract supplied by the service when opening a dialog container.',
      },
      {
        name: 'normalizeDialogContent',
        signature: 'normalizeDialogContent(content: DialogContent, config: DialogConfig, dialogRef: DialogRef, onComponentInstance?): VNode',
        description:
          '把对话框内容归一化为单根 VNode：渲染函数按上下文调用、VNode 原样返回、组件透传 contentProps。函数一律按渲染函数处理，函数式组件请用 defineComponent 包装。',
        descriptionEn:
          'Normalizes dialog content to a single-root VNode: invokes render functions with context, returns VNodes unchanged, and forwards contentProps to components. Functions are always treated as render functions; wrap functional components with defineComponent.',
      },
    ],
  },
  {
    title: '样式', titleEn: 'Styling',
    rows: [
      {
        name: 'injectDialogStyles',
        signature: 'injectDialogStyles(): void',
        description: '注入对话框结构样式（幂等）。',
        descriptionEn: 'Injects dialog structural styles idempotently.',
      },
      {
        name: 'removeInjectedDialogStyles',
        signature: 'removeInjectedDialogStyles(): void',
        description: '移除已注入的对话框结构样式。',
        descriptionEn: 'Removes previously injected dialog structural styles.',
      },
      {
        name: 'vcdkDialogStyles',
        signature: 'const vcdkDialogStyles: string',
        description: '对话框结构样式源码。',
        descriptionEn: 'Source string for dialog structural styles.',
      },
    ],
  },
];
